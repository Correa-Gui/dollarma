import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell } from "recharts";
import { Download, Loader2, Eye, Wallet, ArrowDownCircle, ArrowUpCircle, DollarSign, ShoppingCart, FileText } from "lucide-react";
import { toast } from "sonner";
import { useTerminals } from "@/hooks/useTerminals";
import { useCashRegisterSessions, type CashSession } from "@/hooks/useCashRegister";
import { getPaymentLabel } from "@/lib/payment";

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

type TimelineRow =
  | {
      id: string;
      type: "sale";
      amount: number;
      payment: string;
      time: Date;
      sale: CashSession["sales"][number];
    }
  | {
      id: string;
      type: "withdrawal" | "deposit" | "refund";
      amount: number;
      payment: string;
      time: Date;
      description: string | null;
    };

function getSessionSalesTotal(session: CashSession) {
  return (session.sales ?? [])
    .filter((s) => s.status === "completed")
    .reduce((sum, s) => sum + Number(s.total), 0);
}

function getSessionWithdrawalsTotal(session: CashSession) {
  return (session.cash_register_movements ?? [])
    .filter((m) => m.type === "withdrawal")
    .reduce((sum, m) => sum + Number(m.amount), 0);
}

function buildTimeline(session: CashSession): TimelineRow[] {
  const rows: TimelineRow[] = [];

  (session.sales ?? []).forEach((s) => {
    rows.push({
      id: s.id,
      type: "sale",
      amount: Number(s.total),
      payment: getPaymentLabel(s.payment_method),
      time: new Date(s.sold_at),
      sale: s,
    });
  });

  (session.cash_register_movements ?? []).forEach((m) => {
    rows.push({
      id: m.id,
      type: m.type,
      amount: Number(m.amount),
      payment: m.type === "withdrawal" ? "Dinheiro" : getPaymentLabel(m.payment_method),
      description: m.description ?? null,
      time: new Date(m.created_at),
    });
  });

  rows.sort((a, b) => a.time.getTime() - b.time.getTime());
  return rows;
}

const CashRegister = () => {
  const today = new Date().toISOString().slice(0, 10);
  const [terminalId, setTerminalId] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedMovement, setSelectedMovement] = useState<TimelineRow | null>(null);

  const { data: terminals = [], isLoading: loadingTerminals } = useTerminals();
  const { data: sessions = [], isLoading: loadingSessions } = useCashRegisterSessions(
    terminalId === "all" ? undefined : terminalId,
    dateFrom,
    dateTo,
  );

  const terminalMap = useMemo(() => Object.fromEntries(terminals.map((t) => [t.id, t.name])), [terminals]);
  const selectedSession = useMemo(() => sessions.find((s) => s.id === selectedSessionId), [sessions, selectedSessionId]);
  const timeline = useMemo(() => (selectedSession ? buildTimeline(selectedSession) : []), [selectedSession]);

  const kpis = useMemo(() => {
    let openCount = 0, closedCount = 0, totalOpening = 0, totalExpected = 0, totalClosing = 0, totalDiff = 0, totalSales = 0;
    sessions.forEach((s) => {
      if (s.status === "open") openCount++;
      else closedCount++;
      totalOpening += Number(s.opening_balance ?? 0);
      totalExpected += Number(s.expected_balance ?? 0);
      totalClosing += Number(s.closing_balance ?? 0);
      totalDiff += Number(s.difference ?? 0);
      totalSales += getSessionSalesTotal(s);
    });

    return { openCount, closedCount, totalOpening, totalExpected, totalClosing, totalDiff, totalSales, total: sessions.length };
  }, [sessions]);

  const chartData = useMemo(() => {
    const map: Record<string, { terminal: string; sessions: number; opening: number; expected: number; closing: number; vendas: number }> = {};
    sessions.forEach((s) => {
      const name = terminalMap[s.terminal_id] ?? "Desconhecido";
      if (!map[s.terminal_id]) {
        map[s.terminal_id] = { terminal: name, sessions: 0, opening: 0, expected: 0, closing: 0, vendas: 0 };
      }
      map[s.terminal_id].sessions++;
      map[s.terminal_id].opening += Number(s.opening_balance ?? 0);
      map[s.terminal_id].expected += Number(s.expected_balance ?? 0);
      map[s.terminal_id].closing += Number(s.closing_balance ?? 0);
      map[s.terminal_id].vendas += getSessionSalesTotal(s);
    });
    return Object.values(map);
  }, [sessions, terminalMap]);

  const statusPie = useMemo(() => [
    { name: "Abertos", value: kpis.openCount },
    { name: "Fechados", value: kpis.closedCount },
  ].filter((d) => d.value > 0), [kpis]);

  const timelineSummary = useMemo(() => {
    const map: Record<string, number> = {};
    timeline.forEach((r) => {
      map[r.type] = (map[r.type] ?? 0) + r.amount;
    });
    return Object.entries(map).map(([type, total]) => ({ type, label: typeLabels[type] ?? type, total }));
  }, [timeline]);

  const exportCSV = () => {
    const header = "Terminal,Abertura,Fechamento,Saldo Inicial,Total Vendas,Saldo Esperado,Saldo Informado,Diferença,Status\n";
    const rows = sessions.map((s) =>
      `${terminalMap[s.terminal_id] ?? s.terminal_id},${fmtDate(s.opened_at)},${s.closed_at ? fmtDate(s.closed_at) : "-"},${s.opening_balance},${getSessionSalesTotal(s)},${s.expected_balance ?? "-"},${s.closing_balance ?? "-"},${s.difference ?? "-"},${s.status}`,
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "caixa-diario.csv";
    a.click();
    toast.success("CSV exportado");
  };

  const openConsolidatedReport = () => {
    const params = new URLSearchParams({
      terminalId,
      dateFrom,
      dateTo,
    });
    window.open(`/relatorios/caixa/consolidado?${params.toString()}`, "_blank", "noopener,noreferrer");
  };

  const isLoading = loadingTerminals || loadingSessions;

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Caixa Diário</h1>
          <p className="text-muted-foreground text-sm">Sessões de abertura e fechamento por terminal</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={terminalId} onValueChange={setTerminalId}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Terminal" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os terminais</SelectItem>
              {terminals.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-[150px]" />
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-[150px]" />
          <Button variant="outline" onClick={exportCSV}><Download className="h-4 w-4 mr-1" /> CSV</Button>
          <Button variant="outline" onClick={openConsolidatedReport}><FileText className="h-4 w-4 mr-1" /> Relatório</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
            <div className="p-2 rounded-lg bg-emerald-500/10"><ShoppingCart className="h-5 w-5 text-emerald-600" /></div>
            <div><p className="text-xs text-muted-foreground">Total Vendas</p><p className="text-xl font-bold text-emerald-600">{fmt(kpis.totalSales)}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10"><ArrowDownCircle className="h-5 w-5 text-blue-600" /></div>
            <div><p className="text-xs text-muted-foreground">Saldo esperado</p><p className="text-xl font-bold">{fmt(kpis.totalExpected)}</p></div>
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
                    <Bar dataKey="vendas" fill="hsl(var(--chart-3))" name="Vendas" />
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

      <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Terminal</TableHead>
                    <TableHead>Abertura</TableHead>
                    <TableHead>Fechamento</TableHead>
                    <TableHead className="text-right">Saldo Inicial</TableHead>
                    <TableHead className="text-right">Vendas</TableHead>
                    <TableHead className="text-right">Sangrias</TableHead>
                    <TableHead className="text-right">Saldo esperado</TableHead>
                    <TableHead className="text-right">Saldo informado</TableHead>
                    <TableHead className="text-right">Diferença</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
          <TableBody>
            {sessions.length === 0 ? (
              <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-8">Nenhuma sessão encontrada</TableCell></TableRow>
            ) : sessions.map((s) => {
              const salesTotal = getSessionSalesTotal(s);
              const withdrawalsTotal = getSessionWithdrawalsTotal(s);
              return (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{terminalMap[s.terminal_id] ?? "—"}</TableCell>
                  <TableCell>{fmtDate(s.opened_at)}</TableCell>
                  <TableCell>{s.closed_at ? fmtDate(s.closed_at) : "—"}</TableCell>
                      <TableCell className="text-right">{fmt(Number(s.opening_balance))}</TableCell>
                      <TableCell className="text-right text-emerald-600 font-medium">{fmt(salesTotal)}</TableCell>
                      <TableCell className="text-right text-red-600 font-medium">{withdrawalsTotal > 0 ? `- ${fmt(withdrawalsTotal)}` : fmt(0)}</TableCell>
                      <TableCell className="text-right">{s.expected_balance != null ? fmt(Number(s.expected_balance)) : "—"}</TableCell>
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
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedSessionId(s.id)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedSessionId} onOpenChange={(o) => !o && setSelectedSessionId(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Movimentações da Sessão</DialogTitle>
            <DialogDescription>
              {selectedSession ? `${terminalMap[selectedSession.terminal_id] ?? "Terminal"} · ${fmtDate(selectedSession.opened_at)}` : ""}
            </DialogDescription>
          </DialogHeader>
          {selectedSession && (
            <>
              {timelineSummary.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  {timelineSummary.map((m) => (
                    <div key={m.type} className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">{m.label}</p>
                      <p className={`text-lg font-bold ${m.type === "sale" ? "text-emerald-600" : m.type === "withdrawal" ? "text-red-600" : ""}`}>{fmt(m.total)}</p>
                    </div>
                  ))}
                </div>
              )}
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="uppercase text-xs">Tipo</TableHead>
                      <TableHead className="uppercase text-xs text-right">Valor</TableHead>
                      <TableHead className="uppercase text-xs">Pagamento</TableHead>
                      <TableHead className="uppercase text-xs">Detalhes</TableHead>
                      <TableHead className="uppercase text-xs">Hora</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timeline.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">Sem movimentações</TableCell></TableRow>
                    ) : timeline.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>
                          <Badge variant="outline" className={typeColors[r.type] ?? ""}>
                            {typeLabels[r.type] ?? r.type}
                          </Badge>
                        </TableCell>
                        <TableCell className={`text-right font-medium tabular-nums ${r.type === "withdrawal" ? "text-red-600" : r.type === "sale" ? "text-emerald-600" : ""}`}>
                          {r.type === "withdrawal" ? "- " : ""}{fmt(r.amount)}
                        </TableCell>
                        <TableCell className="text-sm">{r.payment}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-2 px-2 text-sm"
                            onClick={() => setSelectedMovement(r)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Ver detalhes
                          </Button>
                        </TableCell>
                        <TableCell className="text-sm tabular-nums">{r.time.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedMovement} onOpenChange={(o) => !o && setSelectedMovement(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {selectedMovement?.type === "sale" ? `Venda #${selectedMovement.sale.sale_number}` : typeLabels[selectedMovement?.type ?? ""] ?? "Movimentação"}
            </DialogTitle>
            <DialogDescription>
              {selectedMovement ? `${fmtDate(selectedMovement.time.toISOString())} · ${selectedMovement.payment}` : ""}
            </DialogDescription>
          </DialogHeader>
          {selectedMovement && selectedMovement.type === "sale" && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="rounded-lg border p-3"><p className="text-muted-foreground">Valor da venda</p><p className="text-base font-semibold">{fmt(Number(selectedMovement.sale.total))}</p></div>
                <div className="rounded-lg border p-3"><p className="text-muted-foreground">Desconto</p><p className="text-base font-semibold text-amber-700">{fmt(Number(selectedMovement.sale.discount_amount ?? 0))}</p></div>
                <div className="rounded-lg border p-3 bg-primary/5"><p className="text-muted-foreground">Cliente</p><p className="text-base font-semibold">{selectedMovement.sale.customers?.name ?? selectedMovement.sale.customer_name ?? "Consumidor final"}</p></div>
              </div>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead className="text-right">Qtd</TableHead>
                      <TableHead className="text-right">Unit.</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedMovement.sale.sale_items?.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-sm">{item.product_name}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">{fmt(Number(item.unit_price))}</TableCell>
                        <TableCell className="text-right font-medium">{fmt(Number(item.subtotal))}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
          {selectedMovement && selectedMovement.type !== "sale" && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border p-3"><p className="text-muted-foreground">Tipo</p><p className="font-semibold">{typeLabels[selectedMovement.type]}</p></div>
                <div className="rounded-lg border p-3"><p className="text-muted-foreground">Valor</p><p className={`font-semibold ${selectedMovement.type === "withdrawal" ? "text-red-600" : ""}`}>{selectedMovement.type === "withdrawal" ? "- " : ""}{fmt(selectedMovement.amount)}</p></div>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-muted-foreground">Descrição</p>
                <p className="font-medium">{selectedMovement.description ?? "—"}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CashRegister;
