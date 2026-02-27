import { useProducts } from "@/hooks/useProducts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, ShoppingCart, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

const CriticalStock = () => {
  const { data: products = [], isLoading } = useProducts();

  const criticalProducts = products
    .filter((p) => p.is_active && p.stock_quantity <= p.min_stock)
    .map((p) => ({
      id: p.id, name: p.name, sku: p.sku,
      category: p.categories?.name ?? "—",
      supplier: p.suppliers?.name ?? "—",
      currentStock: p.stock_quantity, minStock: p.min_stock,
      suggestedReorder: Math.max(0, p.min_stock * 2 - p.stock_quantity),
    }));

  const suppliers = [...new Set(criticalProducts.map((p) => p.supplier))];

  const exportCSV = () => {
    const header = "SKU,Produto,Categoria,Fornecedor,Estoque Atual,Mínimo,Sugestão Reposição\n";
    const rows = criticalProducts.map((p) => `${p.sku},${p.name},${p.category},${p.supplier},${p.currentStock},${p.minStock},${p.suggestedReorder}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "estoque-critico.csv"; a.click();
    toast.success("CSV exportado");
  };

  const generateOrder = (supplier: string) => {
    const items = criticalProducts.filter((p) => p.supplier === supplier);
    toast.success(`Pedido de compra gerado para ${supplier} — ${items.length} itens`);
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Estoque Crítico</h1>
          <p className="text-muted-foreground text-sm">{criticalProducts.length} produto(s) abaixo do estoque mínimo</p>
        </div>
        <Button variant="outline" onClick={exportCSV}><Download className="h-4 w-4 mr-1" /> Exportar CSV</Button>
      </div>

      {criticalProducts.length > 0 && (
        <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
          <div>
            <p className="font-medium text-sm">Atenção: produtos precisam de reposição</p>
            <p className="text-xs text-muted-foreground mt-1">Gere pedidos de compra agrupados por fornecedor.</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {suppliers.map((s) => (
                <Button key={s} variant="outline" size="sm" onClick={() => generateOrder(s)}>
                  <ShoppingCart className="h-3.5 w-3.5 mr-1" />Pedir — {s}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead><TableHead>Produto</TableHead><TableHead>Categoria</TableHead>
              <TableHead>Fornecedor</TableHead><TableHead className="text-right">Estoque Atual</TableHead>
              <TableHead className="text-right">Mínimo</TableHead><TableHead className="text-right">Sugestão Reposição</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {criticalProducts.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-mono text-xs">{p.sku}</TableCell>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell>{p.category}</TableCell>
                <TableCell>{p.supplier}</TableCell>
                <TableCell className="text-right"><Badge variant="destructive">{p.currentStock}</Badge></TableCell>
                <TableCell className="text-right">{p.minStock}</TableCell>
                <TableCell className="text-right font-semibold">{p.suggestedReorder}</TableCell>
              </TableRow>
            ))}
            {criticalProducts.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum produto com estoque crítico 🎉</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default CriticalStock;
