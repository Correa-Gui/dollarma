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

const Refunds = () => {
  const { data: allSales = [], isLoading } = useSales();
  const qc = useQueryClient();

  const refundedSales = allSales.filter((s) => s.status === "refunded");
  const completedSales = allSales.filter((s) => s.status === "completed");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchSale, setSearchSale] = useState("");
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const filteredSales = completedSales.filter((s) =>
    String(s.sale_number).includes(searchSale) ||
    s.sale_items?.some((it) => it.product_name.toLowerCase().includes(searchSale.toLowerCase()))
  );

  const openNew = () => { setSelectedSale(null); setSelectedItems({}); setReason(""); setSearchSale(""); setDialogOpen(true); };
  const toggleItem = (itemId: string) => setSelectedItems((prev) => ({ ...prev, [itemId]: !prev[itemId] }));

  const confirmRefund = async () => {
    if (!selectedSale || !reason.trim()) return;
    const itemsToRefund = selectedSale.sale_items?.filter((it) => selectedItems[it.id]) ?? [];
    if (itemsToRefund.length === 0) { toast.error("Selecione ao menos um item"); return; }

    setSubmitting(true);
    try {
      await supabase.from("sales").update({ status: "refunded", cancel_reason: reason }).eq("id", selectedSale.id);
      // Restock products
      for (const item of itemsToRefund) {
        const { data: product } = await supabase.from("products").select("stock_quantity").eq("id", item.product_id).single();
        const prevQty = product?.stock_quantity ?? 0;
        const newQty = prevQty + item.quantity;
        await supabase.from("products").update({ stock_quantity: newQty }).eq("id", item.product_id);
        await supabase.from("stock_movements").insert({
          product_id: item.product_id, type: "refund", quantity: item.quantity,
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
          <DialogHeader><DialogTitle>Nova Devolução</DialogTitle><DialogDescription>Selecione a venda original e os itens a serem devolvidos</DialogDescription></DialogHeader>
          {!selectedSale ? (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar venda por número ou produto..." className="pl-9" value={searchSale} onChange={(e) => setSearchSale(e.target.value)} />
              </div>
              <div className="max-h-[300px] overflow-y-auto space-y-2">
                {filteredSales.slice(0, 10).map((s) => (
                  <button key={s.id} className="w-full flex items-center justify-between rounded-lg border p-3 hover:bg-accent text-left transition-colors" onClick={() => setSelectedSale(s)}>
                    <div><p className="font-medium text-sm">Venda #{s.sale_number}</p><p className="text-xs text-muted-foreground">{new Date(s.sold_at).toLocaleString("pt-BR")} — {s.sale_items?.length ?? 0} itens — {s.payment_method}</p></div>
                    <p className="font-semibold">{fmt(Number(s.total))}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-muted p-3">
                <div><p className="font-medium">Venda #{selectedSale.sale_number}</p><p className="text-xs text-muted-foreground">{new Date(selectedSale.sold_at).toLocaleString("pt-BR")}</p></div>
                <Button variant="outline" size="sm" onClick={() => setSelectedSale(null)}>Trocar</Button>
              </div>
              <div>
                <Label className="mb-2 block">Selecione os itens para devolução</Label>
                <div className="space-y-2">
                  {selectedSale.sale_items?.map((it) => (
                    <label key={it.id} className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-accent transition-colors">
                      <Checkbox checked={!!selectedItems[it.id]} onCheckedChange={() => toggleItem(it.id)} />
                      <div className="flex-1"><p className="text-sm font-medium">{it.product_name}</p><p className="text-xs text-muted-foreground">{it.quantity} × {fmt(Number(it.unit_price))}</p></div>
                      <p className="font-medium text-sm">{fmt(Number(it.subtotal))}</p>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Motivo da devolução *</Label>
                <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Produto com defeito, troca, arrependimento..." />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            {selectedSale && (
              <Button onClick={confirmRefund} disabled={submitting}>
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
