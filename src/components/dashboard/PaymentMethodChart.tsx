import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePaymentMethodBreakdown } from "@/hooks/useDashboardData";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Loader2 } from "lucide-react";

export function PaymentMethodChart() {
  const { data = [], isLoading } = usePaymentMethodBreakdown();

  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base">Forma de Pagamento</CardTitle></CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-[280px]"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-[280px] text-sm text-muted-foreground">Sem dados</div>
        ) : (
          <div className="h-[280px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value" nameKey="name" label={({ name, value }) => `${name} ${value}%`} labelLine={false}>
                  {data.map((entry, index) => (<Cell key={index} fill={entry.color} />))}
                </Pie>
                <Tooltip formatter={(value: number) => `${value}%`} contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
