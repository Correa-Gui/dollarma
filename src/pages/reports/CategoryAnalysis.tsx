import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
} from "recharts";

const COLORS = [
  "hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))",
  "hsl(var(--chart-4))", "hsl(var(--chart-5))", "hsl(225 50% 72%)",
  "hsl(262 40% 65%)", "hsl(35 80% 60%)",
];

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function useCategoryAnalysis() {
  return useQuery({
    queryKey: ["report-category-analysis"],
    queryFn: async () => {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      const { data } = await supabase
        .from("sale_items")
        .select("subtotal, quantity, products!inner(category_id, categories(name)), sales!inner(status, sold_at)")
        .eq("sales.status", "completed")
        .gte("sales.sold_at", prevMonthStart.toISOString());

      const cats: Record<string, { current: number; previous: number; count: number; prevCount: number }> = {};

      data?.forEach((item: any) => {
        const catName = item.products?.categories?.name ?? "Sem categoria";
        if (!cats[catName]) cats[catName] = { current: 0, previous: 0, count: 0, prevCount: 0 };
        const soldAt = new Date(item.sales.sold_at);
        const sub = Number(item.subtotal);
        const qty = item.quantity;
        if (soldAt >= monthStart) {
          cats[catName].current += sub;
          cats[catName].count += qty;
        } else {
          cats[catName].previous += sub;
          cats[catName].prevCount += qty;
        }
      });

      const totalCurrent = Object.values(cats).reduce((s, c) => s + c.current, 0);

      const rows = Object.entries(cats)
        .map(([name, v]) => ({
          name,
          revenue: v.current,
          pct: totalCurrent > 0 ? +((v.current / totalCurrent) * 100).toFixed(1) : 0,
          avgTicket: v.count > 0 ? v.current / v.count : 0,
          growth: v.previous > 0 ? +(((v.current - v.previous) / v.previous) * 100).toFixed(1) : 0,
          previous: v.previous,
        }))
        .sort((a, b) => b.revenue - a.revenue);

      // Highlight
      const topGrowing = rows.filter((r) => r.growth > 0).sort((a, b) => b.growth - a.growth)[0];
      const highlight = topGrowing
        ? `${topGrowing.name} cresceu ${topGrowing.growth}% este mês vs anterior`
        : null;

      // Monthly comparison data (current vs previous for bar chart)
      const barData = rows.map((r) => ({
        name: r.name.length > 12 ? r.name.slice(0, 12) + "…" : r.name,
        fullName: r.name,
        "Mês Atual": Math.round(r.revenue),
        "Mês Anterior": Math.round(r.previous),
      }));

      return { rows, barData, highlight, donutData: rows.map((r) => ({ name: r.name, value: Math.round(r.revenue) })) };
    },
  });
}

const CategoryAnalysis = () => {
  const { data, isLoading } = useCategoryAnalysis();

  const exportCSV = () => {
    if (!data) return;
    const header = "Categoria,Faturamento,% Total,Ticket Médio,Crescimento %\n";
    const rows = data.rows.map((r) => `${r.name},${r.revenue.toFixed(2)},${r.pct},${r.avgTicket.toFixed(2)},${r.growth}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "analise-categorias.csv"; a.click();
    toast.success("CSV exportado");
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Análise de Categorias</h1>
          <p className="text-muted-foreground text-sm">Participação, comparativo e tendência por categoria</p>
        </div>
        <Button variant="outline" onClick={exportCSV}><Download className="h-4 w-4 mr-1" /> Exportar CSV</Button>
      </div>

      {data?.highlight && (
        <Card className="border-chart-2/30 bg-chart-2/5">
          <CardContent className="p-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-500 shrink-0" />
            <span className="text-sm font-medium">{data.highlight}</span>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {/* Donut */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Participação no Faturamento</CardTitle></CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data?.donutData ?? []}
                    cx="50%" cy="50%"
                    innerRadius={60} outerRadius={100}
                    dataKey="value" nameKey="name"
                    paddingAngle={2}
                  >
                    {data?.donutData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(v: number) => fmt(v)} contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)", fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Bar comparison */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Atual vs Mês Anterior</CardTitle></CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.barData ?? []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
                  <RechartsTooltip formatter={(v: number, name: string, props: any) => [fmt(v), name]} contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)", fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Mês Atual" fill="hsl(var(--chart-1))" radius={[0, 3, 3, 0]} />
                  <Bar dataKey="Mês Anterior" fill="hsl(var(--chart-3))" radius={[0, 3, 3, 0]} opacity={0.6} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Detalhamento por Categoria</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Faturamento</TableHead>
                <TableHead className="text-right">% Total</TableHead>
                <TableHead className="text-right">Ticket Médio</TableHead>
                <TableHead className="text-right">Crescimento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.rows.map((r) => (
                <TableRow key={r.name}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell className="text-right">{fmt(r.revenue)}</TableCell>
                  <TableCell className="text-right">{r.pct}%</TableCell>
                  <TableCell className="text-right">{fmt(r.avgTicket)}</TableCell>
                  <TableCell className="text-right">
                    <span className={cn("inline-flex items-center gap-1 text-sm font-medium",
                      r.growth > 0 ? "text-emerald-500" : r.growth < 0 ? "text-destructive" : "text-muted-foreground"
                    )}>
                      {r.growth > 0 ? <TrendingUp className="h-3.5 w-3.5" /> : r.growth < 0 ? <TrendingDown className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
                      {r.growth > 0 ? "+" : ""}{r.growth}%
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default CategoryAnalysis;
