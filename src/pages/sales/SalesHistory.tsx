import { useState } from "react";
import { useSales, useCancelSale, type Sale } from "@/hooks/useSales";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, Eye, XCircle, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

const statusLabel: Record<string, string> = { completed: "Concluída", cancelled: "Cancelada", refunded: "Devolvida" };
const statusColor: Record<string, string> = {
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 border-red-200 dark:border-red-800",
  refunded: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border-amber-200 dark:border-amber-800",
};
const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const SalesHistory = () => {
  const { data: sales = [], isLoading } = useSales();
  const cancelSale = useCancelSale();

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPayment, setFilterPayment] = useState("all");
  const [detailSale, setDetailSale] = useState<Sale | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<Sale | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  const filtered = sales.filter((s) => {
    const matchSearch = String(s.sale_number).includes(search) || (s.pdv_terminals?.name ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || s.status === filterStatus;
    const matchPayment = filterPayment === "all" || s.payment_method === filterPayment;
    return matchSearch && matchStatus && matchPayment;
  });

  const confirmCancel = async () => {
    if (!cancelReason.trim() || !cancelTarget) return;
    await cancelSale.mutateAsync({ id: cancelTarget.id, reason: cancelReason });
    setCancelDialogOpen(false);
  };

  const exportCSV = () => {
    const header = "Nº,Data,Terminal,Pagamento,Total,Status\n";
    const rows = filtered.map((s) => `${s.sale_number},${new Date(s.sold_at).toLocaleString("pt-BR")},${s.pdv_terminals?.name ?? s.origin},${s.payment_method},${s.total},${statusLabel[s.status] ?? s.status}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "vendas.csv"; a.click();
    toast.success("CSV exportado");
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Histórico de Vendas</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{sales.length} vendas registradas</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV} className="gap-1.5">
          <Download className="h-4 w-4" /> Exportar CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por número ou terminal..." className="pl-9 h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[150px] h-9"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="completed">Concluída</SelectItem>
            <SelectItem value="cancelled">Cancelada</SelectItem>
            <SelectItem value="refunded">Devolvida</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterPayment} onValueChange={setFilterPayment}>
          <SelectTrigger className="w-[150px] h-9"><SelectValue placeholder="Pagamento" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="Pix">Pix</SelectItem>
            <SelectItem value="Crédito">Crédito</SelectItem>
            <SelectItem value="Débito">Débito</SelectItem>
            <SelectItem value="Dinheiro">Dinheiro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Nº</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Data / Hora</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Terminal</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider text-center">Itens</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Pagamento</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider text-right">Total</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Status</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider w-[90px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((s) => (
              <TableRow key={s.id} className="group">
                <TableCell className="font-mono text-xs font-medium">#{s.sale_number}</TableCell>
                <TableCell className="text-xs tabular-nums">{new Date(s.sold_at).toLocaleString("pt-BR")}</TableCell>
                <TableCell className="text-sm">{s.pdv_terminals?.name ?? s.origin}</TableCell>
                <TableCell className="text-center text-sm tabular-nums">{s.sale_items?.length ?? 0}</TableCell>
                <TableCell className="text-sm">{s.payment_method}</TableCell>
                <TableCell className="text-right font-semibold text-sm tabular-nums">{fmt(Number(s.total))}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${statusColor[s.status] ?? "bg-muted text-muted-foreground border-border"}`}>
                    {statusLabel[s.status] ?? s.status}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDetailSale(s)}><Eye className="h-3.5 w-3.5" /></Button>
                    {s.status === "completed" && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => { setCancelTarget(s); setCancelReason(""); setCancelDialogOpen(true); }}><XCircle className="h-3.5 w-3.5" /></Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">Nenhuma venda encontrada</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet open={!!detailSale} onOpenChange={() => setDetailSale(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Venda #{detailSale?.sale_number}</SheetTitle>
            <SheetDescription>{detailSale && new Date(detailSale.sold_at).toLocaleString("pt-BR")} — {detailSale?.pdv_terminals?.name ?? detailSale?.origin}</SheetDescription>
          </SheetHeader>
          {detailSale && (
            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-muted-foreground">Origem</p><p className="font-medium">{detailSale.origin}</p></div>
                <div><p className="text-muted-foreground">Pagamento</p><p className="font-medium">{detailSale.payment_method}</p></div>
                <div><p className="text-muted-foreground">Status</p><span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${statusColor[detailSale.status] ?? "bg-muted text-muted-foreground border-border"}`}>{statusLabel[detailSale.status] ?? detailSale.status}</span></div>
              </div>
              {detailSale.cancel_reason && (
                <div className="rounded-lg bg-destructive/10 p-3 text-sm">
                  <p className="font-medium text-destructive">Motivo do cancelamento:</p>
                  <p>{detailSale.cancel_reason}</p>
                </div>
              )}
              <div>
                <h4 className="text-sm font-medium mb-2">Itens</h4>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader><TableRow><TableHead>Produto</TableHead><TableHead className="text-right">Qtd</TableHead><TableHead className="text-right">Unit.</TableHead><TableHead className="text-right">Subtotal</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {detailSale.sale_items?.map((it) => (
                        <TableRow key={it.id}>
                          <TableCell className="text-sm">{it.product_name}</TableCell>
                          <TableCell className="text-right">{it.quantity}</TableCell>
                          <TableCell className="text-right">{fmt(Number(it.unit_price))}</TableCell>
                          <TableCell className="text-right font-medium">{fmt(Number(it.subtotal))}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
              <div className="flex justify-end text-lg font-bold">Total: {fmt(Number(detailSale.total))}</div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Venda #{cancelTarget?.sale_number}</DialogTitle>
            <DialogDescription>Esta ação irá estornar o estoque dos produtos vendidos.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Motivo do cancelamento *</Label>
            <Textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Informe o motivo..." />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>Voltar</Button>
            <Button variant="destructive" onClick={confirmCancel} disabled={cancelSale.isPending}>Confirmar Cancelamento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SalesHistory;
