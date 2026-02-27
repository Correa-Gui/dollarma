import { useState } from "react";
import { useSuppliers, useCreateSupplier, useUpdateSupplier, useDeleteSupplier, type Supplier } from "@/hooks/useSuppliers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";

type SupplierForm = {
  name: string; cnpj: string; contact: string; phone: string; email: string;
  avg_delivery_days: number; notes: string;
};

const emptyForm: SupplierForm = {
  name: "", cnpj: "", contact: "", phone: "", email: "", avg_delivery_days: 0, notes: "",
};

const Suppliers = () => {
  const { data: suppliers = [], isLoading } = useSuppliers();
  const createSup = useCreateSupplier();
  const updateSup = useUpdateSupplier();
  const deleteSup = useDeleteSupplier();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SupplierForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const openNew = () => { setEditing({ ...emptyForm }); setEditingId(null); setDialogOpen(true); };
  const openEdit = (s: Supplier) => {
    setEditing({
      name: s.name, cnpj: s.cnpj ?? "", contact: s.contact ?? "", phone: s.phone ?? "",
      email: s.email ?? "", avg_delivery_days: s.avg_delivery_days ?? 0, notes: s.notes ?? "",
    });
    setEditingId(s.id); setDialogOpen(true);
  };

  const save = async () => {
    if (!editing.name) return;
    if (editingId) {
      await updateSup.mutateAsync({ id: editingId, ...editing });
    } else {
      await createSup.mutateAsync(editing);
    }
    setDialogOpen(false);
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fornecedores</h1>
          <p className="text-muted-foreground text-sm">{suppliers.length} fornecedores</p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Novo Fornecedor</Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Razão Social</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead className="text-right">Prazo (dias)</TableHead>
              <TableHead className="w-[80px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliers.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell className="font-mono text-xs">{s.cnpj ?? "—"}</TableCell>
                <TableCell>{s.contact ?? "—"}</TableCell>
                <TableCell>{s.phone ?? "—"}</TableCell>
                <TableCell>{s.email ?? "—"}</TableCell>
                <TableCell className="text-right">{s.avg_delivery_days ?? 0}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteSup.mutate(s.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingId ? "Editar Fornecedor" : "Novo Fornecedor"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2"><Label>Razão Social *</Label><Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>CNPJ</Label><Input value={editing.cnpj} onChange={(e) => setEditing({ ...editing, cnpj: e.target.value })} /></div>
              <div className="space-y-2"><Label>Prazo Médio (dias)</Label><Input type="number" value={editing.avg_delivery_days} onChange={(e) => setEditing({ ...editing, avg_delivery_days: +e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Contato</Label><Input value={editing.contact} onChange={(e) => setEditing({ ...editing, contact: e.target.value })} /></div>
              <div className="space-y-2"><Label>Telefone</Label><Input value={editing.phone} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>E-mail</Label><Input value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} /></div>
            <div className="space-y-2"><Label>Observações</Label><Textarea value={editing.notes} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={createSup.isPending || updateSup.isPending}>{editingId ? "Salvar" : "Criar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Suppliers;
