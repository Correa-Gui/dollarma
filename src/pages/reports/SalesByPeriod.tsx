import { useSales } from "@/hooks/useSales";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Area, AreaChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Download, DollarSign, ShoppingCart, Receipt, TrendingDown, Loader2 } from "lucide-react";
import { toast } from "sonner";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const SalesByPeriod = () => {
  const { data: sales = [], isLoading } = useSales();

  // Compute data from real sales
  const now = new Date();
  const buckets: Record<string, { gross: number; net: number; discounts: number; sales: number; previousGross: number }> = {};
  for (let i = 0; i < 30; i++) {
    const d = new Date(now); d.setDate(d.getDate() - 29 + i);
    const key = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    buckets[key] = { gross: 0, net: 0, discounts: 0, sales: 0, previousGross: 0 };
  }

  sales.forEach((s) => {
    if (s.status !== "completed") return;
    const d = new Date(s.sold_at);
    const daysAgo = Math.floor((now.getTime() - d.getTime()) / 86400000);
    const key = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    const total = Number(s.total);
    if (daysAgo < 30 && buckets[key]) {
      buckets[key].gross += total;
      buckets[key].net += total;
      buckets[key].sales += 1;
    } else if (daysAgo >= 30 && daysAgo < 60) {
      const mapped = new Date(d); mapped.setDate(mapped.getDate() + 30);
      const mKey = mapped.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      if (buckets[mKey]) buckets[mKey].previousGross += total;
    }
  });

  const chartData = Object.entries(buckets).map(([date, v]) => ({
    date, gross: Math.round(v.gross), discounts: Math.round(v.discounts),
    net: Math.round(v.net), sales: v.sales,
    avgTicket: v.sales > 0 ? +(v.net / v.sales).toFixed(2) : 0,
    previousGross: Math.round(v.previousGross),
  }));

  const totals = {
    grossRevenue: chartData.reduce((s, d) => s + d.gross, 0),
    discounts: chartData.reduce((s, d) => s + d.discounts, 0),
    netRevenue: chartData.reduce((s, d) => s + d.net, 0),
    totalSales: chartData.reduce((s, d) => s + d.sales, 0),
    avgTicket: 0,
  };
  totals.avgTicket = totals.totalSales > 0 ? +(totals.netRevenue / totals.totalSales).toFixed(2) : 0;

  const exportCSV = () => {
    const header = "Data,Bruto,Descontos,Líquido,Vendas,Ticket Médio\n";
    const rows = chartData.map((d) => `${d.date},${d.gross},${d.discounts},${d.net},${d.sales},${d.avgTicket}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "vendas-por-periodo.csv"; a.click();
    toast.success("CSV exportado");
  };

  const kpis = [
    { label: "Faturamento Bruto", value: fmt(totals.grossRevenue), icon: DollarSign },
    { label: "Descontos", value: fmt(totals.discounts), icon: TrendingDown },
    { label: "Faturamento Líquido", value: fmt(totals.netRevenue), icon: DollarSign },
    { label: "Total de Vendas", value: totals.totalSales.toLocaleString("pt-BR"), icon: ShoppingCart },
    { label: "Ticket Médio", value: fmt(totals.avgTicket), icon: Receipt },
  ];

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vendas por Período</h1>
          <p className="text-muted-foreground text-sm">Últimos 30 dias</p>
        </div>
        <Button variant="outline" onClick={exportCSV}><Download className="h-4 w-4 mr-1" /> Exportar CSV</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <k.icon className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <p className="text-lg font-bold">{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Faturamento Diário — Atual vs Anterior</CardTitle></CardHeader>
        <CardContent>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                <Area type="monotone" dataKey="net" stroke="hsl(var(--chart-1))" fillOpacity={1} fill="url(#colorNet)" name="Líquido Atual" strokeWidth={2} />
                <Line type="monotone" dataKey="previousGross" stroke="hsl(var(--chart-3))" strokeDasharray="5 5" name="Bruto Anterior" strokeWidth={1.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesByPeriod;
