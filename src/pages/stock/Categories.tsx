import { useState } from "react";
import { mockCategories, type MockCategory } from "@/data/mock-data";
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
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

const Categories = () => {
  const [categories, setCategories] = useState<MockCategory[]>(mockCategories);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<MockCategory>>({ name: "", parentId: null });
  const [isEditing, setIsEditing] = useState(false);

  const parentCategories = categories.filter((c) => !c.parentId);

  const openNew = () => {
    setEditing({ name: "", parentId: null });
    setIsEditing(false);
    setDialogOpen(true);
  };

  const openEdit = (c: MockCategory) => {
    setEditing({ ...c });
    setIsEditing(true);
    setDialogOpen(true);
  };

  const save = () => {
    if (!editing.name) {
      toast.error("Nome é obrigatório");
      return;
    }
    if (isEditing) {
      setCategories((prev) =>
        prev.map((c) => (c.id === editing.id ? { ...c, ...editing } as MockCategory : c))
      );
      toast.success("Categoria atualizada");
    } else {
      const parent = parentCategories.find((c) => c.id === editing.parentId);
      const newC: MockCategory = {
        id: String(Date.now()),
        name: editing.name!,
        parentId: editing.parentId ?? null,
        parentName: parent?.name ?? null,
        productCount: 0,
      };
      setCategories((prev) => [...prev, newC]);
      toast.success("Categoria criada");
    }
    setDialogOpen(false);
  };

  const remove = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    toast.success("Categoria removida");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categorias</h1>
          <p className="text-muted-foreground text-sm">{categories.length} categorias</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-1" /> Nova Categoria
        </Button>
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
                <TableCell className="text-muted-foreground">{c.parentName ?? "—"}</TableCell>
                <TableCell className="text-right">{c.productCount}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(c.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar Categoria" : "Nova Categoria"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Categoria Pai</Label>
              <Select
                value={editing.parentId ?? "none"}
                onValueChange={(v) => setEditing({ ...editing, parentId: v === "none" ? null : v })}
              >
                <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma (raiz)</SelectItem>
                  {parentCategories
                    .filter((c) => c.id !== editing.id)
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
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

export default Categories;
