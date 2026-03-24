import { useState, useRef, useEffect, useCallback } from "react";
import { BrowserMultiFormatReader, NotFoundException } from "@zxing/browser";
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct, type Product } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { useSuppliers } from "@/hooks/useSuppliers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Plus, Search, Pencil, Trash2, Loader2, ScanLine, X } from "lucide-react";
import type { TablesInsert } from "@/integrations/supabase/types";
import { toast } from "sonner";

type ProductForm = {
  name: string; sku: string; barcode: string;
  cost_price: string; sale_price: string;
  stock_quantity: number; min_stock: number; unit: string; is_active: boolean;
  category_id: string | null; supplier_id: string | null;
};

const toInput = (n: number) => (n === 0 ? "" : String(n).replace(".", ","));
const fromInput = (s: string) => parseFloat(s.replace(",", ".")) || 0;

const emptyForm: ProductForm = {
  name: "", sku: "", barcode: "", cost_price: "", sale_price: "",
  stock_quantity: 0, min_stock: 0, unit: "un", is_active: true,
  category_id: null, supplier_id: null,
};

const Products = () => {
  const { data: products = [], isLoading } = useProducts();
  const { data: categories = [] } = useCategories();
  const { data: suppliers = [] } = useSuppliers();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ProductForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  // Gera o próximo SKU incremental com base nos SKUs numéricos existentes
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
    const matchCategory = filterCategory === "all" || p.category_id === filterCategory;
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
    });
    setEditingId(p.id);
    setDialogOpen(true);
  };

  const save = async () => {
    if (!editing.name) return;
    const salePrice = fromInput(editing.sale_price);
    const costPrice = fromInput(editing.cost_price) || salePrice; // padrão: igual ao preço de venda
    const payload = { ...editing, cost_price: costPrice, sale_price: salePrice };
    if (editingId) {
      await updateProduct.mutateAsync({ id: editingId, ...payload });
    } else {
      await createProduct.mutateAsync(payload as TablesInsert<"products">);
    }
    setDialogOpen(false);
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
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Novo Produto</Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome, SKU ou código de barras..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {categories.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Categoria</TableHead>
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
                  <TableCell className="font-mono text-xs">{p.sku}</TableCell>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{p.categories?.name ?? "—"}</TableCell>
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
              <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Nenhum produto encontrado</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
                    placeholder="Digite ou escaneie"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setScannerOpen(true)}
                    title="Escanear pela câmera"
                  >
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
                <Select value={editing.category_id ?? "none"} onValueChange={(v) => setEditing({ ...editing, category_id: v === "none" ? null : v })}>
                  <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    {categories.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fornecedor</Label>
                <Select value={editing.supplier_id ?? "none"} onValueChange={(v) => setEditing({ ...editing, supplier_id: v === "none" ? null : v })}>
                  <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {suppliers.map((s) => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}
                  </SelectContent>
                </Select>
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
    </div>
  );
};

export default Products;
