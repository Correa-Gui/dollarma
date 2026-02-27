import { useState } from "react";
import { topSellingProducts } from "@/data/mock-reports-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download } from "lucide-react";
import { toast } from "sonner";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
type SortKey = "quantitySold" | "revenue" | "profit";

const TopSelling = () => {
  const [sortBy, setSortBy] = useState<SortKey>("quantitySold");
  const sorted = [...topSellingProducts].sort((a, b) => b[sortBy] - a[sortBy]);
  const chartData = sorted.slice(0, 10);

  const chartKey = sortBy === "quantitySold" ? "quantitySold" : sortBy;
  const chartLabel = sortBy === "quantitySold" ? "Quantidade" : sortBy === "revenue" ? "Faturamento (R$)" : "Lucro (R$)";

  const exportCSV = () => {
    const header = "Produto,Categoria,Qtd Vendida,Faturamento,Lucro,Margem\n";
    const rows = sorted.map((p) => `${p.name},${p.category},${p.quantitySold},${p.revenue},${p.profit},${p.margin}%`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "mais-vendidos.csv"; a.click();
    toast.success("CSV exportado");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Produtos Mais Vendidos</h1>
          <p className="text-muted-foreground text-sm">Ranking por {chartLabel.toLowerCase()}</p>
        </div>
        <Button variant="outline" onClick={exportCSV}><Download className="h-4 w-4 mr-1" /> Exportar CSV</Button>
      </div>

      <Tabs value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
        <TabsList>
          <TabsTrigger value="quantitySold">Quantidade</TabsTrigger>
          <TabsTrigger value="revenue">Faturamento</TabsTrigger>
          <TabsTrigger value="profit">Lucro</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Top 10 — {chartLabel}</CardTitle></CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={sortBy !== "quantitySold" ? (v) => `R$${(v/1000).toFixed(0)}k` : undefined} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={140} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} formatter={(v: number) => sortBy !== "quantitySold" ? fmt(v) : v} />
                <Bar dataKey={chartKey} fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} name={chartLabel} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="text-right">Qtd Vendida</TableHead>
              <TableHead className="text-right">Faturamento</TableHead>
              <TableHead className="text-right">Lucro</TableHead>
              <TableHead className="text-right">Margem</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((p, i) => (
              <TableRow key={p.name}>
                <TableCell className="font-mono text-xs">{i + 1}</TableCell>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell>{p.category}</TableCell>
                <TableCell className="text-right">{p.quantitySold}</TableCell>
                <TableCell className="text-right">{fmt(p.revenue)}</TableCell>
                <TableCell className="text-right">{fmt(p.profit)}</TableCell>
                <TableCell className="text-right">{p.margin}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default TopSelling;
