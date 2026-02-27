import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTopProductsDashboard } from "@/hooks/useDashboardData";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Loader2 } from "lucide-react";

export function TopProductsChart() {
  const { data = [], isLoading } = useTopProductsDashboard();

  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base">Top 10 Produtos</CardTitle></CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-[300px]"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-[300px] text-sm text-muted-foreground">Sem dados de vendas</div>
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={130} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                <Bar dataKey="quantity" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} name="Quantidade" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
