import { useState } from "react";
import { useProducts } from "@/hooks/useProducts";
import { useCreateStockMovement } from "@/hooks/useStockMovements";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge, type StatusTone } from "@/components/StatusBadge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Download, Upload, ClipboardCheck, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type InventoryItem = {
  id: string; name: string; sku: string; systemQty: number;
  countedQty: number | null; difference: number | null;
  status: "pending" | "counted" | "adjusted";
};

const statusLabel = { pending: "Pendente", counted: "Contado", adjusted: "Ajustado" };
const statusTone: Record<string, StatusTone> = {
  pending: "warning", counted: "info", adjusted: "success",
};

const Inventory = () => {
  const { data: products = [], isLoading } = useProducts();
  const createMovement = useCreateStockMovement();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  // Initialize from real products
  if (!initialized && products.length > 0) {
    setItems(products.map((p) => ({
      id: p.id, name: p.name, sku: p.sku, systemQty: p.stock_quantity,
      countedQty: null, difference: null, status: "pending" as const,
    })));
    setInitialized(true);
  }

  const pendingCount = items.filter((i) => i.status === "pending").length;
  const countedCount = items.filter((i) => i.status === "counted").length;
  const withDifference = items.filter((i) => i.difference !== null && i.difference !== 0);

  const updateCount = (id: string, value: string) => {
    const qty = value === "" ? null : +value;
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, countedQty: qty, difference: qty !== null ? qty - item.systemQty : null, status: qty !== null ? "counted" as const : "pending" as const }
          : item
      )
    );
  };

  const exportRomaneio = () => {
    const header = "SKU,Produto,Estoque Sistema,Contagem\n";
    const rows = items.map((i) => `${i.sku},${i.name},${i.systemQty},`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "romaneio-inventario.csv"; a.click();
    toast.success("Romaneio exportado como CSV");
  };

  const importCSV = () => {
    const input = document.createElement("input");
    input.type = "file"; input.accept = ".csv";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        const lines = text.split("\n").slice(1);
        const updates: Record<string, number> = {};
        lines.forEach((line) => {
          const parts = line.split(",");
          if (parts.length >= 4 && parts[3]?.trim()) updates[parts[0].trim()] = +parts[3].trim();
        });
        setItems((prev) => prev.map((item) => {
          const counted = updates[item.sku];
          if (counted !== undefined) return { ...item, countedQty: counted, difference: counted - item.systemQty, status: "counted" as const };
          return item;
        }));
        toast.success(`Contagem importada — ${Object.keys(updates).length} itens atualizados`);
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const confirmAdjustments = async () => {
    const toAdjust = items.filter((i) => i.status === "counted" && i.countedQty !== null && i.difference !== 0);
    for (const item of toAdjust) {
      const diff = item.countedQty! - item.systemQty;
      await createMovement.mutateAsync({
        product_id: item.id,
        type: diff > 0 ? "adjustment_in" : "adjustment_out",
        quantity: Math.abs(diff),
        reason: "Ajuste de inventário",
        origin: "inventario",
      });
    }
    setItems((prev) => prev.map((item) =>
      item.status === "counted" && item.countedQty !== null
        ? { ...item, systemQty: item.countedQty, difference: 0, status: "adjusted" as const }
        : item
    ));
    setConfirmDialogOpen(false);
    toast.success("Ajustes aplicados — movimentações de estoque registradas");
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventário</h1>
          <p className="text-muted-foreground text-sm">{pendingCount} pendentes · {countedCount} contados · {withDifference.length} com diferença</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportRomaneio}><Download className="h-4 w-4 mr-1" /> Romaneio</Button>
          <Button variant="outline" onClick={importCSV}><Upload className="h-4 w-4 mr-1" /> Importar CSV</Button>
          <Button onClick={() => setConfirmDialogOpen(true)} disabled={countedCount === 0}>
            <ClipboardCheck className="h-4 w-4 mr-1" /> Confirmar Ajustes
          </Button>
        </div>
      </div>

      {withDifference.length > 0 && (
        <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-4">
          <div className="flex items-center gap-2 mb-2"><AlertTriangle className="h-4 w-4 text-amber-500" /><p className="font-medium text-sm">Divergências encontradas</p></div>
          <p className="text-xs text-muted-foreground">{withDifference.length} produto(s) com diferença entre estoque do sistema e contagem física.</p>
        </div>
      )}

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead><TableHead>Produto</TableHead>
              <TableHead className="text-right">Estoque Sistema</TableHead>
              <TableHead className="text-right w-[140px]">Contagem Física</TableHead>
              <TableHead className="text-right">Diferença</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell className="text-right">{item.systemQty}</TableCell>
                <TableCell className="text-right">
                  <Input type="number" min={0} className="w-[100px] ml-auto text-right h-8" value={item.countedQty ?? ""} onChange={(e) => updateCount(item.id, e.target.value)} placeholder="—" disabled={item.status === "adjusted"} />
                </TableCell>
                <TableCell className="text-right">
                  {item.difference !== null ? (
                    <span className={cn("font-semibold", item.difference > 0 && "text-emerald-600", item.difference < 0 && "text-destructive", item.difference === 0 && "text-muted-foreground")}>
                      {item.difference > 0 ? "+" : ""}{item.difference}
                    </span>
                  ) : <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell>
                  <StatusBadge tone={statusTone[item.status]}>
                    {item.status === "adjusted" && <CheckCircle2 className="h-3 w-3" />}
                    {statusLabel[item.status]}
                  </StatusBadge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Ajustes de Inventário</DialogTitle>
            <DialogDescription>{countedCount} item(ns) contado(s) serão ajustados.</DialogDescription>
          </DialogHeader>
          {withDifference.length > 0 && (
            <div className="max-h-[200px] overflow-y-auto space-y-1">
              {withDifference.map((item) => (
                <div key={item.id} className="flex justify-between text-sm py-1 border-b last:border-0">
                  <span>{item.name}</span>
                  <span className={cn("font-semibold", (item.difference ?? 0) > 0 ? "text-emerald-600" : "text-destructive")}>
                    {(item.difference ?? 0) > 0 ? "+" : ""}{item.difference}
                  </span>
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>Cancelar</Button>
            <Button onClick={confirmAdjustments}>Confirmar e Ajustar Estoque</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Inventory;
