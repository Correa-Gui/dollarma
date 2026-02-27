import { useState } from "react";
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from "@/hooks/useCategories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";

type CategoryForm = { name: string; parent_id: string | null };

const Categories = () => {
  const { data: categories = [], isLoading } = useCategories();
  const createCat = useCreateCategory();
  const updateCat = useUpdateCategory();
  const deleteCat = useDeleteCategory();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryForm>({ name: "", parent_id: null });
  const [editingId, setEditingId] = useState<string | null>(null);

  const parentCategories = categories.filter((c) => !c.parent_id);

  const openNew = () => { setEditing({ name: "", parent_id: null }); setEditingId(null); setDialogOpen(true); };
  const openEdit = (c: typeof categories[0]) => {
    setEditing({ name: c.name, parent_id: c.parent_id }); setEditingId(c.id); setDialogOpen(true);
  };

  const save = async () => {
    if (!editing.name) return;
    if (editingId) {
      await updateCat.mutateAsync({ id: editingId, ...editing });
    } else {
      await createCat.mutateAsync(editing);
    }
    setDialogOpen(false);
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categorias</h1>
          <p className="text-muted-foreground text-sm">{categories.length} categorias</p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Nova Categoria</Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Categoria Pai</TableHead>
              <TableHead className="text-right">Produtos</TableHead>
              <TableHead className="w-[80px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell className="text-muted-foreground">{c.parent?.name ?? "—"}</TableCell>
                <TableCell className="text-right">{c.product_count ?? 0}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteCat.mutate(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? "Editar Categoria" : "Nova Categoria"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2"><Label>Nome *</Label><Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
            <div className="space-y-2">
              <Label>Categoria Pai</Label>
              <Select value={editing.parent_id ?? "none"} onValueChange={(v) => setEditing({ ...editing, parent_id: v === "none" ? null : v })}>
                <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma (raiz)</SelectItem>
                  {parentCategories.filter((c) => c.id !== editingId).map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={createCat.isPending || updateCat.isPending}>{editingId ? "Salvar" : "Criar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Categories;
