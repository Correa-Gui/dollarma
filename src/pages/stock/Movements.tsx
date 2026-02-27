import { useState } from "react";
import { useStockMovements, useCreateStockMovement } from "@/hooks/useStockMovements";
import { useProducts } from "@/hooks/useProducts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge, type StatusTone } from "@/components/StatusBadge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2 } from "lucide-react";

const typeLabels: Record<string, string> = {
  purchase: "Entrada", sale: "Saída", adjustment_in: "Ajuste +",
  adjustment_out: "Ajuste -", refund: "Devolução", transfer: "Transferência",
};

const typeBadgeTone: Record<string, StatusTone> = {
  purchase: "success", sale: "info", adjustment_in: "purple",
  adjustment_out: "danger", refund: "warning", transfer: "neutral",
};

const Movements = () => {
  const { data: movements = [], isLoading } = useStockMovements();
  const { data: products = [] } = useProducts();
  const createMovement = useCreateStockMovement();

  const [filterType, setFilterType] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newMov, setNewMov] = useState({
    product_id: "",
    type: "adjustment_in",
    quantity: 1,
    reason: "",
  });

  const filtered = filterType === "all" ? movements : movements.filter((m) => m.type === filterType);

  const save = async () => {
    if (!newMov.product_id || newMov.quantity <= 0) return;
    await createMovement.mutateAsync({
      product_id: newMov.product_id,
      type: newMov.type,
      quantity: newMov.quantity,
      reason: newMov.reason || null,
      origin: "manual",
    });
    setDialogOpen(false);
    setNewMov({ product_id: "", type: "adjustment_in", quantity: 1, reason: "" });
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Movimentações de Estoque</h1>
          <p className="text-muted-foreground text-sm">{movements.length} registros</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-1" /> Ajuste Manual</Button>
      </div>

      <div className="flex gap-3">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            {Object.entries(typeLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead className="text-right">Qtd</TableHead>
              <TableHead className="text-right">Antes</TableHead>
              <TableHead className="text-right">Depois</TableHead>
              <TableHead>Origem</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="text-xs">{new Date(m.created_at).toLocaleString("pt-BR")}</TableCell>
                <TableCell>
                  <StatusBadge tone={typeBadgeTone[m.type] ?? "neutral"}>{typeLabels[m.type] ?? m.type}</StatusBadge>
                </TableCell>
                <TableCell className="font-medium">{m.products?.name ?? "—"}</TableCell>
                <TableCell className="text-right">{m.quantity}</TableCell>
                <TableCell className="text-right">{m.previous_qty}</TableCell>
                <TableCell className="text-right">{m.new_qty}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{m.origin ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ajuste Manual de Estoque</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Produto</Label>
              <Select value={newMov.product_id} onValueChange={(v) => setNewMov({ ...newMov, product_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {products.map((p) => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={newMov.type} onValueChange={(v) => setNewMov({ ...newMov, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="adjustment_in">Ajuste Positivo</SelectItem>
                    <SelectItem value="adjustment_out">Ajuste Negativo</SelectItem>
                    <SelectItem value="purchase">Entrada (Compra)</SelectItem>
                    <SelectItem value="transfer">Transferência</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Quantidade</Label>
                <Input type="number" min={1} value={newMov.quantity} onChange={(e) => setNewMov({ ...newMov, quantity: +e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Motivo / Observação</Label>
              <Textarea value={newMov.reason} onChange={(e) => setNewMov({ ...newMov, reason: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={createMovement.isPending}>Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Movements;
