import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, Legend, Cell,
} from "recharts";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const COLORS = [
  "hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))",
  "hsl(var(--chart-4))", "hsl(var(--chart-5))",
];

function useTicketByPayment() {
  return useQuery({
    queryKey: ["report-ticket-by-payment"],
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - 30);

      const { data } = await supabase
        .from("sales")
        .select("payment_method, total")
        .eq("status", "completed")
        .gte("sold_at", since.toISOString());

      const methods: Record<string, { total: number; count: number }> = {};
      data?.forEach((s) => {
        if (!methods[s.payment_method]) methods[s.payment_method] = { total: 0, count: 0 };
        methods[s.payment_method].total += Number(s.total);
        methods[s.payment_method].count++;
      });

      const rows = Object.entries(methods)
        .map(([method, v]) => ({
          method,
          avgTicket: v.count > 0 ? +(v.total / v.count).toFixed(2) : 0,
          totalRevenue: v.total,
          salesCount: v.count,
        }))
        .sort((a, b) => b.avgTicket - a.avgTicket);

      return rows;
    },
  });
}

const TicketByPayment = () => {
  const { data, isLoading } = useTicketByPayment();

  const exportCSV = () => {
    if (!data) return;
    const header = "Forma de Pagamento,Ticket Médio,Faturamento,Qtd Vendas\n";
    const rows = data.map((r) => `${r.method},${r.avgTicket},${r.totalRevenue.toFixed(2)},${r.salesCount}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "ticket-por-pagamento.csv"; a.click();
    toast.success("CSV exportado");
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  const highest = data?.[0];
  const lowest = data?.[data.length - 1];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ticket Médio por Forma de Pagamento</h1>
          <p className="text-muted-foreground text-sm">Últimos 30 dias — quem paga mais?</p>
        </div>
        <Button variant="outline" onClick={exportCSV}><Download className="h-4 w-4 mr-1" /> Exportar CSV</Button>
      </div>

      {/* Insight cards */}
      {highest && lowest && highest.method !== lowest.method && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="border-chart-2/30 bg-chart-2/5">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Maior ticket médio</p>
              <p className="text-lg font-bold">{highest.method}</p>
              <p className="text-2xl font-bold text-emerald-600">{fmt(highest.avgTicket)}</p>
            </CardContent>
          </Card>
          <Card className="border-chart-4/30 bg-chart-4/5">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Menor ticket médio</p>
              <p className="text-lg font-bold">{lowest.method}</p>
              <p className="text-2xl font-bold text-amber-600">{fmt(lowest.avgTicket)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Chart */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Comparativo de Ticket Médio</CardTitle></CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data ?? []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v: number) => fmt(v)} />
                <YAxis type="category" dataKey="method" tick={{ fontSize: 12 }} width={100} />
                <RechartsTooltip
                  formatter={(v: number, name: string) => [fmt(v), name]}
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)", fontSize: 12 }}
                />
                <Bar dataKey="avgTicket" name="Ticket Médio" radius={[0, 4, 4, 0]}>
                  {data?.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Detalhamento</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Forma de Pagamento</TableHead>
                <TableHead className="text-right">Ticket Médio</TableHead>
                <TableHead className="text-right">Faturamento</TableHead>
                <TableHead className="text-right">Nº Vendas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.map((r) => (
                <TableRow key={r.method}>
                  <TableCell className="font-medium capitalize">{r.method}</TableCell>
                  <TableCell className="text-right">{fmt(r.avgTicket)}</TableCell>
                  <TableCell className="text-right">{fmt(r.totalRevenue)}</TableCell>
                  <TableCell className="text-right">{r.salesCount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default TicketByPayment;
