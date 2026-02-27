import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
} from "recharts";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function useAbcCurve() {
  return useQuery({
    queryKey: ["report-abc-curve"],
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - 30);

      const { data } = await supabase
        .from("sale_items")
        .select("product_name, subtotal, quantity, sales!inner(status, sold_at)")
        .eq("sales.status", "completed")
        .gte("sales.sold_at", since.toISOString());

      const products: Record<string, { revenue: number; qty: number }> = {};
      data?.forEach((item: any) => {
        if (!products[item.product_name]) products[item.product_name] = { revenue: 0, qty: 0 };
        products[item.product_name].revenue += Number(item.subtotal);
        products[item.product_name].qty += item.quantity;
      });

      const sorted = Object.entries(products)
        .map(([name, v]) => ({ name, revenue: v.revenue, qty: v.qty }))
        .sort((a, b) => b.revenue - a.revenue);

      const totalRevenue = sorted.reduce((s, p) => s + p.revenue, 0);
      let cumulative = 0;

      const rows = sorted.map((p) => {
        cumulative += p.revenue;
        const cumulativePct = totalRevenue > 0 ? +((cumulative / totalRevenue) * 100).toFixed(1) : 0;
        const pct = totalRevenue > 0 ? +((p.revenue / totalRevenue) * 100).toFixed(1) : 0;
        let cls: "A" | "B" | "C";
        if (cumulativePct <= 80) cls = "A";
        else if (cumulativePct <= 95) cls = "B";
        else cls = "C";
        return { ...p, pct, cumulativePct, cls };
      });

      // Chart data (top 20 for readability)
      const chartData = rows.slice(0, 20).map((r) => ({
        name: r.name.length > 15 ? r.name.slice(0, 15) + "…" : r.name,
        fullName: r.name,
        Faturamento: Math.round(r.revenue),
        "% Acumulado": r.cumulativePct,
      }));

      const summary = {
        a: rows.filter((r) => r.cls === "A").length,
        b: rows.filter((r) => r.cls === "B").length,
        c: rows.filter((r) => r.cls === "C").length,
        total: rows.length,
      };

      return { rows, chartData, summary };
    },
  });
}

const classColors: Record<string, string> = {
  A: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  B: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  C: "bg-red-500/15 text-red-600 border-red-500/30",
};

const AbcCurve = () => {
  const { data, isLoading } = useAbcCurve();

  const exportCSV = () => {
    if (!data) return;
    const header = "Produto,Faturamento,% Individual,% Acumulado,Qtd,Classe\n";
    const rows = data.rows.map((r) => `${r.name},${r.revenue.toFixed(2)},${r.pct},${r.cumulativePct},${r.qty},${r.cls}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "curva-abc.csv"; a.click();
    toast.success("CSV exportado");
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Curva ABC de Produtos</h1>
          <p className="text-muted-foreground text-sm">Classificação por participação no faturamento — últimos 30 dias</p>
        </div>
        <Button variant="outline" onClick={exportCSV}><Download className="h-4 w-4 mr-1" /> Exportar CSV</Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { cls: "A", label: "Classe A — 80% do faturamento", count: data?.summary.a ?? 0, desc: "Nunca podem faltar" },
          { cls: "B", label: "Classe B — 15% do faturamento", count: data?.summary.b ?? 0, desc: "Intermediários" },
          { cls: "C", label: "Classe C — 5% do faturamento", count: data?.summary.c ?? 0, desc: "Baixo giro" },
        ].map((s) => (
          <Card key={s.cls}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className={cn("text-xs", classColors[s.cls])}>{s.cls}</Badge>
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
              <p className="text-2xl font-bold">{s.count} <span className="text-sm font-normal text-muted-foreground">produtos</span></p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pareto Chart */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Gráfico de Pareto</CardTitle></CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data?.chartData ?? []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" height={60} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${v}%`} domain={[0, 100]} />
                <RechartsTooltip
                  formatter={(v: number, name: string) => name === "% Acumulado" ? [`${v}%`, name] : [fmt(v), name]}
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)", fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar yAxisId="left" dataKey="Faturamento" fill="hsl(var(--chart-1))" radius={[3, 3, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="% Acumulado" stroke="hsl(var(--chart-4))" strokeWidth={2} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Classificação Detalhada</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Classe</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead className="text-right">Faturamento</TableHead>
                <TableHead className="text-right">% Individual</TableHead>
                <TableHead className="text-right">% Acumulado</TableHead>
                <TableHead className="text-right">Qtd Vendida</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.rows.map((r, i) => (
                <TableRow key={i}>
                  <TableCell><Badge variant="outline" className={cn("text-xs", classColors[r.cls])}>{r.cls}</Badge></TableCell>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell className="text-right">{fmt(r.revenue)}</TableCell>
                  <TableCell className="text-right">{r.pct}%</TableCell>
                  <TableCell className="text-right">{r.cumulativePct}%</TableCell>
                  <TableCell className="text-right">{r.qty}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AbcCurve;
