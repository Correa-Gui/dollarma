import { useSales } from "@/hooks/useSales";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getPaymentBucketKey, getPaymentLabel } from "@/lib/payment";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
type PaymentBucketKey = "pix" | "credit_card" | "debit_card" | "cash" | "other";

const CashFlow = () => {
  const { data: sales = [], isLoading } = useSales();

  const now = new Date();
  const buckets: Record<string, Record<PaymentBucketKey | "total", number>> = {};
  for (let i = 0; i < 30; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - 29 + i);
    const key = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    buckets[key] = { pix: 0, credit_card: 0, debit_card: 0, cash: 0, other: 0, total: 0 };
  }

  sales.filter((s) => s.status === "completed").forEach((s) => {
    const d = new Date(s.sold_at);
    const key = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    if (!buckets[key]) return;
    const total = Number(s.total);
    const candidate = getPaymentBucketKey(s.payment_method);
    const field: PaymentBucketKey =
      candidate === "pix" || candidate === "credit_card" || candidate === "debit_card" || candidate === "cash"
        ? candidate
        : "other";
    buckets[key][field] += total;
    buckets[key].total += total;
  });

  let accumulated = 0;
  const cashFlowData = Object.entries(buckets).map(([date, v]) => {
    accumulated += v.total;
    return { date, ...v, accumulated };
  });

  const lastDay = cashFlowData[cashFlowData.length - 1];

  const exportCSV = () => {
    const header = "Data,PIX,Cartão de Crédito,Cartão de Débito,Dinheiro,Outros,Total,Acumulado\n";
    const rows = cashFlowData.map((d) => `${d.date},${d.pix},${d.credit_card},${d.debit_card},${d.cash},${d.other},${d.total},${d.accumulated}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "fluxo-de-caixa.csv";
    a.click();
    toast.success("CSV exportado");
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fluxo de Caixa</h1>
          <p className="text-muted-foreground text-sm">Saldo acumulado: {fmt(lastDay?.accumulated ?? 0)}</p>
        </div>
        <Button variant="outline" onClick={exportCSV}><Download className="h-4 w-4 mr-1" /> Exportar CSV</Button>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Saldo Acumulado</CardTitle></CardHeader>
        <CardContent>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashFlowData}>
                <defs>
                  <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                <Area type="monotone" dataKey="accumulated" stroke="hsl(var(--chart-1))" fillOpacity={1} fill="url(#colorAcc)" name="Saldo" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Entradas por Forma de Pagamento</CardTitle></CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashFlowData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                <Bar dataKey="pix" stackId="a" fill="hsl(var(--chart-1))" name={getPaymentLabel("pix")} />
                <Bar dataKey="credit_card" stackId="a" fill="hsl(var(--chart-2))" name={getPaymentLabel("credit_card")} />
                <Bar dataKey="debit_card" stackId="a" fill="hsl(var(--chart-3))" name={getPaymentLabel("debit_card")} />
                <Bar dataKey="cash" stackId="a" fill="hsl(var(--chart-4))" name={getPaymentLabel("cash")} />
                <Bar dataKey="other" stackId="a" fill="hsl(var(--chart-5))" name="Outros" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead><TableHead className="text-right">PIX</TableHead>
              <TableHead className="text-right">Cartão de Crédito</TableHead><TableHead className="text-right">Cartão de Débito</TableHead>
              <TableHead className="text-right">Dinheiro</TableHead><TableHead className="text-right">Outros</TableHead><TableHead className="text-right">Total Dia</TableHead>
              <TableHead className="text-right">Acumulado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cashFlowData.map((d) => (
              <TableRow key={d.date}>
                <TableCell>{d.date}</TableCell>
                <TableCell className="text-right">{fmt(d.pix)}</TableCell>
                <TableCell className="text-right">{fmt(d.credit_card)}</TableCell>
                <TableCell className="text-right">{fmt(d.debit_card)}</TableCell>
                <TableCell className="text-right">{fmt(d.cash)}</TableCell>
                <TableCell className="text-right">{fmt(d.other)}</TableCell>
                <TableCell className="text-right font-medium">{fmt(d.total)}</TableCell>
                <TableCell className="text-right font-bold">{fmt(d.accumulated)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default CashFlow;
