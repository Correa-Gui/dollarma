import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Loader2, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, Cell, ReferenceLine,
} from "recharts";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function useStockTurnover() {
  return useQuery({
    queryKey: ["report-stock-turnover"],
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - 30);

      // Get products with stock
      const { data: products } = await supabase
        .from("products")
        .select("id, name, stock_quantity, cost_price, sale_price, is_active")
        .eq("is_active", true);

      // Get sales quantities per product last 30 days
      const { data: salesItems } = await supabase
        .from("sale_items")
        .select("product_id, quantity, sales!inner(status, sold_at)")
        .eq("sales.status", "completed")
        .gte("sales.sold_at", since.toISOString());

      const soldQty: Record<string, number> = {};
      salesItems?.forEach((item: any) => {
        soldQty[item.product_id] = (soldQty[item.product_id] || 0) + item.quantity;
      });

      const rows = (products ?? []).map((p) => {
        const sold30d = soldQty[p.id] || 0;
        const dailyRate = sold30d / 30;
        const daysInStock = dailyRate > 0 ? +(p.stock_quantity / dailyRate).toFixed(1) : p.stock_quantity > 0 ? 999 : 0;
        const stockValue = p.stock_quantity * Number(p.cost_price);

        let status: "fast" | "normal" | "slow" | "stuck";
        if (daysInStock <= 7) status = "fast";
        else if (daysInStock <= 30) status = "normal";
        else if (daysInStock <= 60) status = "slow";
        else status = "stuck";

        return {
          name: p.name,
          stock: p.stock_quantity,
          sold30d,
          dailyRate: +dailyRate.toFixed(1),
          daysInStock: daysInStock >= 999 ? 999 : daysInStock,
          stockValue,
          status,
        };
      }).sort((a, b) => a.daysInStock - b.daysInStock);

      // Chart: top 15 by days in stock (descending for visual impact)
      const chartData = [...rows]
        .filter((r) => r.stock > 0)
        .sort((a, b) => b.daysInStock - a.daysInStock)
        .slice(0, 15)
        .map((r) => ({
          name: r.name.length > 18 ? r.name.slice(0, 18) + "…" : r.name,
          fullName: r.name,
          dias: Math.min(r.daysInStock, 90),
          status: r.status,
        }));

      const summary = {
        fast: rows.filter((r) => r.status === "fast").length,
        normal: rows.filter((r) => r.status === "normal").length,
        slow: rows.filter((r) => r.status === "slow").length,
        stuck: rows.filter((r) => r.status === "stuck").length,
        totalStockValue: rows.reduce((s, r) => s + r.stockValue, 0),
      };

      return { rows, chartData, summary };
    },
  });
}

const statusConfig = {
  fast: { label: "Giro rápido", color: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30", icon: CheckCircle },
  normal: { label: "Normal", color: "bg-blue-500/15 text-blue-600 border-blue-500/30", icon: Clock },
  slow: { label: "Lento", color: "bg-amber-500/15 text-amber-600 border-amber-500/30", icon: Clock },
  stuck: { label: "Parado", color: "bg-red-500/15 text-red-600 border-red-500/30", icon: AlertTriangle },
};

const barColor = (status: string) => {
  switch (status) {
    case "fast": return "hsl(var(--chart-2))";
    case "normal": return "hsl(var(--chart-1))";
    case "slow": return "hsl(var(--chart-4))";
    default: return "hsl(var(--destructive))";
  }
};

const StockTurnover = () => {
  const { data, isLoading } = useStockTurnover();

  const exportCSV = () => {
    if (!data) return;
    const header = "Produto,Estoque,Vendido 30d,Média Diária,Dias em Estoque,Valor Estoque,Status\n";
    const rows = data.rows.map((r) =>
      `${r.name},${r.stock},${r.sold30d},${r.dailyRate},${r.daysInStock >= 999 ? "Sem giro" : r.daysInStock},${r.stockValue.toFixed(2)},${statusConfig[r.status].label}`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "giro-estoque.csv"; a.click();
    toast.success("CSV exportado");
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Velocidade de Giro do Estoque</h1>
          <p className="text-muted-foreground text-sm">Dias em estoque por produto — últimos 30 dias de vendas</p>
        </div>
        <Button variant="outline" onClick={exportCSV}><Download className="h-4 w-4 mr-1" /> Exportar CSV</Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Giro rápido (≤7d)</p>
            <p className="text-2xl font-bold text-emerald-600">{data?.summary.fast}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Normal (8-30d)</p>
            <p className="text-2xl font-bold text-blue-600">{data?.summary.normal}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Lento (31-60d)</p>
            <p className="text-2xl font-bold text-amber-600">{data?.summary.slow}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Parado (60d+)</p>
            <p className="text-2xl font-bold text-destructive">{data?.summary.stuck}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Valor em estoque</p>
            <p className="text-xl font-bold">{fmt(data?.summary.totalStockValue ?? 0)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Dias em Estoque — Produtos com Mais Tempo Parado</CardTitle></CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.chartData ?? []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis type="number" tick={{ fontSize: 11 }} label={{ value: "dias", position: "insideBottomRight", offset: -5, fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={130} />
                <RechartsTooltip
                  formatter={(v: number) => [`${v} dias`, "Em estoque"]}
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)", fontSize: 12 }}
                />
                <ReferenceLine x={30} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" label={{ value: "30d", position: "top", fontSize: 10 }} />
                <Bar dataKey="dias" radius={[0, 4, 4, 0]}>
                  {data?.chartData.map((entry, i) => (
                    <Cell key={i} fill={barColor(entry.status)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Detalhamento por Produto</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead className="text-right">Estoque</TableHead>
                <TableHead className="text-right">Vendido 30d</TableHead>
                <TableHead className="text-right">Média/dia</TableHead>
                <TableHead className="text-right">Dias em Estoque</TableHead>
                <TableHead className="text-right">Valor Estoque</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.rows.map((r, i) => {
                const cfg = statusConfig[r.status];
                return (
                  <TableRow key={i}>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-xs", cfg.color)}>{cfg.label}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell className="text-right">{r.stock}</TableCell>
                    <TableCell className="text-right">{r.sold30d}</TableCell>
                    <TableCell className="text-right">{r.dailyRate}</TableCell>
                    <TableCell className="text-right font-medium">
                      {r.daysInStock >= 999 ? "Sem giro" : `${r.daysInStock}d`}
                    </TableCell>
                    <TableCell className="text-right">{fmt(r.stockValue)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default StockTurnover;
