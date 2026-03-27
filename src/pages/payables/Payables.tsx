import { useState } from "react";
import { usePayables, useCreatePayable, useUpdatePayable, useDeletePayable, useMarkAsPaid, type Payable } from "@/hooks/usePayables";
import { useSuppliers } from "@/hooks/useSuppliers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, Loader2, CheckCircle2, Search, CircleDollarSign } from "lucide-react";
import { toast } from "sonner";

type PayableForm = {
  supplier_id: string;
  number: string;
  issued_at: string;
  due_at: string;
  amount: string;
  description: string;
  installment: boolean;
  installment_count: string;
  installment_current: string;
};

const today = () => new Date().toISOString().split("T")[0];

const emptyForm: PayableForm = {
  supplier_id: "",
  number: "",
  issued_at: today(),
  due_at: today(),
  amount: "",
  description: "",
  installment: false,
  installment_count: "1",
  installment_current: "1",
};

const fmtCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const fmtDate = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("pt-BR");

const statusConfig: Record<string, { label: string; cls: string }> = {
  pending: { label: "Pendente", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400" },
  paid:    { label: "Pago",     cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" },
  cancelled: { label: "Cancelado", cls: "bg-muted text-muted-foreground" },
};

const isOverdue = (p: Payable) =>
  p.status === "pending" && new Date(p.due_at) < new Date(today());

// ── Formulário de lançamento ──────────────────────────────────────────────────
function PayableForm({
  form,
  setForm,
  suppliers,
  editingId,
  onSave,
  onCancel,
  isPending,
}: {
  form: PayableForm;
  setForm: React.Dispatch<React.SetStateAction<PayableForm>>;
  suppliers: { id: string; name: string }[];
  editingId: string | null;
  onSave: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const set = (field: Partial<PayableForm>) => setForm((p) => ({ ...p, ...field }));

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Fornecedor */}
      <div className="space-y-2">
        <Label>Fornecedor</Label>
        <Select value={form.supplier_id || "none"} onValueChange={(v) => set({ supplier_id: v === "none" ? "" : v })}>
          <SelectTrigger><SelectValue placeholder="Selecione o fornecedor..." /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">— Nenhum —</SelectItem>
            {suppliers.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Número e datas */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Número do Boleto</Label>
          <Input
            value={form.number}
            onChange={(e) => set({ number: e.target.value })}
            placeholder="Ex: 12345"
            className="font-mono"
          />
        </div>
        <div className="space-y-2">
          <Label>Data de Emissão</Label>
          <Input type="date" value={form.issued_at} onChange={(e) => set({ issued_at: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Vencimento *</Label>
          <Input type="date" value={form.due_at} onChange={(e) => set({ due_at: e.target.value })} />
        </div>
      </div>

      {/* Valor */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Valor *</Label>
          <Input
            value={form.amount}
            onChange={(e) => set({ amount: e.target.value })}
            placeholder="0,00"
            inputMode="decimal"
          />
        </div>
      </div>

      {/* Parcelamento */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Checkbox
            id="installment"
            checked={form.installment}
            onCheckedChange={(v) => set({ installment: !!v })}
          />
          <Label htmlFor="installment" className="cursor-pointer">Parcelamento</Label>
        </div>
        {form.installment && (
          <div className="grid grid-cols-2 gap-4 pl-6">
            <div className="space-y-2">
              <Label>Parcela atual</Label>
              <Input
                type="number"
                min={1}
                value={form.installment_current}
                onChange={(e) => set({ installment_current: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Total de parcelas</Label>
              <Input
                type="number"
                min={1}
                value={form.installment_count}
                onChange={(e) => set({ installment_count: e.target.value })}
              />
            </div>
          </div>
        )}
      </div>

      {/* Descrição */}
      <div className="space-y-2">
        <Label>Descrição do lançamento</Label>
        <Input
          value={form.description}
          onChange={(e) => set({ description: e.target.value })}
          placeholder="Ex: Pagamento de mercadorias ref. NF 1234"
        />
      </div>

      {/* Ações */}
      <div className="flex gap-2 pt-2">
        <Button onClick={onSave} disabled={isPending || !form.due_at || !form.amount}>
          {isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
          {editingId ? "Salvar Alteração" : "Gravar"}
        </Button>
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
      </div>
    </div>
  );
}

// ── Dialog de marcar como pago ─────────────────────────────────────────────────
function PayDialog({
  payable,
  onConfirm,
  onClose,
  isPending,
}: {
  payable: Payable;
  onConfirm: (paidAt: string, paidAmount: number) => void;
  onClose: () => void;
  isPending: boolean;
}) {
  const [paidAt, setPaidAt] = useState(today());
  const [paidAmount, setPaidAmount] = useState(String(payable.amount).replace(".", ","));

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Confirmar Pagamento</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-2">
            <Label>Data do pagamento</Label>
            <Input type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Valor pago</Label>
            <Input
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              inputMode="decimal"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            onClick={() => onConfirm(paidAt, parseFloat(paidAmount.replace(",", ".")) || payable.amount)}
            disabled={isPending}
          >
            {isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
const Payables = () => {
  const { data: allPayables = [], isLoading } = usePayables();
  const { data: suppliers = [] } = useSuppliers();
  const createPayable = useCreatePayable();
  const updatePayable = useUpdatePayable();
  const deletePayable = useDeletePayable();
  const markAsPaid = useMarkAsPaid();

  const [tab, setTab] = useState("form");
  const [form, setForm] = useState<PayableForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [payingPayable, setPayingPayable] = useState<Payable | null>(null);

  const filtered = allPayables.filter((p) => {
    const matchStatus = filterStatus === "all" || p.status === filterStatus;
    const matchSearch =
      !search ||
      (p.suppliers?.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (p.number ?? "").includes(search) ||
      (p.description ?? "").toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const totalPending = allPayables
    .filter((p) => p.status === "pending")
    .reduce((s, p) => s + Number(p.amount), 0);

  const openEdit = (p: Payable) => {
    setForm({
      supplier_id: p.supplier_id ?? "",
      number: p.number ?? "",
      issued_at: p.issued_at,
      due_at: p.due_at,
      amount: String(p.amount).replace(".", ","),
      description: p.description ?? "",
      installment: p.installment,
      installment_count: String(p.installment_count),
      installment_current: String(p.installment_current),
    });
    setEditingId(p.id);
    setTab("form");
  };

  const handleSave = async () => {
    const amount = parseFloat(form.amount.replace(",", "."));
    if (!amount || !form.due_at) {
      toast.error("Preencha pelo menos o valor e a data de vencimento.");
      return;
    }
    const payload = {
      supplier_id: form.supplier_id || null,
      number: form.number || null,
      issued_at: form.issued_at,
      due_at: form.due_at,
      amount,
      description: form.description || null,
      status: "pending" as const,
      paid_at: null,
      paid_amount: null,
      installment: form.installment,
      installment_count: parseInt(form.installment_count) || 1,
      installment_current: parseInt(form.installment_current) || 1,
    };
    if (editingId) {
      await updatePayable.mutateAsync({ id: editingId, ...payload });
    } else {
      await createPayable.mutateAsync(payload);
    }
    setForm(emptyForm);
    setEditingId(null);
    setTab("manage");
  };

  const handleCancel = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contas a Pagar</h1>
          <p className="text-muted-foreground text-sm">
            {allPayables.filter((p) => p.status === "pending").length} pendente(s) ·{" "}
            <span className="text-destructive font-medium">{fmtCurrency(totalPending)} em aberto</span>
          </p>
        </div>
        <Button onClick={() => { setForm(emptyForm); setEditingId(null); setTab("form"); }}>
          <Plus className="h-4 w-4 mr-1" /> Novo Lançamento
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="form">Lançamento / Alteração</TabsTrigger>
          <TabsTrigger value="manage">Gerenciamento</TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Formulário ── */}
        <TabsContent value="form" className="pt-4">
          <PayableForm
            form={form}
            setForm={setForm}
            suppliers={suppliers}
            editingId={editingId}
            onSave={handleSave}
            onCancel={handleCancel}
            isPending={createPayable.isPending || updatePayable.isPending}
          />
        </TabsContent>

        {/* ── Tab 2: Gerenciamento ── */}
        <TabsContent value="manage" className="pt-4 space-y-3">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por fornecedor, número ou descrição..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="paid">Pagos</SelectItem>
                <SelectItem value="cancelled">Cancelados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Número</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Emissão</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Parcela</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p) => {
                    const overdue = isOverdue(p);
                    const st = statusConfig[p.status] ?? statusConfig.pending;
                    return (
                      <TableRow key={p.id} className={overdue ? "bg-red-50/50 dark:bg-red-950/20" : ""}>
                        <TableCell className="font-medium">
                          {p.suppliers?.name ?? <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{p.number ?? "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                          {p.description ?? "—"}
                        </TableCell>
                        <TableCell className="text-sm tabular-nums">{fmtDate(p.issued_at)}</TableCell>
                        <TableCell className={`text-sm tabular-nums font-medium ${overdue ? "text-destructive" : ""}`}>
                          {fmtDate(p.due_at)}
                          {overdue && <span className="ml-1 text-xs">(vencido)</span>}
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-semibold">
                          {fmtCurrency(Number(p.amount))}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {p.installment ? `${p.installment_current}/${p.installment_count}` : "—"}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${st.cls}`}>
                            {st.label}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {p.status === "pending" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Marcar como pago"
                                onClick={() => setPayingPayable(p)}
                              >
                                <CircleDollarSign className="h-3.5 w-3.5 text-emerald-600" />
                              </Button>
                            )}
                            {p.status === "paid" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                title={`Pago em ${p.paid_at ? fmtDate(p.paid_at) : "—"} · ${fmtCurrency(Number(p.paid_amount ?? p.amount))}`}
                                className="cursor-default"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                if (confirm("Remover este lançamento?")) deletePayable.mutate(p.id);
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                        Nenhum lançamento encontrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog de pagamento */}
      {payingPayable && (
        <PayDialog
          payable={payingPayable}
          isPending={markAsPaid.isPending}
          onClose={() => setPayingPayable(null)}
          onConfirm={(paidAt, paidAmount) => {
            markAsPaid.mutate(
              { id: payingPayable.id, paid_at: paidAt, paid_amount: paidAmount },
              { onSuccess: () => setPayingPayable(null) }
            );
          }}
        />
      )}
    </div>
  );
};

export default Payables;
