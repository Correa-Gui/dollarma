import { useState } from "react";
import { useAuditLogs, type AuditLog } from "@/hooks/useAuditLog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const entityLabels: Record<string, string> = {
  product: "Produto",
  category: "Categoria",
  supplier: "Fornecedor",
  sale: "Venda",
  customer: "Cliente",
};

const actionLabels: Record<string, string> = {
  create: "Criou",
  update: "Editou",
  delete: "Removeu",
  cancel: "Cancelou",
};

const actionColors: Record<string, string> = {
  create: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  update: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  delete: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  cancel: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
};

function ChangesCell({ changes }: { changes: AuditLog["changes"] }) {
  const [open, setOpen] = useState(false);
  if (!changes || Object.keys(changes).length === 0) return <span className="text-muted-foreground text-xs">—</span>;
  return (
    <div>
      <Button variant="ghost" size="sm" className="h-6 px-1 text-xs gap-1" onClick={() => setOpen((o) => !o)}>
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        ver detalhes
      </Button>
      {open && (
        <pre className="mt-1 text-xs bg-muted rounded p-2 max-w-xs overflow-auto whitespace-pre-wrap">
          {JSON.stringify(changes, null, 2)}
        </pre>
      )}
    </div>
  );
}

const AuditLogPage = () => {
  const [entityType, setEntityType] = useState("all");
  const [action, setAction] = useState("all");
  const [days, setDays] = useState<number>(30);

  const { data: logs = [], isLoading } = useAuditLogs({ entityType, action, days });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Auditoria</h1>
        <p className="text-muted-foreground text-sm">{logs.length} registro(s) encontrado(s)</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={entityType} onValueChange={setEntityType}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Entidade" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as entidades</SelectItem>
            <SelectItem value="product">Produto</SelectItem>
            <SelectItem value="category">Categoria</SelectItem>
            <SelectItem value="supplier">Fornecedor</SelectItem>
            <SelectItem value="sale">Venda</SelectItem>
            <SelectItem value="customer">Cliente</SelectItem>
          </SelectContent>
        </Select>

        <Select value={action} onValueChange={setAction}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Ação" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as ações</SelectItem>
            <SelectItem value="create">Criou</SelectItem>
            <SelectItem value="update">Editou</SelectItem>
            <SelectItem value="delete">Removeu</SelectItem>
            <SelectItem value="cancel">Cancelou</SelectItem>
          </SelectContent>
        </Select>

        <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
            <SelectItem value="365">Último ano</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data / Hora</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead>Entidade</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead>Detalhes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="text-xs tabular-nums whitespace-nowrap">
                  {new Date(log.created_at).toLocaleString("pt-BR")}
                </TableCell>
                <TableCell className="text-sm">{log.user_name ?? "—"}</TableCell>
                <TableCell className="text-sm">{entityLabels[log.entity_type] ?? log.entity_type}</TableCell>
                <TableCell className="text-sm font-medium">{log.entity_name ?? "—"}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${actionColors[log.action] ?? "bg-muted text-muted-foreground"}`}>
                    {actionLabels[log.action] ?? log.action}
                  </span>
                </TableCell>
                <TableCell><ChangesCell changes={log.changes} /></TableCell>
              </TableRow>
            ))}
            {logs.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  Nenhum registro encontrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AuditLogPage;
