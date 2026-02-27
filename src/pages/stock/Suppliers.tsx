import { useState } from "react";
import { mockSuppliers, type MockSupplier } from "@/data/mock-data";
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
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

const emptySupplier: Partial<MockSupplier> = {
  name: "", cnpj: "", contactName: "", phone: "", email: "", avgDeliveryDays: 0, notes: "",
};

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState<MockSupplier[]>(mockSuppliers);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<MockSupplier>>(emptySupplier);
  const [isEditing, setIsEditing] = useState(false);

  const openNew = () => {
    setEditing({ ...emptySupplier });
    setIsEditing(false);
    setDialogOpen(true);
  };

  const openEdit = (s: MockSupplier) => {
    setEditing({ ...s });
    setIsEditing(true);
    setDialogOpen(true);
  };

  const save = () => {
    if (!editing.name) {
      toast.error("Razão social é obrigatória");
      return;
    }
    if (isEditing) {
      setSuppliers((prev) => prev.map((s) => (s.id === editing.id ? { ...s, ...editing } as MockSupplier : s)));
      toast.success("Fornecedor atualizado");
    } else {
      setSuppliers((prev) => [...prev, { ...emptySupplier, ...editing, id: String(Date.now()) } as MockSupplier]);
      toast.success("Fornecedor criado");
    }
    setDialogOpen(false);
  };

  const remove = (id: string) => {
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
    toast.success("Fornecedor removido");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fornecedores</h1>
          <p className="text-muted-foreground text-sm">{suppliers.length} fornecedores</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-1" /> Novo Fornecedor
        </Button>
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
                <TableCell className="font-mono text-xs">{s.cnpj}</TableCell>
                <TableCell>{s.contactName}</TableCell>
                <TableCell>{s.phone}</TableCell>
                <TableCell>{s.email}</TableCell>
                <TableCell className="text-right">{s.avgDeliveryDays}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(s)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(s.id)}>
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar Fornecedor" : "Novo Fornecedor"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Razão Social *</Label>
              <Input value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>CNPJ</Label>
                <Input value={editing.cnpj ?? ""} onChange={(e) => setEditing({ ...editing, cnpj: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Prazo Médio (dias)</Label>
                <Input type="number" value={editing.avgDeliveryDays ?? 0} onChange={(e) => setEditing({ ...editing, avgDeliveryDays: +e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contato</Label>
                <Input value={editing.contactName ?? ""} onChange={(e) => setEditing({ ...editing, contactName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input value={editing.phone ?? ""} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input value={editing.email ?? ""} onChange={(e) => setEditing({ ...editing, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea value={editing.notes ?? ""} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} />
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

export default Suppliers;
