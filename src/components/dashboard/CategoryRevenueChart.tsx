import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRevenueByCategoryWeekly } from "@/hooks/useRevenueByCategoryWeekly";
import { Loader2 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export function CategoryRevenueChart() {
  const { data, isLoading } = useRevenueByCategoryWeekly();

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Faturamento por Categoria</CardTitle>
        <p className="text-xs text-muted-foreground">Últimas 4 semanas — composição semanal</p>
      </CardHeader>
      <CardContent>
        {isLoading || !data ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : data.categories.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
            Nenhuma venda com categoria no período
          </div>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.weeks}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 12 }}
                  className="fill-muted-foreground"
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  className="fill-muted-foreground"
                  tickFormatter={(v: number) =>
                    v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                  }
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "var(--radius)",
                    fontSize: 12,
                  }}
                  formatter={(value: number, name: string) => [
                    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
                    name,
                  ]}
                />
                <Legend
                  wrapperStyle={{ fontSize: 11 }}
                  iconSize={10}
                />
                {data.categories.map((cat, i) => (
                  <Bar
                    key={cat}
                    dataKey={cat}
                    stackId="a"
                    fill={data.colors[i]}
                    radius={i === data.categories.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
