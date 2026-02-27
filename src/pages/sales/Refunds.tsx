import { useState } from "react";
import { mockSales, mockRefunds, type MockSale, type MockRefund } from "@/data/mock-sales-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Search, RotateCcw } from "lucide-react";
import { toast } from "sonner";

const Refunds = () => {
  const [refunds, setRefunds] = useState<MockRefund[]>(mockRefunds);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchSale, setSearchSale] = useState("");
  const [selectedSale, setSelectedSale] = useState<MockSale | null>(null);
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});
  const [reason, setReason] = useState("");

  const completedSales = mockSales.filter((s) => s.status === "completed");

  const filteredSales = completedSales.filter(
    (s) =>
      String(s.number).includes(searchSale) ||
      s.items.some((it) => it.productName.toLowerCase().includes(searchSale.toLowerCase()))
  );

  const openNew = () => {
    setSelectedSale(null);
    setSelectedItems({});
    setReason("");
    setSearchSale("");
    setDialogOpen(true);
  };

  const toggleItem = (itemId: string) => {
    setSelectedItems((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const confirmRefund = () => {
    if (!selectedSale) {
      toast.error("Selecione uma venda");
      return;
    }
    if (!reason.trim()) {
      toast.error("Motivo é obrigatório");
      return;
    }
    const itemsToRefund = selectedSale.items.filter((it) => selectedItems[it.id]);
    if (itemsToRefund.length === 0) {
      toast.error("Selecione ao menos um item");
      return;
    }

    const totalRefunded = +itemsToRefund.reduce((sum, it) => sum + it.subtotal, 0).toFixed(2);
    const newRefund: MockRefund = {
      id: `ref-${Date.now()}`,
      saleId: selectedSale.id,
      saleNumber: selectedSale.number,
      date: new Date().toLocaleDateString("pt-BR"),
      reason,
      items: itemsToRefund.map((it) => ({
        productName: it.productName,
        quantity: it.quantity,
        subtotal: it.subtotal,
      })),
      totalRefunded,
      createdBy: "Admin",
    };

    setRefunds((prev) => [newRefund, ...prev]);
    setDialogOpen(false);
    toast.success("Devolução registrada — estoque reposto automaticamente");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Devoluções</h1>
          <p className="text-muted-foreground text-sm">{refunds.length} devoluções registradas</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-1" /> Nova Devolução
        </Button>
      </div>

      {/* Refunds table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Venda Nº</TableHead>
              <TableHead>Motivo</TableHead>
              <TableHead>Itens</TableHead>
              <TableHead className="text-right">Valor Devolvido</TableHead>
              <TableHead>Responsável</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {refunds.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="text-xs">{r.date}</TableCell>
                <TableCell className="font-mono text-xs">#{r.saleNumber}</TableCell>
                <TableCell>{r.reason}</TableCell>
                <TableCell>
                  {r.items.map((it) => (
                    <span key={it.productName} className="text-xs block">
                      {it.productName} × {it.quantity}
                    </span>
                  ))}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {r.totalRefunded.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </TableCell>
                <TableCell>{r.createdBy}</TableCell>
              </TableRow>
            ))}
            {refunds.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhuma devolução registrada
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* New Refund Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Devolução</DialogTitle>
            <DialogDescription>Selecione a venda original e os itens a serem devolvidos</DialogDescription>
          </DialogHeader>

          {!selectedSale ? (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar venda por número ou produto..."
                  className="pl-9"
                  value={searchSale}
                  onChange={(e) => setSearchSale(e.target.value)}
                />
              </div>
              <div className="max-h-[300px] overflow-y-auto space-y-2">
                {filteredSales.slice(0, 10).map((s) => (
                  <button
                    key={s.id}
                    className="w-full flex items-center justify-between rounded-lg border p-3 hover:bg-accent text-left transition-colors"
                    onClick={() => setSelectedSale(s)}
                  >
                    <div>
                      <p className="font-medium text-sm">Venda #{s.number}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.soldAt} — {s.items.length} itens — {s.paymentMethod}
                      </p>
                    </div>
                    <p className="font-semibold">
                      {s.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-muted p-3">
                <div>
                  <p className="font-medium">Venda #{selectedSale.number}</p>
                  <p className="text-xs text-muted-foreground">{selectedSale.soldAt}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setSelectedSale(null)}>
                  Trocar
                </Button>
              </div>

              <div>
                <Label className="mb-2 block">Selecione os itens para devolução</Label>
                <div className="space-y-2">
                  {selectedSale.items.map((it) => (
                    <label
                      key={it.id}
                      className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-accent transition-colors"
                    >
                      <Checkbox
                        checked={!!selectedItems[it.id]}
                        onCheckedChange={() => toggleItem(it.id)}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{it.productName}</p>
                        <p className="text-xs text-muted-foreground">
                          {it.quantity} × {it.unitPrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </p>
                      </div>
                      <p className="font-medium text-sm">
                        {it.subtotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </p>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Motivo da devolução *</Label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Produto com defeito, troca, arrependimento..."
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            {selectedSale && (
              <Button onClick={confirmRefund}>
                <RotateCcw className="h-4 w-4 mr-1" /> Confirmar Devolução
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Refunds;
