import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { fetchCosmosProduct } from "@/services/cosmos";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { NotFoundException } from "@zxing/library";
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct, type Product } from "@/hooks/useProducts";
import { useCategories, useCreateCategory } from "@/hooks/useCategories";
import { useSuppliers, useCreateSupplier } from "@/hooks/useSuppliers";
import { logAudit } from "@/hooks/useAuditLog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/StatusBadge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Search, Pencil, Trash2, Loader2, ScanLine, X, Camera, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert } from "@/integrations/supabase/types";
import { toast } from "sonner";

type ProductForm = {
  name: string; sku: string; barcode: string;
  cost_price: string; sale_price: string;
  stock_quantity: number; min_stock: number; unit: string; is_active: boolean;
  category_id: string | null; supplier_id: string | null;
  ncm: string; ncm_loading: boolean; cfop: string;
};

const toInput = (n: number) => (n === 0 ? "" : String(n).replace(".", ","));
const fromInput = (s: string) => parseFloat(s.replace(",", ".")) || 0;

const emptyForm: ProductForm = {
  name: "", sku: "", barcode: "", cost_price: "", sale_price: "",
  stock_quantity: 0, min_stock: 0, unit: "un", is_active: true,
  category_id: null, supplier_id: null,
  ncm: "", ncm_loading: false, cfop: "5102",
};

const Products = () => {
  const { data: products = [], isLoading } = useProducts();
  const { data: categories = [] } = useCategories();
  const { data: suppliers = [] } = useSuppliers();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const createCategory = useCreateCategory();
  const createSupplier = useCreateSupplier();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ProductForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);

  // Quick-create de categoria/fornecedor
  const [quickCreate, setQuickCreate] = useState<"category" | "supplier" | null>(null);
  const [quickName, setQuickName] = useState("");

  const [photoLoading, setPhotoLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0 });

  // Alteração em massa
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkActionOpen, setBulkActionOpen] = useState(false);
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState<"price" | "status" | "category" | null>(null);
  const [bulkPriceMode, setBulkPriceMode] = useState<"percent" | "fixed">("percent");
  const [bulkPriceDirection, setBulkPriceDirection] = useState<"increase" | "decrease">("increase");
  const [bulkPriceValue, setBulkPriceValue] = useState("");
  const [bulkStatusValue, setBulkStatusValue] = useState(true);
  const [bulkCategoryId, setBulkCategoryId] = useState<string | null>(null);
  const [bulkEditProgress, setBulkEditProgress] = useState({ done: 0, total: 0 });
  const [bulkEditLoading, setBulkEditLoading] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Lista de categorias ordenada hierarquicamente para o seletor do form
  const orderedCategories = useMemo(() => {
    const roots = categories.filter((c) => !c.parent_id).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    return roots.flatMap((root) => [
      root,
      ...categories.filter((c) => c.parent_id === root.id).sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
    ]);
  }, [categories]);

  // Filtro de categoria inclui subcategorias
  const getSubtree = useCallback((catId: string) => {
    return [catId, ...categories.filter((c) => c.parent_id === catId).map((c) => c.id)];
  }, [categories]);

  const generateSku = () => {
    const nums = products
      .map((p) => parseInt(p.sku.replace(/\D/g, ""), 10))
      .filter((n) => !isNaN(n) && n > 0);
    const max = nums.length > 0 ? Math.max(...nums) : 0;
    return String(max + 1).padStart(6, "0");
  };

  const stopScanner = useCallback(() => {
    if (readerRef.current) {
      BrowserMultiFormatReader.releaseAllStreams();
      readerRef.current = null;
    }
    setScannerOpen(false);
  }, []);

  const analyzePhoto = async (file: File) => {
    setPhotoLoading(true);
    const toastId = toast.loading("Analisando foto com IA...");
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke("analyze-product-photo", {
        body: { imageBase64: base64, mediaType: file.type || "image/jpeg" },
      });

      if (error) throw error;

      const name: string = data?.name ?? "";
      const barcode: string = data?.barcode ?? "";

      // Busca NCM pelo código de barras automaticamente após a análise da foto
      let ncmFromCosmos = "";
      if (barcode && barcode.length >= 8) {
        toast.loading("Buscando NCM pelo código de barras...", { id: toastId });
        const cosmosResult = await fetchCosmosProduct(barcode);
        if (cosmosResult?.ncm?.code) {
          ncmFromCosmos = cosmosResult.ncm.code;
        }
      }

      setEditing((prev) => ({
        ...prev,
        name: name || prev.name,
        barcode: barcode || prev.barcode,
        ncm: ncmFromCosmos || prev.ncm,
      }));
      setDialogOpen(true);

      const successMsg = ncmFromCosmos
        ? `Produto identificado! NCM preenchido: ${ncmFromCosmos}`
        : "Produto identificado! Revise e salve.";
      toast.success(successMsg, { id: toastId });
    } catch (err: any) {
      const msg = err?.message ?? err?.error_description ?? JSON.stringify(err) ?? "Erro desconhecido";
      console.error("[analyze-product-photo]", err);
      toast.error(`Erro: ${msg}`, { id: toastId });
    } finally {
      setPhotoLoading(false);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  };

  const openPhotoCapture = () => {
    setEditing({ ...emptyForm, sku: generateSku() });
    setEditingId(null);
    photoInputRef.current?.click();
  };

  useEffect(() => {
    if (!scannerOpen || !videoRef.current) return;

    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    reader.decodeFromConstraints(
      { video: { facingMode: "environment" } },
      videoRef.current,
      (result, error) => {
        if (result) {
          setEditing((prev) => ({ ...prev, barcode: result.getText() }));
          stopScanner();
        } else if (error && !(error instanceof NotFoundException)) {
          // NotFoundException é esperado entre frames sem código visível, ignorar
        }
      }
    ).catch(() => {
      toast.error("Não foi possível acessar a câmera.");
      stopScanner();
    });

    return () => {
      BrowserMultiFormatReader.releaseAllStreams();
      readerRef.current = null;
    };
  }, [scannerOpen, stopScanner]);

  const filtered = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode ?? "").includes(search);
    const matchCategory =
      filterCategory === "all" || getSubtree(filterCategory).includes(p.category_id ?? "");
    return matchSearch && matchCategory;
  });

  const openNew = () => {
    setEditing({ ...emptyForm, sku: generateSku() });
    setEditingId(null);
    setDialogOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing({
      name: p.name, sku: p.sku, barcode: p.barcode ?? "",
      cost_price: toInput(Number(p.cost_price)),
      sale_price: toInput(Number(p.sale_price)),
      stock_quantity: p.stock_quantity, min_stock: p.min_stock,
      unit: p.unit, is_active: p.is_active,
      category_id: p.category_id, supplier_id: p.supplier_id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ncm: (p as any).ncm ?? "", ncm_loading: false, cfop: (p as any).cfop ?? "5102",
    });
    setEditingId(p.id);
    setDialogOpen(true);
  };

  const handleBarcodeBlur = async (ean: string) => {
    if (!ean || ean.length < 8) return;
    if (editing.ncm) return; // não sobrescreve se já preenchido
    setEditing((prev) => ({ ...prev, ncm_loading: true }));
    const result = await fetchCosmosProduct(ean);
    setEditing((prev) => ({
      ...prev,
      ncm_loading: false,
      ncm: result?.ncm?.code ? result.ncm.code : prev.ncm,
    }));
    if (result?.ncm?.code) {
      toast.success(`NCM preenchido: ${result.ncm.code}`);
    } else if (result) {
      toast.info("Produto encontrado no COSMOS, mas sem NCM cadastrado. Preencha manualmente.");
    }
  };

  const handleBulkNcm = async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const toEnrich = products.filter((p) => p.barcode && !(p as any).ncm);
    if (toEnrich.length === 0) {
      toast.info("Todos os produtos com código de barras já têm NCM.");
      return;
    }
    setBulkLoading(true);
    setBulkProgress({ done: 0, total: toEnrich.length });
    let updated = 0;
    for (const product of toEnrich) {
      const result = await fetchCosmosProduct(product.barcode!);
      if (result?.ncm?.code) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from("products").update({ ncm: result.ncm.code }).eq("id", product.id);
        updated++;
      }
      setBulkProgress((prev) => ({ ...prev, done: prev.done + 1 }));
      await new Promise((r) => setTimeout(r, 350)); // evitar rate limit
    }
    qc.invalidateQueries({ queryKey: ["products"] });
    toast.success(`NCM enriquecido: ${updated} de ${toEnrich.length} produto(s) atualizados.`);
    setBulkLoading(false);
    setBulkProgress({ done: 0, total: 0 });
  };

  const bulkActionLabel = () => {
    if (bulkAction === "price") {
      const dir = bulkPriceDirection === "increase" ? "Aumentar" : "Diminuir";
      const mode = bulkPriceMode === "percent" ? "%" : "R$";
      return `${dir} preço de venda em ${bulkPriceValue || "0"}${mode}`;
    }
    if (bulkAction === "status") return bulkStatusValue ? "Ativar produtos" : "Inativar produtos";
    if (bulkAction === "category") {
      const cat = orderedCategories.find((c) => c.id === bulkCategoryId);
      return `Alterar categoria para: ${cat?.name ?? "Nenhuma"}`;
    }
    return "";
  };

  const executeBulkEdit = async () => {
    const toProcess = filtered.filter((p) => selectedIds.has(p.id));
    setBulkEditLoading(true);
    setBulkEditProgress({ done: 0, total: toProcess.length });
    setBulkConfirmOpen(false);

    for (const product of toProcess) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let updates: Record<string, any> = {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let auditChanges: Record<string, any> = {};

      if (bulkAction === "price") {
        const currentPrice = Number(product.sale_price);
        const numericVal = parseFloat(bulkPriceValue.replace(",", ".")) || 0;
        let newPrice: number;
        if (bulkPriceMode === "percent") {
          newPrice = bulkPriceDirection === "increase"
            ? currentPrice * (1 + numericVal / 100)
            : currentPrice * (1 - numericVal / 100);
        } else {
          newPrice = bulkPriceDirection === "increase"
            ? currentPrice + numericVal
            : currentPrice - numericVal;
        }
        newPrice = Math.max(0, Math.round(newPrice * 100) / 100);
        updates = { sale_price: newPrice };
        auditChanges = { sale_price: { from: currentPrice, to: newPrice } };
      } else if (bulkAction === "status") {
        updates = { is_active: bulkStatusValue };
        auditChanges = { is_active: bulkStatusValue };
      } else if (bulkAction === "category") {
        updates = { category_id: bulkCategoryId };
        auditChanges = { category_id: bulkCategoryId };
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from("products").update(updates).eq("id", product.id);
      logAudit("product", product.id, product.name, "update", auditChanges);
      setBulkEditProgress((prev) => ({ ...prev, done: prev.done + 1 }));
    }

    qc.invalidateQueries({ queryKey: ["products"] });
    setSelectedIds(new Set());
    setBulkEditLoading(false);
    setBulkEditProgress({ done: 0, total: 0 });
    setBulkAction(null);
    setBulkPriceValue("");
    toast.success(`${toProcess.length} produto(s) atualizados com sucesso.`);
  };

  const save = async () => {
    if (!editing.name) return;
    const salePrice = fromInput(editing.sale_price);
    const costPrice = fromInput(editing.cost_price) || salePrice;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { ncm_loading, ...rest } = editing;
    const payload = { ...rest, cost_price: costPrice, sale_price: salePrice, ncm: rest.ncm || null, cfop: rest.cfop || "5102" };
    if (editingId) {
      await updateProduct.mutateAsync({ id: editingId, ...payload });
    } else {
      await createProduct.mutateAsync(payload as TablesInsert<"products">);
    }
    setDialogOpen(false);
    setEditing(emptyForm);
    setEditingId(null);
  };

  const saveQuickCreate = async () => {
    if (!quickName.trim()) return;
    if (quickCreate === "category") {
      const created = await createCategory.mutateAsync({ name: quickName.trim() });
      setEditing((prev) => ({ ...prev, category_id: created.id }));
    } else if (quickCreate === "supplier") {
      const created = await createSupplier.mutateAsync({ name: quickName.trim() });
      setEditing((prev) => ({ ...prev, supplier_id: created.id }));
    }
    setQuickCreate(null);
    setQuickName("");
  };

  const saleNum = fromInput(editing.sale_price);
  const costNum = fromInput(editing.cost_price) || saleNum;
  const margin = costNum > 0 ? (((saleNum - costNum) / costNum) * 100).toFixed(1) : "0.0";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Produtos</h1>
          <p className="text-muted-foreground text-sm">{products.length} produtos cadastrados</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleBulkNcm} disabled={bulkLoading || isLoading}>
            {bulkLoading
              ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" />{bulkProgress.done}/{bulkProgress.total}</>
              : <><Sparkles className="h-4 w-4 mr-1" />Enriquecer NCM</>
            }
          </Button>
          <Button variant="outline" onClick={openPhotoCapture} disabled={photoLoading}>
            {photoLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Camera className="h-4 w-4 mr-1" />}
            Via Foto
          </Button>
          <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Novo Produto</Button>
        </div>
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) analyzePhoto(f); }}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome, SKU ou código de barras..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {orderedCategories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.parent_id ? `└ ${c.name}` : c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={selectedIds.size > 0 && selectedIds.size === filtered.length}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedIds(new Set(filtered.map((p) => p.id)));
                    } else {
                      setSelectedIds(new Set());
                    }
                  }}
                />
              </TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>NCM</TableHead>
              <TableHead className="text-right">Custo</TableHead>
              <TableHead className="text-right">Venda</TableHead>
              <TableHead className="text-right">Margem</TableHead>
              <TableHead className="text-right">Estoque</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[80px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p) => {
              const cost = Number(p.cost_price);
              const sale = Number(p.sale_price);
              const m = cost > 0 ? (((sale - cost) / cost) * 100).toFixed(1) : "0.0";
              return (
                <TableRow key={p.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(p.id)}
                      onCheckedChange={(checked) => {
                        setSelectedIds((prev) => {
                          const next = new Set(prev);
                          if (checked) next.add(p.id); else next.delete(p.id);
                          return next;
                        });
                      }}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-xs">{p.sku}</TableCell>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{p.categories?.name ?? "—"}</TableCell>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <TableCell className="font-mono text-xs">{(p as any).ncm ?? "—"}</TableCell>
                  <TableCell className="text-right">{cost.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</TableCell>
                  <TableCell className="text-right">{sale.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</TableCell>
                  <TableCell className="text-right">{m}%</TableCell>
                  <TableCell className="text-right">
                    <span className={p.stock_quantity <= p.min_stock ? "text-destructive font-semibold" : ""}>{p.stock_quantity}</span>
                  </TableCell>
                  <TableCell><StatusBadge tone={p.is_active ? "success" : "neutral"}>{p.is_active ? "Ativo" : "Inativo"}</StatusBadge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteProduct.mutate(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={11} className="text-center py-8 text-muted-foreground">Nenhum produto encontrado</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Barra de ação flutuante para bulk edit */}
      {selectedIds.size > 0 && !bulkEditLoading && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-background border rounded-lg shadow-lg px-4 py-2">
          <Badge variant="secondary">{selectedIds.size} produto(s)</Badge>
          <Button size="sm" variant="outline" onClick={() => { setBulkAction("price"); setBulkActionOpen(true); }}>Alterar Preço</Button>
          <Button size="sm" variant="outline" onClick={() => { setBulkAction("status"); setBulkActionOpen(true); }}>Alterar Status</Button>
          <Button size="sm" variant="outline" onClick={() => { setBulkAction("category"); setBulkCategoryId(null); setBulkActionOpen(true); }}>Alterar Categoria</Button>
          <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}><X className="h-4 w-4" /></Button>
        </div>
      )}
      {bulkEditLoading && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-background border rounded-lg shadow-lg px-4 py-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Atualizando {bulkEditProgress.done}/{bulkEditProgress.total}...</span>
        </div>
      )}

      {/* Dialog de ação em massa */}
      <Dialog open={bulkActionOpen} onOpenChange={setBulkActionOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Ação em Massa — {selectedIds.size} produto(s)</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            {bulkAction === "price" && (
              <>
                <div className="space-y-2">
                  <Label>Modo</Label>
                  <Select value={bulkPriceMode} onValueChange={(v) => setBulkPriceMode(v as "percent" | "fixed")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">Porcentagem (%)</SelectItem>
                      <SelectItem value="fixed">Valor fixo (R$)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Direção</Label>
                  <Select value={bulkPriceDirection} onValueChange={(v) => setBulkPriceDirection(v as "increase" | "decrease")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="increase">Aumentar</SelectItem>
                      <SelectItem value="decrease">Diminuir</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Valor ({bulkPriceMode === "percent" ? "%" : "R$"})</Label>
                  <Input
                    value={bulkPriceValue}
                    onChange={(e) => setBulkPriceValue(e.target.value)}
                    placeholder={bulkPriceMode === "percent" ? "Ex: 10" : "Ex: 5,00"}
                    inputMode="decimal"
                  />
                </div>
              </>
            )}
            {bulkAction === "status" && (
              <div className="space-y-2">
                <Label>Novo Status</Label>
                <Select value={bulkStatusValue ? "true" : "false"} onValueChange={(v) => setBulkStatusValue(v === "true")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Ativo</SelectItem>
                    <SelectItem value="false">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {bulkAction === "category" && (
              <div className="space-y-2">
                <Label>Nova Categoria</Label>
                <Select value={bulkCategoryId ?? "none"} onValueChange={(v) => setBulkCategoryId(v === "none" ? null : v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    {orderedCategories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.parent_id ? `└ ${c.name}` : c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkActionOpen(false)}>Cancelar</Button>
            <Button onClick={() => { setBulkActionOpen(false); setBulkConfirmOpen(true); }}>Aplicar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação bulk */}
      <Dialog open={bulkConfirmOpen} onOpenChange={setBulkConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Confirmar Alteração</DialogTitle></DialogHeader>
          <div className="py-2 space-y-1 text-sm">
            <p>{bulkActionLabel()}</p>
            <p className="text-muted-foreground">Será aplicado em <strong>{selectedIds.size}</strong> produto(s).</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkConfirmOpen(false)}>Cancelar</Button>
            <Button onClick={executeBulkEdit}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Scanner de câmera */}
      {scannerOpen && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex flex-col items-center justify-center gap-4">
          <p className="text-white text-sm font-medium">Aponte a câmera para o código de barras</p>
          <div className="relative w-full max-w-sm">
            <video ref={videoRef} className="w-full rounded-lg" muted playsInline />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="border-2 border-primary w-4/5 h-20 rounded-md" />
            </div>
          </div>
          <Button variant="outline" onClick={stopScanner}>
            <X className="h-4 w-4 mr-1" /> Cancelar
          </Button>
        </div>
      )}

      {/* Dialog principal de produto */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditing(emptyForm); setEditingId(null); } }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? "Editar Produto" : "Novo Produto"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Nome *</Label><Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
              <div className="space-y-2">
                <Label>SKU</Label>
                <Input value={editing.sku} readOnly className="bg-muted font-mono text-sm cursor-default" tabIndex={-1} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Código de Barras</Label>
                <div className="flex gap-2">
                  <Input
                    value={editing.barcode}
                    onChange={(e) => setEditing({ ...editing, barcode: e.target.value })}
                    onBlur={(e) => handleBarcodeBlur(e.target.value)}
                    placeholder="Digite ou escaneie"
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" size="icon" onClick={() => setScannerOpen(true)} title="Escanear pela câmera">
                    <ScanLine className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Unidade</Label>
                <Select value={editing.unit} onValueChange={(v) => setEditing({ ...editing, unit: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="un">Unidade (un)</SelectItem>
                    <SelectItem value="kg">Quilograma (kg)</SelectItem>
                    <SelectItem value="cx">Caixa (cx)</SelectItem>
                    <SelectItem value="lt">Litro (lt)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <div className="flex gap-2">
                  <Select value={editing.category_id ?? "none"} onValueChange={(v) => setEditing({ ...editing, category_id: v === "none" ? null : v })}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma</SelectItem>
                      {orderedCategories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.parent_id ? `└ ${c.name}` : c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" size="icon" onClick={() => { setQuickName(""); setQuickCreate("category"); }} title="Nova categoria">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Fornecedor</Label>
                <div className="flex gap-2">
                  <Select value={editing.supplier_id ?? "none"} onValueChange={(v) => setEditing({ ...editing, supplier_id: v === "none" ? null : v })}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder="Nenhum" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {suppliers.map((s) => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" size="icon" onClick={() => { setQuickName(""); setQuickCreate("supplier"); }} title="Novo fornecedor">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Preço de Custo</Label>
                <Input
                  placeholder="0,00 (padrão: venda)"
                  value={editing.cost_price}
                  onChange={(e) => setEditing({ ...editing, cost_price: e.target.value })}
                  inputMode="decimal"
                />
              </div>
              <div className="space-y-2">
                <Label>Preço de Venda *</Label>
                <Input
                  placeholder="0,00"
                  value={editing.sale_price}
                  onChange={(e) => setEditing({ ...editing, sale_price: e.target.value })}
                  inputMode="decimal"
                />
              </div>
              <div className="space-y-2"><Label>Margem (%)</Label><Input disabled value={`${margin}%`} className="bg-muted" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Estoque Atual</Label><Input type="number" value={editing.stock_quantity} onChange={(e) => setEditing({ ...editing, stock_quantity: +e.target.value })} /></div>
              <div className="space-y-2"><Label>Estoque Mínimo</Label><Input type="number" value={editing.min_stock} onChange={(e) => setEditing({ ...editing, min_stock: +e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>NCM</Label>
                <div className="relative">
                  <Input
                    value={editing.ncm}
                    onChange={(e) => setEditing({ ...editing, ncm: e.target.value })}
                    placeholder="Ex: 22021000"
                    maxLength={8}
                    className="font-mono"
                  />
                  {editing.ncm_loading && (
                    <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Preenchido via código de barras (COSMOS)</p>
              </div>
              <div className="space-y-2">
                <Label>CFOP</Label>
                <Input
                  value={editing.cfop}
                  onChange={(e) => setEditing({ ...editing, cfop: e.target.value })}
                  placeholder="5102"
                  maxLength={4}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">Padrão: 5102 (venda interna)</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={createProduct.isPending || updateProduct.isPending}>
              {(createProduct.isPending || updateProduct.isPending) && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              {editingId ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mini-dialog de criação rápida */}
      <Dialog open={quickCreate !== null} onOpenChange={(open) => { if (!open) setQuickCreate(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{quickCreate === "category" ? "Nova Categoria" : "Novo Fornecedor"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>Nome *</Label>
            <Input
              value={quickName}
              onChange={(e) => setQuickName(e.target.value)}
              placeholder={quickCreate === "category" ? "Ex: Bebidas" : "Ex: Distribuidora XYZ"}
              onKeyDown={(e) => { if (e.key === "Enter") saveQuickCreate(); }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuickCreate(null)}>Cancelar</Button>
            <Button onClick={saveQuickCreate} disabled={!quickName.trim() || createCategory.isPending || createSupplier.isPending}>
              {(createCategory.isPending || createSupplier.isPending) && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Products;
