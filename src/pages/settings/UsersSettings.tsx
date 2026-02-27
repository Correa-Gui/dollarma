import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Pencil, Loader2 } from "lucide-react";
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
  const [editingUser, setEditingUser] = useState<UserWithRole | null>(null);
  const [newRole, setNewRole] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    // Fetch profiles and roles
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
    setEditDialogOpen(true);
  };

  const saveRole = async () => {
    if (!editingUser) return;
    const { error } = await supabase
      .from("user_roles")
      .update({ role: newRole } as any)
      .eq("user_id", editingUser.userId);

    if (error) {
      toast.error("Erro ao atualizar: " + error.message);
    } else {
      toast.success("Perfil atualizado");
      setEditDialogOpen(false);
      fetchUsers();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Usuários e Permissões</h1>
        <p className="text-muted-foreground text-sm">Gerencie usuários e seus perfis de acesso</p>
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

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Perfil — {editingUser?.displayName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
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
            <Button onClick={saveRole}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersSettings;
