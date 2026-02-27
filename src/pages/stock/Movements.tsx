import { useState } from "react";
import { mockMovements, typeLabels, mockProducts, type MockMovement } from "@/data/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Plus } from "lucide-react";
import { toast } from "sonner";

const typeBadgeVariant: Record<MockMovement["type"], "default" | "secondary" | "destructive" | "outline"> = {
  purchase: "default",
  sale: "secondary",
  adjustment_in: "outline",
  adjustment_out: "destructive",
  refund: "outline",
  transfer: "secondary",
};

const Movements = () => {
  const [movements, setMovements] = useState<MockMovement[]>(mockMovements);
  const [filterType, setFilterType] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newMovement, setNewMovement] = useState({
    productName: mockProducts[0]?.name ?? "",
    type: "adjustment_in" as MockMovement["type"],
    quantity: 1,
    notes: "",
  });

  const filtered = filterType === "all" ? movements : movements.filter((m) => m.type === filterType);

  const save = () => {
    if (newMovement.quantity <= 0) {
      toast.error("Quantidade deve ser maior que zero");
      return;
    }
    const mov: MockMovement = {
      id: String(Date.now()),
      date: new Date().toLocaleString("pt-BR"),
      type: newMovement.type,
      productName: newMovement.productName,
      quantity: newMovement.quantity,
      balanceBefore: 20,
      balanceAfter: newMovement.type.includes("out") || newMovement.type === "sale"
        ? 20 - newMovement.quantity
        : 20 + newMovement.quantity,
      responsible: "Admin",
      origin: "Manual",
      notes: newMovement.notes,
    };
    setMovements((prev) => [mov, ...prev]);
    setDialogOpen(false);
    toast.success("Movimentação registrada");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Movimentações de Estoque</h1>
          <p className="text-muted-foreground text-sm">{movements.length} registros</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Ajuste Manual
        </Button>
      </div>

      <div className="flex gap-3">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
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
              <TableHead>Responsável</TableHead>
              <TableHead>Origem</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="text-xs">{m.date}</TableCell>
                <TableCell>
                  <Badge variant={typeBadgeVariant[m.type]}>{typeLabels[m.type]}</Badge>
                </TableCell>
                <TableCell className="font-medium">{m.productName}</TableCell>
                <TableCell className="text-right">{m.quantity}</TableCell>
                <TableCell className="text-right">{m.balanceBefore}</TableCell>
                <TableCell className="text-right">{m.balanceAfter}</TableCell>
                <TableCell>{m.responsible}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{m.origin}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajuste Manual de Estoque</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Produto</Label>
              <Select value={newMovement.productName} onValueChange={(v) => setNewMovement({ ...newMovement, productName: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {mockProducts.map((p) => (
                    <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={newMovement.type} onValueChange={(v) => setNewMovement({ ...newMovement, type: v as MockMovement["type"] })}>
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
                <Input type="number" min={1} value={newMovement.quantity} onChange={(e) => setNewMovement({ ...newMovement, quantity: +e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Motivo / Observação</Label>
              <Textarea value={newMovement.notes} onChange={(e) => setNewMovement({ ...newMovement, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={save}>Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Movements;
