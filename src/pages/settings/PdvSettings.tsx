import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Copy, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTerminals, useCreateTerminal, useRegenerateToken } from "@/hooks/useTerminals";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const PdvSettings = () => {
  const { data: terminals, isLoading } = useTerminals();
  const createTerminal = useCreateTerminal();
  const regenerateToken = useRegenerateToken();
  const [newName, setNewName] = useState("");

  const addTerminal = () => {
    if (!newName.trim()) { toast.error("Nome é obrigatório"); return; }
    createTerminal.mutate(newName, { onSuccess: () => setNewName("") });
  };

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    toast.success("Token copiado");
  };

  const formatLastSync = (lastSync: string | null) => {
    if (!lastSync) return "Nunca";
    return formatDistanceToNow(new Date(lastSync), { addSuffix: true, locale: ptBR });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">PDV / Integração</h1>
        <p className="text-muted-foreground text-sm">Gerencie terminais PDV e tokens de API</p>
      </div>

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
            <Button onClick={addTerminal} disabled={createTerminal.isPending}>
              {createTerminal.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
              Adicionar
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
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
                  {(terminals || []).map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${t.status === "online" ? "bg-emerald-500" : "bg-red-500"}`} />
                          <span className={`text-xs font-medium ${t.status === "online" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                            {t.status === "online" ? "Online" : "Offline"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatLastSync(t.last_sync)}</TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">{t.token.slice(0, 12)}...</code>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => copyToken(t.token)} title="Copiar token">
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => regenerateToken.mutate(t.id)} title="Regenerar token">
                            <RefreshCw className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!terminals || terminals.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Nenhum terminal cadastrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PdvSettings;
