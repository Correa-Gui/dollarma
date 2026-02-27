import { useState } from "react";
import { mockSales, type MockSale } from "@/data/mock-sales-data";
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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, Eye, XCircle, Download } from "lucide-react";
import { toast } from "sonner";

const statusLabel: Record<MockSale["status"], string> = {
  completed: "Concluída",
  cancelled: "Cancelada",
  refunded: "Devolvida",
};

const statusVariant: Record<MockSale["status"], "default" | "secondary" | "destructive" | "outline"> = {
  completed: "default",
  cancelled: "destructive",
  refunded: "outline",
};

const SalesHistory = () => {
  const [sales, setSales] = useState<MockSale[]>(mockSales);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPayment, setFilterPayment] = useState("all");
  const [detailSale, setDetailSale] = useState<MockSale | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<MockSale | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  const filtered = sales.filter((s) => {
    const matchSearch =
      String(s.number).includes(search) ||
      s.terminal.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || s.status === filterStatus;
    const matchPayment = filterPayment === "all" || s.paymentMethod === filterPayment;
    return matchSearch && matchStatus && matchPayment;
  });

  const openCancel = (s: MockSale) => {
    setCancelTarget(s);
    setCancelReason("");
    setCancelDialogOpen(true);
  };

  const confirmCancel = () => {
    if (!cancelReason.trim()) {
      toast.error("Motivo é obrigatório");
      return;
    }
    setSales((prev) =>
      prev.map((s) =>
        s.id === cancelTarget?.id
          ? { ...s, status: "cancelled" as const, cancelReason }
          : s
      )
    );
    setCancelDialogOpen(false);
    toast.success("Venda cancelada com sucesso");
  };

  const exportCSV = () => {
    const header = "Nº,Data,Terminal,Pagamento,Total,Status\n";
    const rows = filtered
      .map((s) => `${s.number},${s.soldAt},${s.terminal},${s.paymentMethod},${s.total},${statusLabel[s.status]}`)
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vendas.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Histórico de Vendas</h1>
          <p className="text-muted-foreground text-sm">{sales.length} vendas registradas</p>
        </div>
        <Button variant="outline" onClick={exportCSV}>
          <Download className="h-4 w-4 mr-1" /> Exportar CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por número ou terminal..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="completed">Concluída</SelectItem>
            <SelectItem value="cancelled">Cancelada</SelectItem>
            <SelectItem value="refunded">Devolvida</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterPayment} onValueChange={setFilterPayment}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Pagamento" />
          </SelectTrigger>
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
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nº</TableHead>
              <TableHead>Data / Hora</TableHead>
              <TableHead>Terminal</TableHead>
              <TableHead className="text-center">Itens</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-mono text-xs">#{s.number}</TableCell>
                <TableCell className="text-xs">{s.soldAt}</TableCell>
                <TableCell>{s.terminal}</TableCell>
                <TableCell className="text-center">{s.items.length}</TableCell>
                <TableCell>{s.paymentMethod}</TableCell>
                <TableCell className="text-right font-medium">
                  {s.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariant[s.status]}>{statusLabel[s.status]}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setDetailSale(s)}>
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    {s.status === "completed" && (
                      <Button variant="ghost" size="icon" onClick={() => openCancel(s)}>
                        <XCircle className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Nenhuma venda encontrada
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail Sheet */}
      <Sheet open={!!detailSale} onOpenChange={() => setDetailSale(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Venda #{detailSale?.number}</SheetTitle>
            <SheetDescription>{detailSale?.soldAt} — {detailSale?.terminal}</SheetDescription>
          </SheetHeader>
          {detailSale && (
            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Origem</p>
                  <p className="font-medium">{detailSale.origin === "pdv" ? "PDV" : "Web"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Pagamento</p>
                  <p className="font-medium">{detailSale.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge variant={statusVariant[detailSale.status]}>
                    {statusLabel[detailSale.status]}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Operador</p>
                  <p className="font-medium">{detailSale.createdBy}</p>
                </div>
              </div>

              {detailSale.cancelReason && (
                <div className="rounded-lg bg-destructive/10 p-3 text-sm">
                  <p className="font-medium text-destructive">Motivo do cancelamento:</p>
                  <p>{detailSale.cancelReason}</p>
                </div>
              )}

              <div>
                <h4 className="text-sm font-medium mb-2">Itens</h4>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead className="text-right">Qtd</TableHead>
                        <TableHead className="text-right">Unit.</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detailSale.items.map((it) => (
                        <TableRow key={it.id}>
                          <TableCell className="text-sm">{it.productName}</TableCell>
                          <TableCell className="text-right">{it.quantity}</TableCell>
                          <TableCell className="text-right">
                            {it.unitPrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {it.subtotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="flex justify-end text-lg font-bold">
                Total: {detailSale.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Venda #{cancelTarget?.number}</DialogTitle>
            <DialogDescription>
              Esta ação irá estornar o estoque dos produtos vendidos.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Motivo do cancelamento *</Label>
            <Textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Informe o motivo..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>Voltar</Button>
            <Button variant="destructive" onClick={confirmCancel}>Confirmar Cancelamento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SalesHistory;
