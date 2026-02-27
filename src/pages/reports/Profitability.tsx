import { useProducts } from "@/hooks/useProducts";
import { useSales } from "@/hooks/useSales";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const Profitability = () => {
  const { data: products = [], isLoading: lp } = useProducts();
  const { data: sales = [], isLoading: ls } = useSales();

  // Aggregate volumes from real sales
  const volumes: Record<string, number> = {};
  sales.filter((s) => s.status === "completed").forEach((s) => {
    s.sale_items?.forEach((it) => { volumes[it.product_name] = (volumes[it.product_name] || 0) + it.quantity; });
  });

  const profitData = products.map((p) => {
    const vol = volumes[p.name] ?? 0;
    const cost = Number(p.cost_price);
    const sale = Number(p.sale_price);
    const margin = cost > 0 ? +(((sale - cost) / cost) * 100).toFixed(1) : 0;
    return {
      name: p.name, category: p.categories?.name ?? "—",
      costPrice: cost, salePrice: sale, margin,
      totalProfit: +((sale - cost) * vol).toFixed(2), volumeSold: vol,
    };
  });

  const byCategory = Array.from(
    profitData.reduce((map, p) => {
      const e = map.get(p.category) || { category: p.category, totalProfit: 0, totalRevenue: 0 };
      e.totalProfit += p.totalProfit;
      e.totalRevenue += p.salePrice * p.volumeSold;
      map.set(p.category, e);
      return map;
    }, new Map<string, { category: string; totalProfit: number; totalRevenue: number }>())
  ).map(([, v]) => ({ ...v, margin: v.totalRevenue - v.totalProfit > 0 ? +((v.totalProfit / (v.totalRevenue - v.totalProfit)) * 100).toFixed(1) : 0 }));

  const scatterData = profitData.map((p) => ({ x: p.margin, y: p.volumeSold, z: p.totalProfit, name: p.name }));

  const exportCSV = () => {
    const header = "Produto,Categoria,Custo,Venda,Margem%,Lucro Total,Volume\n";
    const rows = profitData.map((p) => `${p.name},${p.category},${p.costPrice},${p.salePrice},${p.margin},${p.totalProfit},${p.volumeSold}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "lucratividade.csv"; a.click();
    toast.success("CSV exportado");
  };

  if (lp || ls) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lucratividade</h1>
          <p className="text-muted-foreground text-sm">Análise de margem e lucro por produto e categoria</p>
        </div>
        <Button variant="outline" onClick={exportCSV}><Download className="h-4 w-4 mr-1" /> Exportar CSV</Button>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Margem (%) vs Volume Vendido</CardTitle></CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" dataKey="x" name="Margem %" tick={{ fontSize: 11 }} unit="%" />
                <YAxis type="number" dataKey="y" name="Volume" tick={{ fontSize: 11 }} />
                <ZAxis type="number" dataKey="z" range={[40, 400]} name="Lucro" />
                <Tooltip content={({ payload }) => {
                  if (!payload?.length) return null;
                  const d = payload[0].payload;
                  return (<div className="rounded-lg border bg-card p-3 text-sm shadow-md"><p className="font-medium">{d.name}</p><p>Margem: {d.x}%</p><p>Volume: {d.y} un</p><p>Lucro: {fmt(d.z)}</p></div>);
                }} />
                <Scatter data={scatterData} fill="hsl(var(--chart-4))" opacity={0.7} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="product">
        <TabsList><TabsTrigger value="product">Por Produto</TabsTrigger><TabsTrigger value="category">Por Categoria</TabsTrigger></TabsList>
        <TabsContent value="product">
          <div className="rounded-lg border">
            <Table>
              <TableHeader><TableRow><TableHead>Produto</TableHead><TableHead>Categoria</TableHead><TableHead className="text-right">Custo</TableHead><TableHead className="text-right">Venda</TableHead><TableHead className="text-right">Margem</TableHead><TableHead className="text-right">Lucro Total</TableHead><TableHead className="text-right">Volume</TableHead></TableRow></TableHeader>
              <TableBody>
                {profitData.sort((a, b) => b.totalProfit - a.totalProfit).map((p) => (
                  <TableRow key={p.name}><TableCell className="font-medium">{p.name}</TableCell><TableCell>{p.category}</TableCell><TableCell className="text-right">{fmt(p.costPrice)}</TableCell><TableCell className="text-right">{fmt(p.salePrice)}</TableCell><TableCell className="text-right">{p.margin}%</TableCell><TableCell className="text-right font-medium">{fmt(p.totalProfit)}</TableCell><TableCell className="text-right">{p.volumeSold}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        <TabsContent value="category">
          <div className="rounded-lg border">
            <Table>
              <TableHeader><TableRow><TableHead>Categoria</TableHead><TableHead className="text-right">Lucro Total</TableHead><TableHead className="text-right">Receita Total</TableHead><TableHead className="text-right">Margem Média</TableHead></TableRow></TableHeader>
              <TableBody>
                {byCategory.sort((a, b) => b.totalProfit - a.totalProfit).map((c) => (
                  <TableRow key={c.category}><TableCell className="font-medium">{c.category}</TableCell><TableCell className="text-right font-medium">{fmt(c.totalProfit)}</TableCell><TableCell className="text-right">{fmt(c.totalRevenue)}</TableCell><TableCell className="text-right">{c.margin}%</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profitability;
