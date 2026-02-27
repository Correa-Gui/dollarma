import { useState } from "react";
import { mockProducts, type MockProduct } from "@/data/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

const emptyProduct: Partial<MockProduct> = {
  name: "", sku: "", barcode: "", description: "", category: "Mercearia",
  supplier: "Dist. Nacional", costPrice: 0, salePrice: 0, stockQuantity: 0,
  stockMin: 0, unit: "un", active: true,
};

const Products = () => {
  const [products, setProducts] = useState<MockProduct[]>(mockProducts);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<MockProduct>>(emptyProduct);
  const [isEditing, setIsEditing] = useState(false);

  const categories = [...new Set(products.map((p) => p.category))];

  const filtered = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode.includes(search);
    const matchCategory = filterCategory === "all" || p.category === filterCategory;
    return matchSearch && matchCategory;
  });

  const openNew = () => {
    setEditing({ ...emptyProduct });
    setIsEditing(false);
    setDialogOpen(true);
  };

  const openEdit = (p: MockProduct) => {
    setEditing({ ...p });
    setIsEditing(true);
    setDialogOpen(true);
  };

  const save = () => {
    if (!editing.name || !editing.sku) {
      toast.error("Nome e SKU são obrigatórios");
      return;
    }
    if (isEditing) {
      setProducts((prev) => prev.map((p) => (p.id === editing.id ? { ...p, ...editing } as MockProduct : p)));
      toast.success("Produto atualizado");
    } else {
      const newP: MockProduct = {
        ...emptyProduct,
        ...editing,
        id: String(Date.now()),
        margin: editing.costPrice && editing.salePrice
          ? +((((editing.salePrice - editing.costPrice) / editing.costPrice) * 100).toFixed(1))
          : 0,
      } as MockProduct;
      setProducts((prev) => [...prev, newP]);
      toast.success("Produto criado");
    }
    setDialogOpen(false);
  };

  const remove = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    toast.success("Produto removido");
  };

  const margin =
    editing.costPrice && editing.salePrice && editing.costPrice > 0
      ? (((editing.salePrice - editing.costPrice) / editing.costPrice) * 100).toFixed(1)
      : "0.0";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Produtos</h1>
          <p className="text-muted-foreground text-sm">{products.length} produtos cadastrados</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-1" /> Novo Produto
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, SKU ou código de barras..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
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
            {filtered.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-mono text-xs">{p.sku}</TableCell>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell>{p.category}</TableCell>
                <TableCell className="text-right">
                  {p.costPrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </TableCell>
                <TableCell className="text-right">
                  {p.salePrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </TableCell>
                <TableCell className="text-right">{p.margin.toFixed(1)}%</TableCell>
                <TableCell className="text-right">
                  <span className={p.stockQuantity <= p.stockMin ? "text-destructive font-semibold" : ""}>
                    {p.stockQuantity}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant={p.active ? "default" : "secondary"}>
                    {p.active ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(p.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  Nenhum produto encontrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar Produto" : "Novo Produto"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>SKU *</Label>
                <Input value={editing.sku ?? ""} onChange={(e) => setEditing({ ...editing, sku: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Código de Barras</Label>
                <Input value={editing.barcode ?? ""} onChange={(e) => setEditing({ ...editing, barcode: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Unidade</Label>
                <Select value={editing.unit ?? "un"} onValueChange={(v) => setEditing({ ...editing, unit: v })}>
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
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Preço de Custo</Label>
                <Input type="number" step="0.01" value={editing.costPrice ?? 0} onChange={(e) => setEditing({ ...editing, costPrice: +e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Preço de Venda</Label>
                <Input type="number" step="0.01" value={editing.salePrice ?? 0} onChange={(e) => setEditing({ ...editing, salePrice: +e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Margem (%)</Label>
                <Input disabled value={`${margin}%`} className="bg-muted" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Estoque Atual</Label>
                <Input type="number" value={editing.stockQuantity ?? 0} onChange={(e) => setEditing({ ...editing, stockQuantity: +e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Estoque Mínimo</Label>
                <Input type="number" value={editing.stockMin ?? 0} onChange={(e) => setEditing({ ...editing, stockMin: +e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={save}>{isEditing ? "Salvar" : "Criar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Products;
