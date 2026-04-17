import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Printer, X, ArrowUpRight, ArrowDownRight, Wallet, FileText } from "lucide-react";
import { useCashRegisterSessions } from "@/hooks/useCashRegister";
import { useTerminals } from "@/hooks/useTerminals";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { getPaymentLabel } from "@/lib/payment";
import type { CashSession } from "@/hooks/useCashRegister";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (iso: string) => new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

type ReportRow =
  | {
      id: string;
      kind: "sale";
      terminal: string;
      time: string;
      amount: number;
      payment: string;
      detail: string;
      sessionLabel: string;
    }
  | {
      id: string;
      kind: "withdrawal" | "deposit" | "refund";
      terminal: string;
      time: string;
      amount: number;
      payment: string;
      detail: string;
      sessionLabel: string;
    };

function getSessionSalesTotal(session: CashSession) {
  return (session.sales ?? [])
    .filter((sale) => sale.status === "completed")
    .reduce((sum, sale) => sum + Number(sale.total), 0);
}

function getSessionWithdrawalsTotal(session: CashSession) {
  return (session.cash_register_movements ?? [])
    .filter((movement) => movement.type === "withdrawal")
    .reduce((sum, movement) => sum + Number(movement.amount), 0);
}

const CashRegisterConsolidatedReport = () => {
  const [searchParams] = useSearchParams();
  const terminalId = searchParams.get("terminalId") ?? "all";
  const dateFrom = searchParams.get("dateFrom") ?? new Date().toISOString().slice(0, 10);
  const dateTo = searchParams.get("dateTo") ?? dateFrom;

  const { data: settings } = useStoreSettings();
  const { data: terminals = [] } = useTerminals();
  const { data: sessions = [], isLoading } = useCashRegisterSessions(
    terminalId === "all" ? undefined : terminalId,
    dateFrom,
    dateTo,
  );

  const terminalMap = useMemo(() => Object.fromEntries(terminals.map((t) => [t.id, t.name])), [terminals]);

  const reportRows = useMemo<ReportRow[]>(() => {
    const rows: ReportRow[] = [];
    sessions.forEach((session) => {
      const terminal = terminalMap[session.terminal_id] ?? "Terminal";
      const sessionLabel = `${terminal} · ${new Date(session.opened_at).toLocaleDateString("pt-BR")}`;

      (session.sales ?? []).forEach((sale) => {
        if (sale.status !== "completed") {
          return;
        }

        const customerLabel = sale.customers?.name ?? sale.customer_name ?? "";
        rows.push({
          id: sale.id,
          kind: "sale",
          terminal,
          time: sale.sold_at,
          amount: Number(sale.total),
          payment: getPaymentLabel(sale.payment_method),
          detail: `Venda #${sale.sale_number}${customerLabel ? ` · ${customerLabel}` : ""}`,
          sessionLabel,
        });
      });

      (session.cash_register_movements ?? []).forEach((movement) => {
        rows.push({
          id: movement.id,
          kind: movement.type as "withdrawal" | "deposit" | "refund",
          terminal,
          time: movement.created_at,
          amount: Number(movement.amount),
          payment: movement.type === "withdrawal" ? "Dinheiro" : getPaymentLabel(movement.payment_method),
          detail: movement.description ?? movement.type,
          sessionLabel,
        });
      });
    });

    rows.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
    return rows;
  }, [sessions, terminalMap]);

  const summary = useMemo(() => {
    let opening = 0;
    let sales = 0;
    let withdrawals = 0;
    let closing = 0;
    let diff = 0;

    sessions.forEach((session) => {
      opening += Number(session.opening_balance ?? 0);
      sales += getSessionSalesTotal(session);
      withdrawals += getSessionWithdrawalsTotal(session);
      closing += Number(session.closing_balance ?? 0);
      diff += Number(session.difference ?? 0);
    });

    return { opening, sales, withdrawals, closing, diff, sessions: sessions.length };
  }, [sessions]);

  const periodLabel = `${new Date(dateFrom + "T00:00:00").toLocaleDateString("pt-BR")} a ${new Date(dateTo + "T00:00:00").toLocaleDateString("pt-BR")}`;

  const print = () => window.print();

  return (
    <div className="min-h-dvh bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50 print:bg-white print:text-black">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        <div className="flex flex-col gap-4 print:hidden md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Relatório consolidado</p>
            <h1 className="text-3xl font-bold">{settings?.store_name ?? "Dollarma"}</h1>
            <p className="text-sm text-slate-300">Caixa consolidado do período {periodLabel}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={print} className="bg-white text-slate-900 hover:bg-slate-100">
              <Printer className="mr-2 h-4 w-4" /> Imprimir
            </Button>
            <Button variant="outline" onClick={() => window.close()} className="bg-white text-slate-900 hover:bg-slate-100">
              <X className="mr-2 h-4 w-4" /> Fechar
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-5 print:grid-cols-5">
          <Card className="border-white/10 bg-white/5 text-white shadow-xl backdrop-blur print:border-slate-200 print:bg-white print:text-black">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-sky-500/20 p-2 text-sky-300"><Wallet className="h-5 w-5" /></div>
                <div>
                  <p className="text-xs text-slate-300 print:text-slate-500">Sessões</p>
                  <p className="text-2xl font-bold">{summary.sessions}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-white/5 text-white shadow-xl backdrop-blur print:border-slate-200 print:bg-white print:text-black">
            <CardContent className="p-4">
              <p className="text-xs text-slate-300 print:text-slate-500">Abertura</p>
              <p className="mt-1 text-2xl font-bold text-sky-300 print:text-slate-900">{fmt(summary.opening)}</p>
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-white/5 text-white shadow-xl backdrop-blur print:border-slate-200 print:bg-white print:text-black">
            <CardContent className="p-4">
              <p className="text-xs text-slate-300 print:text-slate-500">Vendas</p>
              <p className="mt-1 text-2xl font-bold text-emerald-300 print:text-emerald-700">{fmt(summary.sales)}</p>
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-white/5 text-white shadow-xl backdrop-blur print:border-slate-200 print:bg-white print:text-black">
            <CardContent className="p-4">
              <p className="text-xs text-slate-300 print:text-slate-500">Sangrias</p>
              <p className="mt-1 text-2xl font-bold text-rose-300 print:text-rose-700">{fmt(summary.withdrawals)}</p>
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-white/5 text-white shadow-xl backdrop-blur print:border-slate-200 print:bg-white print:text-black">
            <CardContent className="p-4">
              <p className="text-xs text-slate-300 print:text-slate-500">Diferença</p>
              <p className={`mt-1 text-2xl font-bold ${summary.diff < 0 ? "text-rose-300 print:text-rose-700" : "text-emerald-300 print:text-emerald-700"}`}>{fmt(summary.diff)}</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
          <Card className="border-white/10 bg-white/5 text-white shadow-2xl backdrop-blur print:border-slate-200 print:bg-white print:text-black">
            <CardContent className="p-0">
              <div className="border-b border-white/10 px-5 py-4 print:border-slate-200">
                <h2 className="text-lg font-semibold">Movimentações do período</h2>
                <p className="text-sm text-slate-300 print:text-slate-500">Vendas, sangrias, suprimentos e estornos em ordem cronológica</p>
              </div>
              <div className="overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-transparent">
                      <TableHead className="text-slate-300 print:text-slate-500">Data / Hora</TableHead>
                      <TableHead className="text-slate-300 print:text-slate-500">Terminal</TableHead>
                      <TableHead className="text-slate-300 print:text-slate-500">Tipo</TableHead>
                      <TableHead className="text-right text-slate-300 print:text-slate-500">Valor</TableHead>
                      <TableHead className="text-slate-300 print:text-slate-500">Pagamento</TableHead>
                      <TableHead className="text-slate-300 print:text-slate-500">Detalhes</TableHead>
                      <TableHead className="text-slate-300 print:text-slate-500">Sessão</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow><TableCell colSpan={7} className="py-10 text-center text-slate-300">Carregando...</TableCell></TableRow>
                    ) : reportRows.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="py-10 text-center text-slate-300">Nenhuma movimentação no período.</TableCell></TableRow>
                    ) : reportRows.map((row) => (
                      <TableRow key={row.id} className="border-white/10 hover:bg-white/5 print:border-slate-200">
                        <TableCell className="tabular-nums text-slate-200 print:text-black">{fmtDate(row.time)}</TableCell>
                        <TableCell className="text-slate-200 print:text-black">{row.terminal}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={row.kind === "sale" ? "border-emerald-400/30 text-emerald-300" : row.kind === "withdrawal" ? "border-rose-400/30 text-rose-300" : "border-slate-400/30 text-slate-300"}>
                            {row.kind === "sale" ? "Venda" : row.kind === "withdrawal" ? "Sangria" : row.kind === "deposit" ? "Suprimento" : "Estorno"}
                          </Badge>
                        </TableCell>
                        <TableCell className={`text-right font-semibold tabular-nums ${row.kind === "sale" ? "text-emerald-300 print:text-emerald-700" : row.kind === "withdrawal" ? "text-rose-300 print:text-rose-700" : "text-sky-300 print:text-sky-700"}`}>
                          {row.kind === "withdrawal" ? "- " : ""}{fmt(row.amount)}
                        </TableCell>
                        <TableCell className="text-slate-200 print:text-black">{row.payment}</TableCell>
                        <TableCell className="max-w-[260px] truncate text-slate-200 print:text-black">{row.detail}</TableCell>
                        <TableCell className="text-slate-400 print:text-slate-600">{row.sessionLabel}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-white/10 bg-white/5 text-white shadow-2xl backdrop-blur print:border-slate-200 print:bg-white print:text-black">
              <CardContent className="p-0">
                <div className="border-b border-white/10 px-5 py-4 print:border-slate-200">
                  <h2 className="text-lg font-semibold">Resumo por sessão</h2>
                </div>
                <div className="overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10 hover:bg-transparent">
                        <TableHead className="text-slate-300 print:text-slate-500">Terminal</TableHead>
                        <TableHead className="text-slate-300 print:text-slate-500">Saldo inicial</TableHead>
                        <TableHead className="text-slate-300 print:text-slate-500">Vendas</TableHead>
                        <TableHead className="text-slate-300 print:text-slate-500">Sangrias</TableHead>
                        <TableHead className="text-slate-300 print:text-slate-500">Diferença</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sessions.map((session) => (
                        <TableRow key={session.id} className="border-white/10 hover:bg-white/5 print:border-slate-200">
                          <TableCell className="text-slate-200 print:text-black">{terminalMap[session.terminal_id] ?? "—"}</TableCell>
                          <TableCell className="text-slate-200 print:text-black">{fmt(Number(session.opening_balance ?? 0))}</TableCell>
                          <TableCell className="text-emerald-300 print:text-emerald-700">{fmt(getSessionSalesTotal(session))}</TableCell>
                          <TableCell className="text-rose-300 print:text-rose-700">{fmt(getSessionWithdrawalsTotal(session))}</TableCell>
                          <TableCell className={Number(session.difference ?? 0) < 0 ? "text-rose-300 print:text-rose-700" : "text-emerald-300 print:text-emerald-700"}>
                            {fmt(Number(session.difference ?? 0))}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/5 text-white shadow-2xl backdrop-blur print:border-slate-200 print:bg-white print:text-black">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-white/10 p-3 text-sky-300 print:bg-sky-50 print:text-sky-700">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-400 print:text-slate-500">Emitido em</p>
                    <p className="text-sm font-medium">{new Date().toLocaleString("pt-BR")}</p>
                  </div>
                </div>
                <div className="mt-4 text-sm text-slate-300 print:text-slate-600">
                  <p>Período: {periodLabel}</p>
                  <p>Relatório pronto para impressão e conferência gerencial.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashRegisterConsolidatedReport;
