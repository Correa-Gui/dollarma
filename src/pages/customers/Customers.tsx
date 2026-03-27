import { useState } from "react";
import {
  useCustomers, useCreateCustomer, useUpdateCustomer, useDeleteCustomer, type Customer,
} from "@/hooks/useCustomers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Search, Pencil, Trash2, Loader2 } from "lucide-react";

type CustomerForm = Omit<Customer, "id" | "created_at">;

const emptyForm: CustomerForm = {
  name: "", cpf: null, phone: null, email: null, address: null, notes: null,
};

const nullify = (s: string) => s.trim() || null;

const Customers = () => {
  const { data: customers = [], isLoading } = useCustomers();
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CustomerForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.cpf ?? "").includes(search) ||
    (c.phone ?? "").includes(search) ||
    (c.email ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const openNew = () => { setEditing(emptyForm); setEditingId(null); setDialogOpen(true); };
  const openEdit = (c: Customer) => {
    setEditing({ name: c.name, cpf: c.cpf, phone: c.phone, email: c.email, address: c.address, notes: c.notes });
    setEditingId(c.id);
    setDialogOpen(true);
  };

  const save = async () => {
    if (!editing.name.trim()) return;
    const payload = {
      name: editing.name.trim(),
      cpf: nullify(editing.cpf ?? ""),
      phone: nullify(editing.phone ?? ""),
      email: nullify(editing.email ?? ""),
      address: nullify(editing.address ?? ""),
      notes: nullify(editing.notes ?? ""),
    };
    if (editingId) {
      await updateCustomer.mutateAsync({ id: editingId, ...payload });
    } else {
      await createCustomer.mutateAsync(payload);
    }
    setDialogOpen(false);
  };

  const field = (key: keyof CustomerForm) => ({
    value: editing[key] ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setEditing({ ...editing, [key]: e.target.value }),
  });

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
          <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground text-sm">{customers.length} cliente(s) cadastrado(s)</p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Novo Cliente</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, CPF, telefone..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>CPF</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Cadastrado em</TableHead>
              <TableHead className="w-[80px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{c.cpf ?? "—"}</TableCell>
                <TableCell className="text-sm">{c.phone ?? "—"}</TableCell>
                <TableCell className="text-sm">{c.email ?? "—"}</TableCell>
                <TableCell className="text-xs text-muted-foreground tabular-nums">
                  {new Date(c.created_at).toLocaleDateString("pt-BR")}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteCustomer.mutate(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhum cliente encontrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2"><Label>Nome *</Label><Input {...field("name")} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>CPF</Label><Input placeholder="000.000.000-00" {...field("cpf")} /></div>
              <div className="space-y-2"><Label>Telefone</Label><Input placeholder="(11) 99999-9999" {...field("phone")} /></div>
            </div>
            <div className="space-y-2"><Label>E-mail</Label><Input type="email" placeholder="email@exemplo.com" {...field("email")} /></div>
            <div className="space-y-2"><Label>Endereço</Label><Input placeholder="Rua, número, bairro..." {...field("address")} /></div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                placeholder="Informações adicionais..."
                value={editing.notes ?? ""}
                onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button
              onClick={save}
              disabled={!editing.name.trim() || createCustomer.isPending || updateCustomer.isPending}
            >
              {(createCustomer.isPending || updateCustomer.isPending) && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              {editingId ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Customers;
