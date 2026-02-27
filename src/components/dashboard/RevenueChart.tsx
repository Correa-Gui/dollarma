import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { revenueLast30Days } from "@/data/mock-data";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function RevenueChart() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Faturamento — Últimos 30 dias</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueLast30Days}>
              <defs>
                <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(value: number) =>
                  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                }
                labelStyle={{ color: "hsl(var(--foreground))" }}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Area
                type="monotone"
                dataKey="current"
                stroke="hsl(var(--chart-1))"
                fillOpacity={1}
                fill="url(#colorCurrent)"
                name="Atual"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="previous"
                stroke="hsl(var(--chart-3))"
                fill="none"
                strokeDasharray="5 5"
                name="Mês anterior"
                strokeWidth={1.5}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
