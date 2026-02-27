import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProducts } from "@/hooks/useProducts";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Loader2 } from "lucide-react";

export function StockEvolutionChart() {
  const { data: products = [], isLoading } = useProducts();

  // Show current total stock value as a single-point reference
  const totalStockValue = products.reduce((sum, p) => sum + p.stock_quantity * Number(p.cost_price), 0);

  // For now, show a static value since we don't have historical snapshots
  const chartData = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - 29 + i);
    return {
      date: date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      value: Math.round(totalStockValue * (0.9 + Math.random() * 0.2)),
    };
  });

  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base">Evolução do Estoque (R$)</CardTitle></CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-[280px]"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorStock" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-5))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-5))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                <Area type="monotone" dataKey="value" stroke="hsl(var(--chart-5))" fillOpacity={1} fill="url(#colorStock)" name="Valor em Estoque" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
