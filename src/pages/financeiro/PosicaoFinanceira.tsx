import { usePosicaoFinanceira } from "@/hooks/usePosicaoFinanceira";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const fmtDate = (iso: string) =>
  new Date(iso + (iso.length === 10 ? "T00:00:00" : "")).toLocaleDateString("pt-BR");

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

const paymentLabels: Record<string, string> = {
  dinheiro: "Dinheiro",
  cartao_credito: "Cartão Crédito",
  cartao_debito: "Cartão Débito",
  pix: "PIX",
  boleto: "Boleto",
  cheque: "Cheque",
  crediario: "Crediário",
};

const PosicaoFinanceira = () => {
  const { data, isLoading } = usePosicaoFinanceira();

  const dateLabel = new Date().toLocaleDateString("pt-BR", { dateStyle: "full" });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Posição Financeira</h1>
        <p className="text-muted-foreground text-sm capitalize">{dateLabel}</p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Vendas do Mês</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{fmt(data.vendasMes)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">A Pagar (pendente)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-amber-600">{fmt(data.pendentes)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Contas Vencidas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-destructive">{fmt(data.vencidas)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Saldo Estimado</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${data.saldoEstimado >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                  {fmt(data.saldoEstimado)}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Próximos Vencimentos (30 dias)</h2>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.proximosVencimentos.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-sm">{fmtDate(item.due_at)}</TableCell>
                      <TableCell className="text-sm">{item.suppliers?.name ?? "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{item.description ?? "—"}</TableCell>
                      <TableCell className="text-right font-medium">{fmt(Number(item.amount))}</TableCell>
                    </TableRow>
                  ))}
                  {data.proximosVencimentos.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                        Nenhum vencimento nos próximos 30 dias.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Últimas Vendas</h2>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.ultimasVendas.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-mono text-xs">{sale.sale_number}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{fmtDateTime(sale.sold_at)}</TableCell>
                      <TableCell className="text-sm">{sale.customers?.name ?? "—"}</TableCell>
                      <TableCell className="text-sm">{paymentLabels[sale.payment_method] ?? sale.payment_method}</TableCell>
                      <TableCell className="text-right font-medium">{fmt(Number(sale.total))}</TableCell>
                    </TableRow>
                  ))}
                  {data.ultimasVendas.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                        Nenhuma venda registrada.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PosicaoFinanceira;
