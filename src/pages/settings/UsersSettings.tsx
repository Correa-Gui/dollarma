import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Pencil, Loader2, Plus, UserPlus } from "lucide-react";
import { toast } from "sonner";

type UserWithRole = {
  userId: string;
  email: string;
  displayName: string;
  role: string;
};

const roleLabels: Record<string, string> = {
  admin: "Administrador",
  manager: "Gerente",
  cashier: "Op. de Caixa",
  stock: "Estoquista",
};

const UsersSettings = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithRole | null>(null);
  const [newRole, setNewRole] = useState("");
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);

  // Create form state
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createName, setCreateName] = useState("");
  const [createRole, setCreateRole] = useState("cashier");

  const fetchUsers = async () => {
    setLoading(true);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name");

    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id, role");

    if (profiles && roles) {
      const mapped: UserWithRole[] = profiles.map((p: any) => {
        const userRole = roles.find((r: any) => r.user_id === p.user_id);
        return {
          userId: p.user_id,
          email: p.display_name || "—",
          displayName: p.display_name || "—",
          role: userRole?.role || "cashier",
        };
      });
      setUsers(mapped);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openEdit = (u: UserWithRole) => {
    setEditingUser(u);
    setNewRole(u.role);
    setEditName(u.displayName === "—" ? "" : u.displayName);
    setEditDialogOpen(true);
  };

  const saveEdit = async () => {
    if (!editingUser) return;
    setSaving(true);

    const { data: { session } } = await supabase.auth.getSession();
    const res = await supabase.functions.invoke("admin-users?action=update", {
      method: "PUT",
      body: {
        user_id: editingUser.userId,
        display_name: editName,
        role: newRole,
      },
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });

    setSaving(false);
    if (res.error) {
      toast.error("Erro ao atualizar: " + (res.error.message || "Erro desconhecido"));
    } else {
      toast.success("Usuário atualizado");
      setEditDialogOpen(false);
      fetchUsers();
    }
  };

  const openCreate = () => {
    setCreateEmail("");
    setCreatePassword("");
    setCreateName("");
    setCreateRole("cashier");
    setCreateDialogOpen(true);
  };

  const saveCreate = async () => {
    if (!createEmail || !createPassword) {
      toast.error("Email e senha são obrigatórios");
      return;
    }
    if (createPassword.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres");
      return;
    }
    setSaving(true);

    const { data: { session } } = await supabase.auth.getSession();
    const res = await supabase.functions.invoke("admin-users?action=create", {
      method: "POST",
      body: {
        email: createEmail,
        password: createPassword,
        display_name: createName || createEmail,
        role: createRole,
      },
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });

    setSaving(false);
    if (res.error) {
      toast.error("Erro ao criar: " + (res.error.message || "Erro desconhecido"));
    } else {
      toast.success("Usuário criado com sucesso");
      setCreateDialogOpen(false);
      fetchUsers();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Usuários e Permissões</h1>
          <p className="text-muted-foreground text-sm">Gerencie usuários e seus perfis de acesso</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Novo Usuário
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Perfis Disponíveis</CardTitle>
          <CardDescription>Cada perfil tem acesso a módulos específicos do sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(roleLabels).map(([key, label]) => (
              <div key={key} className="rounded-lg border p-3">
                <p className="font-medium text-sm">{label}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {key === "admin" && "Acesso total ao sistema"}
                  {key === "manager" && "Dashboard, Vendas, Estoque, Relatórios"}
                  {key === "cashier" && "Apenas PDV e vendas"}
                  {key === "stock" && "Estoque e movimentações"}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Usuários Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead className="w-[80px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.userId}>
                      <TableCell className="font-medium">{u.displayName}</TableCell>
                      <TableCell>
                        <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                          {roleLabels[u.role] || u.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(u)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {users.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                        Nenhum usuário cadastrado ainda
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome de Exibição</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Nome do usuário"
              />
            </div>
            <div className="space-y-2">
              <Label>Perfil de Acesso</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="manager">Gerente</SelectItem>
                  <SelectItem value="cashier">Operador de Caixa</SelectItem>
                  <SelectItem value="stock">Estoquista</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
            <Button onClick={saveEdit} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={createEmail}
                onChange={(e) => setCreateEmail(e.target.value)}
                placeholder="usuario@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Senha *</Label>
              <Input
                type="password"
                value={createPassword}
                onChange={(e) => setCreatePassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div className="space-y-2">
              <Label>Nome de Exibição</Label>
              <Input
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="Nome do usuário"
              />
            </div>
            <div className="space-y-2">
              <Label>Perfil de Acesso</Label>
              <Select value={createRole} onValueChange={setCreateRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="manager">Gerente</SelectItem>
                  <SelectItem value="cashier">Operador de Caixa</SelectItem>
                  <SelectItem value="stock">Estoquista</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancelar</Button>
            <Button onClick={saveCreate} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Criar Usuário
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersSettings;
