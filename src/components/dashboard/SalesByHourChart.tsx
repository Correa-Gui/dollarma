import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSalesByHour } from "@/hooks/useDashboardData";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Loader2 } from "lucide-react";

export function SalesByHourChart() {
  const { data = [], isLoading } = useSalesByHour();

  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base">Vendas por Hora</CardTitle></CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-[300px]"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                <Bar dataKey="sales" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} name="Vendas" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
