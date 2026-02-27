import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { paymentMethodData } from "@/data/mock-data";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

export function PaymentMethodChart() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Forma de Pagamento</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px] flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={paymentMethodData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
                nameKey="name"
                label={({ name, value }) => `${name} ${value}%`}
                labelLine={false}
              >
                {paymentMethodData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => `${value}%`}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
