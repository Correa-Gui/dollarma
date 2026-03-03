import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell,
} from "recharts";
import { Download, Loader2, Eye, Wallet, ArrowDownCircle, ArrowUpCircle, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { useTerminals } from "@/hooks/useTerminals";
import { useCashRegisterSessions, useCashRegisterMovements } from "@/hooks/useCashRegister";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (d: string) => new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });

const typeLabels: Record<string, string> = { sale: "Venda", withdrawal: "Sangria", deposit: "Suprimento", refund: "Estorno" };
const typeColors: Record<string, string> = {
  sale: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  withdrawal: "bg-red-500/10 text-red-700 border-red-500/20",
  deposit: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  refund: "bg-amber-500/10 text-amber-700 border-amber-500/20",
};

const CHART_COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"];

const CashRegister = () => {
  const today = new Date().toISOString().slice(0, 10);
  const [terminalId, setTerminalId] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  const { data: terminals = [], isLoading: loadingTerminals } = useTerminals();
  const { data: sessions = [], isLoading: loadingSessions } = useCashRegisterSessions(
    terminalId === "all" ? undefined : terminalId,
    dateFrom,
    dateTo
  );
  const { data: movements = [], isLoading: loadingMovements } = useCashRegisterMovements(selectedSession ?? undefined);

  const terminalMap = useMemo(() => Object.fromEntries(terminals.map((t) => [t.id, t.name])), [terminals]);

  // KPIs
  const kpis = useMemo(() => {
    const totalSales = sessions.reduce((s, ses) => {
      return s; // we'll compute from movements per session if available, fallback to closing - opening
    }, 0);

    let openCount = 0, closedCount = 0, totalOpening = 0, totalClosing = 0, totalDiff = 0;
    sessions.forEach((s) => {
      if (s.status === "open") openCount++;
      else closedCount++;
      totalOpening += Number(s.opening_balance ?? 0);
      totalClosing += Number(s.closing_balance ?? 0);
      totalDiff += Number(s.difference ?? 0);
    });

    return { openCount, closedCount, totalOpening, totalClosing, totalDiff, total: sessions.length };
  }, [sessions]);

  // Chart: sessions per terminal
  const chartData = useMemo(() => {
    const map: Record<string, { terminal: string; sessions: number; opening: number; closing: number }> = {};
    sessions.forEach((s) => {
      const name = terminalMap[s.terminal_id] ?? "Desconhecido";
      if (!map[s.terminal_id]) map[s.terminal_id] = { terminal: name, sessions: 0, opening: 0, closing: 0 };
      map[s.terminal_id].sessions++;
      map[s.terminal_id].opening += Number(s.opening_balance ?? 0);
      map[s.terminal_id].closing += Number(s.closing_balance ?? 0);
    });
    return Object.values(map);
  }, [sessions, terminalMap]);

  // Pie: status
  const statusPie = useMemo(() => [
    { name: "Abertos", value: kpis.openCount },
    { name: "Fechados", value: kpis.closedCount },
  ].filter((d) => d.value > 0), [kpis]);

  // Movement totals by type for detail dialog
  const movementSummary = useMemo(() => {
    const map: Record<string, number> = {};
    movements.forEach((m) => {
      map[m.type] = (map[m.type] ?? 0) + Number(m.amount);
    });
    return Object.entries(map).map(([type, total]) => ({ type, label: typeLabels[type] ?? type, total }));
  }, [movements]);

  const exportCSV = () => {
    const header = "Terminal,Abertura,Fechamento,Saldo Inicial,Saldo Final,Diferença,Status\n";
    const rows = sessions.map((s) =>
      `${terminalMap[s.terminal_id] ?? s.terminal_id},${fmtDate(s.opened_at)},${s.closed_at ? fmtDate(s.closed_at) : "-"},${s.opening_balance},${s.closing_balance ?? "-"},${s.difference ?? "-"},${s.status}`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "caixa-diario.csv"; a.click();
    toast.success("CSV exportado");
  };

  const isLoading = loadingTerminals || loadingSessions;

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Caixa Diário</h1>
          <p className="text-muted-foreground text-sm">Sessões de abertura e fechamento por terminal</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={terminalId} onValueChange={setTerminalId}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Terminal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os terminais</SelectItem>
              {terminals.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-[150px]" />
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-[150px]" />
          <Button variant="outline" onClick={exportCSV}><Download className="h-4 w-4 mr-1" /> CSV</Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10"><Wallet className="h-5 w-5 text-primary" /></div>
            <div><p className="text-xs text-muted-foreground">Sessões</p><p className="text-xl font-bold">{kpis.total}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10"><ArrowUpCircle className="h-5 w-5 text-emerald-600" /></div>
            <div><p className="text-xs text-muted-foreground">Total Abertura</p><p className="text-xl font-bold">{fmt(kpis.totalOpening)}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10"><ArrowDownCircle className="h-5 w-5 text-blue-600" /></div>
            <div><p className="text-xs text-muted-foreground">Total Fechamento</p><p className="text-xl font-bold">{fmt(kpis.totalClosing)}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className={`p-2 rounded-lg ${kpis.totalDiff >= 0 ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
              <DollarSign className={`h-5 w-5 ${kpis.totalDiff >= 0 ? "text-emerald-600" : "text-red-600"}`} />
            </div>
            <div><p className="text-xs text-muted-foreground">Diferença</p><p className={`text-xl font-bold ${kpis.totalDiff < 0 ? "text-red-600" : ""}`}>{fmt(kpis.totalDiff)}</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4">
        {chartData.length > 0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Saldo por Terminal</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="terminal" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                    <Legend />
                    <Bar dataKey="opening" fill="hsl(var(--chart-1))" name="Abertura" />
                    <Bar dataKey="closing" fill="hsl(var(--chart-2))" name="Fechamento" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
        {statusPie.length > 0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Status das Sessões</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${name}: ${value}`}>
                      {statusPie.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => v} contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Terminal</TableHead>
              <TableHead>Abertura</TableHead>
              <TableHead>Fechamento</TableHead>
              <TableHead className="text-right">Saldo Inicial</TableHead>
              <TableHead className="text-right">Saldo Final</TableHead>
              <TableHead className="text-right">Diferença</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Nenhuma sessão encontrada</TableCell></TableRow>
            ) : sessions.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{terminalMap[s.terminal_id] ?? "—"}</TableCell>
                <TableCell>{fmtDate(s.opened_at)}</TableCell>
                <TableCell>{s.closed_at ? fmtDate(s.closed_at) : "—"}</TableCell>
                <TableCell className="text-right">{fmt(Number(s.opening_balance))}</TableCell>
                <TableCell className="text-right">{s.closing_balance != null ? fmt(Number(s.closing_balance)) : "—"}</TableCell>
                <TableCell className={`text-right font-medium ${Number(s.difference ?? 0) < 0 ? "text-red-600" : ""}`}>
                  {s.difference != null ? fmt(Number(s.difference)) : "—"}
                </TableCell>
                <TableCell>
                  <Badge variant={s.status === "open" ? "default" : "secondary"} className="text-xs">
                    {s.status === "open" ? "Aberto" : "Fechado"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedSession(s.id)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedSession} onOpenChange={(o) => !o && setSelectedSession(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Movimentações da Sessão</DialogTitle>
          </DialogHeader>
          {loadingMovements ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : (
            <>
              {movementSummary.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  {movementSummary.map((m) => (
                    <div key={m.type} className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">{m.label}</p>
                      <p className="text-lg font-bold">{fmt(m.total)}</p>
                    </div>
                  ))}
                </div>
              )}
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead>Pagamento</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Hora</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">Sem movimentações</TableCell></TableRow>
                    ) : movements.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell>
                          <Badge variant="outline" className={typeColors[m.type] ?? ""}>
                            {typeLabels[m.type] ?? m.type}
                          </Badge>
                        </TableCell>
                        <TableCell className={`text-right font-medium ${m.type === "withdrawal" ? "text-red-600" : ""}`}>
                          {m.type === "withdrawal" ? "- " : ""}{fmt(Math.abs(Number(m.amount)))}
                        </TableCell>
                        <TableCell className="text-sm">{m.payment_method ?? "—"}</TableCell>
                        <TableCell className="text-sm max-w-[200px] truncate">{m.description ?? "—"}</TableCell>
                        <TableCell className="text-sm">{new Date(m.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CashRegister;
