import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useProducts } from "@/hooks/useProducts";
import { useSuppliers } from "@/hooks/useSuppliers";
import { supabase } from "@/integrations/supabase/client";
import { logAudit } from "@/hooks/useAuditLog";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { FileUp, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import type { TablesInsert } from "@/integrations/supabase/types";
import { formatCpfCnpjPartial, trimText } from "@/lib/format";

type XmlSupplier = { cnpj: string; name: string };

type ImportItem = {
  ean: string;
  xmlName: string;
  ncm: string;
  qty: number;
  cost: number;
  unit: string;
  existingId: string | null;
  existingName: string | null;
  existingStock: number;
  updateCost: boolean;
  addStock: boolean;
};

// Lê o primeiro elemento com o tag name dado (ignora namespace)
const getTag = (parent: Element | Document, tag: string): string =>
  parent.getElementsByTagName(tag)[0]?.textContent?.trim() ?? "";

const normalizeUnit = (xmlUnit: string): string => {
  const u = xmlUnit.toLowerCase();
  if (u === "kg" || u === "kgf") return "kg";
  if (u === "lt" || u === "l" || u === "lts") return "lt";
  if (u === "cx" || u === "caixa" || u === "cxs") return "cx";
  return "un";
};

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const XmlImport = () => {
  const { data: products = [] } = useProducts();
  const { data: suppliers = [] } = useSuppliers();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<1 | 2>(1);
  const [xmlSupplier, setXmlSupplier] = useState<XmlSupplier | null>(null);
  const [items, setItems] = useState<ImportItem[]>([]);
  const [matchedSupplierId, setMatchedSupplierId] = useState<string | null>(null);
  const [createNewSupplier, setCreateNewSupplier] = useState(false);
  const [applying, setApplying] = useState(false);

  const parseXml = (text: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "text/xml");

    const parseError = doc.querySelector("parsererror");
    if (parseError) {
      toast.error("XML inválido. Verifique o arquivo.");
      return;
    }

    // Emitente
    const emitEl = doc.getElementsByTagName("emit")[0];
    const supplier: XmlSupplier = {
      cnpj: formatCpfCnpjPartial(getTag(emitEl ?? doc, "CNPJ")),
      name: getTag(emitEl ?? doc, "xNome") || getTag(emitEl ?? doc, "xFant") || "Fornecedor desconhecido",
    };
    setXmlSupplier(supplier);

    // Tentar encontrar fornecedor pelo CNPJ
    const cnpjClean = supplier.cnpj.replace(/\D/g, "");
    const found = suppliers.find((s) => (s.cnpj ?? "").replace(/\D/g, "") === cnpjClean);
    setMatchedSupplierId(found?.id ?? null);
    setCreateNewSupplier(!found);

    // Produtos (det)
    const dets = doc.getElementsByTagName("det");
    const parsedItems: ImportItem[] = [];

    for (let i = 0; i < dets.length; i++) {
      const det = dets[i];
      const prodEl = det.getElementsByTagName("prod")[0];
      if (!prodEl) continue;

      const ean = getTag(prodEl, "cEAN");
      const xmlName = getTag(prodEl, "xProd");
      const ncm = getTag(prodEl, "NCM");
      const qty = parseFloat(getTag(prodEl, "qCom").replace(",", ".")) || 0;
      const cost = parseFloat(getTag(prodEl, "vUnCom").replace(",", ".")) || 0;
      const unit = normalizeUnit(getTag(prodEl, "uCom"));

      // Verificar se produto já existe pelo EAN
      const existing = ean && ean !== "SEM GTIN"
        ? products.find((p) => p.barcode === ean)
        : null;

      parsedItems.push({
        ean,
        xmlName,
        ncm,
        qty,
        cost,
        unit,
        existingId: existing?.id ?? null,
        existingName: existing?.name ?? null,
        existingStock: existing?.stock_quantity ?? 0,
        updateCost: true,
        addStock: true,
      });
    }

    if (parsedItems.length === 0) {
      toast.error("Nenhum produto encontrado no XML.");
      return;
    }

    setItems(parsedItems);
    setStep(2);
  };

  const handleFile = (file: File) => {
    if (!file.name.endsWith(".xml")) {
      toast.error("Selecione um arquivo .xml");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      parseXml(text);
    };
    reader.readAsText(file, "utf-8");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const toggleItem = (idx: number, field: "updateCost" | "addStock") => {
    setItems((prev) => prev.map((it, i) => i === idx ? { ...it, [field]: !it[field] } : it));
  };

  const generateNextSku = () => {
    const nums = products.map((p) => parseInt(p.sku.replace(/\D/g, ""), 10)).filter((n) => !isNaN(n) && n > 0);
    return Math.max(0, ...nums) + 1;
  };

  const handleApply = async () => {
    setApplying(true);
    let errors = 0;
    try {
      // 1. Garantir fornecedor
      let supplierId: string | null = matchedSupplierId;
      if (!matchedSupplierId && createNewSupplier && xmlSupplier) {
        const { data: newSupplier, error } = await supabase
          .from("suppliers")
          .insert({ name: trimText(xmlSupplier.name), cnpj: xmlSupplier.cnpj } as TablesInsert<"suppliers">)
          .select()
          .single();
        if (error) throw error;
        supplierId = newSupplier.id;
        qc.invalidateQueries({ queryKey: ["suppliers"] });
        logAudit("supplier", newSupplier.id, newSupplier.name, "create", { source: "xml_import" });
      }

      let skuCounter = generateNextSku();

      // 2. Processar cada produto
      for (const item of items) {
        try {
          if (item.existingId) {
            // Produto existente
            if (item.updateCost) {
              await supabase.from("products").update({ cost_price: item.cost }).eq("id", item.existingId);
            }
            // Backfill NCM se produto ainda não tem
            if (item.ncm) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              await (supabase as any).from("products").update({ ncm: trimText(item.ncm) }).eq("id", item.existingId).is("ncm", null);
            }
            if (item.addStock && item.qty > 0) {
              const newQty = item.existingStock + item.qty;
              await supabase.from("stock_movements").insert({
                product_id: item.existingId,
                type: "adjustment_in",
                quantity: item.qty,
                previous_qty: item.existingStock,
                new_qty: newQty,
                origin: "xml_import",
                reason: "NF-e importada",
              } as TablesInsert<"stock_movements">);
              await supabase.from("products").update({ stock_quantity: newQty }).eq("id", item.existingId);
            }
          } else {
            // Produto novo
            const sku = String(skuCounter++).padStart(6, "0");
            const { data: newProduct, error } = await (supabase as any).from("products").insert({
              name: trimText(item.xmlName),
              sku,
              barcode: item.ean && item.ean !== "SEM GTIN" ? trimText(item.ean) : null,
              cost_price: item.cost,
              sale_price: parseFloat((item.cost * 1.3).toFixed(2)),
              stock_quantity: item.qty,
              min_stock: 0,
              unit: item.unit,
              supplier_id: supplierId,
              is_active: true,
              ncm: trimText(item.ncm) || null,
            }).select().single();

            if (error || !newProduct) {
              errors++;
              continue;
            }

            if (item.qty > 0) {
              await supabase.from("stock_movements").insert({
                product_id: newProduct.id,
                type: "adjustment_in",
                quantity: item.qty,
                previous_qty: 0,
                new_qty: item.qty,
                origin: "xml_import",
                reason: "NF-e importada - produto novo",
              } as TablesInsert<"stock_movements">);
            }
            logAudit("product", newProduct.id, newProduct.name, "create", { source: "xml_import", sku });
          }
        } catch {
          errors++;
        }
      }

      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["stock_movements"] });

      if (errors > 0) {
        toast.warning(`Importação concluída com ${errors} erro(s). ${items.length - errors} produto(s) processado(s).`);
      } else {
        toast.success(`Importação concluída! ${items.length} produto(s) processado(s).`);
      }

      // Reset
      setStep(1);
      setItems([]);
      setXmlSupplier(null);
      setMatchedSupplierId(null);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Erro desconhecido";
      toast.error(`Erro na importação: ${message}`);
    } finally {
      setApplying(false);
    }
  };

  const existingCount = items.filter((i) => i.existingId).length;
  const newCount = items.length - existingCount;

  if (step === 1) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Importar XML (NF-e)</h1>
          <p className="text-muted-foreground text-sm">Importe produtos e estoque a partir de uma nota fiscal eletrônica.</p>
        </div>

        <div
          className="border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-primary hover:bg-muted/30 transition-colors"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileRef.current?.click()}
        >
          <FileUp className="h-12 w-12 text-muted-foreground" />
          <div className="text-center">
            <p className="font-medium">Arraste um arquivo XML aqui</p>
            <p className="text-sm text-muted-foreground">ou clique para selecionar</p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".xml"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
        </div>

        <div className="rounded-lg border p-4 text-sm space-y-1 text-muted-foreground">
          <p className="font-medium text-foreground">O que será processado:</p>
          <p>• Fornecedor: identificado pelo CNPJ do emitente</p>
          <p>• Produtos existentes (por EAN): custo e estoque atualizáveis</p>
          <p>• Produtos novos: criados com nome, EAN, custo e quantidade da NF-e</p>
          <p>• Preço de venda dos novos: custo + 30% (ajustável depois)</p>
        </div>
      </div>
    );
  }

  // Step 2: Preview
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Importar XML — Preview</h1>
          <p className="text-muted-foreground text-sm">
            {existingCount} produto(s) existente(s) · {newCount} produto(s) novo(s)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setStep(1); setItems([]); }}>Cancelar</Button>
          <Button onClick={handleApply} disabled={applying}>
            {applying && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Aplicar Importação
          </Button>
        </div>
      </div>

      {/* Fornecedor */}
      {xmlSupplier && (
        <div className="rounded-lg border p-3 space-y-1 text-sm">
          <p className="font-medium">Fornecedor da NF-e</p>
          <p className="text-muted-foreground">{trimText(xmlSupplier.name)} — CNPJ: {xmlSupplier.cnpj}</p>
          {matchedSupplierId ? (
            <p className="text-emerald-600 flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Fornecedor encontrado no cadastro</p>
          ) : (
            <div className="flex items-center gap-2">
              <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-amber-600">Fornecedor não cadastrado.</span>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <Checkbox
                  checked={createNewSupplier}
                  onCheckedChange={(v) => setCreateNewSupplier(!!v)}
                />
                <span>Criar fornecedor</span>
              </label>
            </div>
          )}
        </div>
      )}

      {/* Tabela de produtos */}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>EAN</TableHead>
              <TableHead>Nome no XML</TableHead>
              <TableHead>NCM</TableHead>
              <TableHead className="text-right">Qtd</TableHead>
              <TableHead className="text-right">Custo Unit.</TableHead>
              <TableHead className="text-center">Atualizar custo</TableHead>
              <TableHead className="text-center">Adicionar estoque</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, idx) => (
              <TableRow key={idx}>
                <TableCell>
                  {item.existingId ? (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-400 rounded-md px-2 py-0.5 font-medium">
                      <CheckCircle2 className="h-3 w-3" /> Existente
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-blue-700 bg-blue-100 dark:bg-blue-900/40 dark:text-blue-400 rounded-md px-2 py-0.5 font-medium">
                      + Novo
                    </span>
                  )}
                </TableCell>
                <TableCell className="font-mono text-xs">{item.ean || "—"}</TableCell>
                <TableCell className="text-sm">
                  <div>{item.xmlName}</div>
                  {item.existingName && item.existingName !== item.xmlName && (
                    <div className="text-xs text-muted-foreground">Cadastrado: {item.existingName}</div>
                  )}
                </TableCell>
                <TableCell className="font-mono text-xs">{item.ncm || "—"}</TableCell>
                <TableCell className="text-right tabular-nums">{item.qty}</TableCell>
                <TableCell className="text-right tabular-nums">{fmt(item.cost)}</TableCell>
                <TableCell className="text-center">
                  {item.existingId ? (
                    <div className="flex justify-center">
                      <Checkbox
                        checked={item.updateCost}
                        onCheckedChange={() => toggleItem(idx, "updateCost")}
                      />
                    </div>
                  ) : <span className="text-muted-foreground text-xs">—</span>}
                </TableCell>
                <TableCell className="text-center">
                  {item.existingId ? (
                    <div className="flex justify-center">
                      <Checkbox
                        checked={item.addStock}
                        onCheckedChange={() => toggleItem(idx, "addStock")}
                      />
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">Auto ({item.qty})</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Inputs extras (nome para new products) */}
      {newCount > 0 && (
        <div className="rounded-lg border p-3 text-sm text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">Produtos novos serão criados com:</p>
          <p>• Nome e EAN conforme a NF-e</p>
          <p>• Preço de venda = custo × 1,30 (margem de 30%)</p>
          <p>• SKU gerado automaticamente</p>
          <p>• Estoque inicial conforme quantidade da NF-e</p>
          <p>• Ajuste os detalhes depois em Produtos</p>
        </div>
      )}

    </div>
  );
};

export default XmlImport;
