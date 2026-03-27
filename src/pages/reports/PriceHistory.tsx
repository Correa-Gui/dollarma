import { useState } from "react";
import { usePriceHistory } from "@/hooks/usePriceHistory";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Loader2, Search } from "lucide-react";

const today = () => new Date().toISOString().split("T")[0];
const firstOfMonth = () => {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().split("T")[0];
};

const fmt = (v: number | null) =>
  v != null ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

const PriceCell = ({ from, to }: { from: number | null; to: number | null }) => {
  if (to == null) return <span className="text-muted-foreground">—</span>;
  if (from == null) return <span>— → {fmt(to)}</span>;
  const up = to > from;
  const arrow = up ? "↑" : to < from ? "↓" : "=";
  return (
    <span className={up ? "text-emerald-600" : to < from ? "text-destructive" : ""}>
      {fmt(from)} {arrow} {fmt(to)}
    </span>
  );
};

const PriceHistory = () => {
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState(firstOfMonth);
  const [to, setTo] = useState(today);

  const { data: logs = [], isLoading } = usePriceHistory({ search, from, to });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Histórico de Alteração de Preços</h1>
        <p className="text-muted-foreground text-sm">{logs.length} registro(s) encontrado(s)</p>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por produto..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label>De</Label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
        </div>
        <div className="space-y-1">
          <Label>Até</Label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Preço de Custo</TableHead>
                <TableHead>Preço de Venda</TableHead>
                <TableHead>Usuário</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{fmtDate(log.created_at)}</TableCell>
                  <TableCell className="font-medium">{log.entity_name ?? "—"}</TableCell>
                  <TableCell className="text-sm">
                    <PriceCell from={log._costPriceFrom} to={log._costPriceTo} />
                  </TableCell>
                  <TableCell className="text-sm">
                    <PriceCell from={log._salePriceFrom} to={log._salePriceTo} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{log.user_name ?? "—"}</TableCell>
                </TableRow>
              ))}
              {logs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhuma alteração de preço encontrada no período.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default PriceHistory;
