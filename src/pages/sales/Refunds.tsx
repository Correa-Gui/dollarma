import { useState } from "react";
import { useSales, type Sale } from "@/hooks/useSales";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Search, RotateCcw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// selectedItems: { [itemId]: quantity } — chave presente = selecionado
type SelectedItems = Record<string, number>;

const Refunds = () => {
  const { data: allSales = [], isLoading } = useSales();
  const qc = useQueryClient();

  const refundedSales = allSales.filter((s) => s.status === "refunded");
  const completedSales = allSales.filter((s) => s.status === "completed");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchSale, setSearchSale] = useState("");
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [selectedItems, setSelectedItems] = useState<SelectedItems>({});
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const filteredSales = completedSales.filter((s) =>
    String(s.sale_number).includes(searchSale) ||
    s.sale_items?.some((it) => it.product_name.toLowerCase().includes(searchSale.toLowerCase()))
  );

  const openNew = () => {
    setSelectedSale(null);
    setSelectedItems({});
    setReason("");
    setSearchSale("");
    setDialogOpen(true);
  };

  const toggleItem = (itemId: string, originalQty: number) => {
    setSelectedItems((prev) => {
      if (itemId in prev) {
        const next = { ...prev };
        delete next[itemId];
        return next;
      }
      return { ...prev, [itemId]: originalQty };
    });
  };

  const setItemQty = (itemId: string, value: number, max: number) => {
    const clamped = Math.max(1, Math.min(Math.floor(value) || 1, max));
    setSelectedItems((prev) => ({ ...prev, [itemId]: clamped }));
  };

  const refundTotal = selectedSale?.sale_items
    ?.filter((it) => it.id in selectedItems)
    .reduce((sum, it) => sum + Number(it.unit_price) * selectedItems[it.id], 0) ?? 0;

  const confirmRefund = async () => {
    if (!selectedSale || !reason.trim()) return;
    const itemsToRefund = selectedSale.sale_items?.filter((it) => it.id in selectedItems) ?? [];
    if (itemsToRefund.length === 0) { toast.error("Selecione ao menos um item"); return; }

    setSubmitting(true);
    try {
      await supabase.from("sales").update({ status: "refunded", cancel_reason: reason }).eq("id", selectedSale.id);

      for (const item of itemsToRefund) {
        const qty = selectedItems[item.id];
        const { data: product } = await supabase.from("products").select("stock_quantity").eq("id", item.product_id).single();
        const prevQty = product?.stock_quantity ?? 0;
        const newQty = prevQty + qty;
        await supabase.from("products").update({ stock_quantity: newQty }).eq("id", item.product_id);
        await supabase.from("stock_movements").insert({
          product_id: item.product_id, type: "refund", quantity: qty,
          previous_qty: prevQty, new_qty: newQty, reason, origin: "devolucao",
        });
      }

      qc.invalidateQueries({ queryKey: ["sales"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["stock_movements"] });
      toast.success("Devolução registrada — estoque reposto");
      setDialogOpen(false);
    } catch (e: any) {
      toast.error(`Erro: ${e.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Devoluções</h1>
          <p className="text-muted-foreground text-sm">{refundedSales.length} devoluções registradas</p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Nova Devolução</Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead><TableHead>Venda Nº</TableHead><TableHead>Motivo</TableHead>
              <TableHead>Itens</TableHead><TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {refundedSales.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="text-xs">{new Date(r.sold_at).toLocaleDateString("pt-BR")}</TableCell>
                <TableCell className="font-mono text-xs">#{r.sale_number}</TableCell>
                <TableCell>{r.cancel_reason ?? "—"}</TableCell>
                <TableCell>{r.sale_items?.map((it) => <span key={it.id} className="text-xs block">{it.product_name} × {it.quantity}</span>)}</TableCell>
                <TableCell className="text-right font-medium">{fmt(Number(r.total))}</TableCell>
              </TableRow>
            ))}
            {refundedSales.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhuma devolução registrada</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>

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
                      <p className="font-medium text-sm">Venda #{s.sale_number}</p>
                      <p className="text-xs text-muted-foreground">{new Date(s.sold_at).toLocaleString("pt-BR")} — {s.sale_items?.length ?? 0} itens — {s.payment_method}</p>
                    </div>
                    <p className="font-semibold">{fmt(Number(s.total))}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-muted p-3">
                <div>
                  <p className="font-medium">Venda #{selectedSale.sale_number}</p>
                  <p className="text-xs text-muted-foreground">{new Date(selectedSale.sold_at).toLocaleString("pt-BR")}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => { setSelectedSale(null); setSelectedItems({}); }}>Trocar</Button>
              </div>

              <div>
                <Label className="mb-2 block">Selecione os itens e a quantidade a devolver</Label>
                <div className="space-y-2">
                  {selectedSale.sale_items?.map((it) => {
                    const isChecked = it.id in selectedItems;
                    const qty = selectedItems[it.id] ?? it.quantity;
                    return (
                      <div
                        key={it.id}
                        className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-accent transition-colors"
                        onClick={() => toggleItem(it.id, it.quantity)}
                      >
                        <Checkbox checked={isChecked} onCheckedChange={() => toggleItem(it.id, it.quantity)} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{it.product_name}</p>
                          <p className="text-xs text-muted-foreground">Vendido: {it.quantity} × {fmt(Number(it.unit_price))}</p>
                        </div>
                        {isChecked && (
                          <div
                            className="flex items-center gap-1.5 shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="text-xs text-muted-foreground">Qtd:</span>
                            <Input
                              type="number"
                              min={1}
                              max={it.quantity}
                              value={qty}
                              onChange={(e) => setItemQty(it.id, +e.target.value, it.quantity)}
                              className="w-16 h-7 text-sm text-center"
                            />
                            <span className="text-xs text-muted-foreground">/ {it.quantity}</span>
                          </div>
                        )}
                        <p className="font-medium text-sm shrink-0">
                          {isChecked ? fmt(Number(it.unit_price) * qty) : fmt(Number(it.subtotal))}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {Object.keys(selectedItems).length > 0 && (
                <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-sm">
                  <span className="text-muted-foreground">{Object.keys(selectedItems).length} item(s) selecionado(s)</span>
                  <span className="font-semibold">Total a devolver: {fmt(refundTotal)}</span>
                </div>
              )}

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
              <Button onClick={confirmRefund} disabled={submitting || !reason.trim()}>
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
