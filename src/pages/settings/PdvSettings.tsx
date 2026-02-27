import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Copy, RefreshCw } from "lucide-react";

type Terminal = {
  id: string;
  name: string;
  token: string;
  status: "online" | "offline";
  lastSync: string;
};

const PdvSettings = () => {
  const [terminals, setTerminals] = useState<Terminal[]>([
    { id: "1", name: "PDV 01 - Caixa Principal", token: "tk_live_abc123def456", status: "online", lastSync: "Há 2 min" },
    { id: "2", name: "PDV 02 - Caixa Rápido", token: "tk_live_ghi789jkl012", status: "online", lastSync: "Há 5 min" },
    { id: "3", name: "PDV 03 - Autoatendimento", token: "tk_live_mno345pqr678", status: "offline", lastSync: "Há 3 horas" },
  ]);
  const [newName, setNewName] = useState("");
  const [syncInterval, setSyncInterval] = useState("5");

  const addTerminal = () => {
    if (!newName.trim()) { toast.error("Nome é obrigatório"); return; }
    const token = `tk_live_${Math.random().toString(36).substring(2, 14)}`;
    setTerminals((prev) => [...prev, {
      id: String(Date.now()), name: newName, token, status: "offline", lastSync: "Nunca",
    }]);
    setNewName("");
    toast.success("Terminal criado — copie o token de API");
  };

  const regenerateToken = (id: string) => {
    const newToken = `tk_live_${Math.random().toString(36).substring(2, 14)}`;
    setTerminals((prev) => prev.map((t) => t.id === id ? { ...t, token: newToken } : t));
    toast.success("Token regenerado");
  };

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    toast.success("Token copiado");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">PDV / Integração</h1>
        <p className="text-muted-foreground text-sm">Gerencie terminais PDV e tokens de API</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configuração de Sincronização</CardTitle>
          <CardDescription>Intervalo de polling do PDV para buscar catálogo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4 max-w-sm">
            <div className="space-y-2 flex-1">
              <Label>Intervalo (minutos)</Label>
              <Select value={syncInterval} onValueChange={setSyncInterval}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 min</SelectItem>
                  <SelectItem value="5">5 min</SelectItem>
                  <SelectItem value="15">15 min</SelectItem>
                  <SelectItem value="30">30 min</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={() => toast.success("Configuração salva")}>Salvar</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Terminais PDV</CardTitle>
            <CardDescription>Registre e gerencie terminais de venda</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Input placeholder="Nome do terminal..." value={newName} onChange={(e) => setNewName(e.target.value)} className="max-w-xs" />
            <Button onClick={addTerminal}><Plus className="h-4 w-4 mr-1" /> Adicionar</Button>
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Última Sinc.</TableHead>
                  <TableHead>Token de API</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {terminals.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${t.status === "online" ? "bg-emerald-500" : "bg-red-500"}`} />
                        {t.status === "online" ? "Online" : "Offline"}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{t.lastSync}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">{t.token.slice(0, 12)}...</code>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => copyToken(t.token)} title="Copiar token">
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => regenerateToken(t.id)} title="Regenerar token">
                          <RefreshCw className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PdvSettings;
