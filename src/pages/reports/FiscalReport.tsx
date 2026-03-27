import { useState } from "react";
import { useFiscalReport } from "@/hooks/useFiscalReport";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Printer } from "lucide-react";

const paymentLabels: Record<string, string> = {
  dinheiro: "Dinheiro",
  cartao_credito: "Cartão de Crédito",
  cartao_debito: "Cartão de Débito",
  pix: "PIX",
  boleto: "Boleto",
  cheque: "Cheque",
  crediario: "Crediário",
};

const saleTypeLabel = (origin: string) => {
  if (origin === "sat") return "SAT";
  if (origin === "online") return "NF-CUPOM";
  return "NF-PRODUTO";
};

const statusLabel = (status: string) => {
  if (status === "cancelled") return { text: "CANCELADA", cls: "text-red-600" };
  if (status === "refunded") return { text: "DEVOLVIDA", cls: "text-amber-600" };
  return { text: "AUTORIZADA", cls: "text-emerald-700" };
};

const fmtCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

const today = () => new Date().toISOString().split("T")[0];
const firstOfMonth = () => {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().split("T")[0];
};

const FiscalReport = () => {
  const [from, setFrom] = useState(firstOfMonth);
  const [to, setTo] = useState(today);

  const { data: sales = [], isLoading } = useFiscalReport(from, to);

  const grandTotal = sales.reduce((s, v) => s + Number(v.total), 0);

  return (
    <div className="space-y-4">
      {/* Filtros — ocultos na impressão */}
      <div className="print:hidden flex flex-wrap items-end gap-4">
        <div className="space-y-1">
          <Label>De</Label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
        </div>
        <div className="space-y-1">
          <Label>Até</Label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
        </div>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-1" /> Imprimir
        </Button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && (
        <div id="fiscal-report-content" className="print:text-black print:bg-white">
          {/* Cabeçalho da empresa */}
          <div className="border-b pb-4 mb-4 print:mb-6">
            <div className="font-bold text-lg uppercase tracking-wide">DOLLAR BRASIL — CLAUDEMIR BATISTA SANTOS - ME</div>
            <div className="text-sm text-muted-foreground print:text-black">
              RUA DR. RODRIGUES ALVES, 870 · CEP 15.820-000 · PIRANGI - SP
            </div>
          </div>

          {/* Título do relatório */}
          <div className="mb-6">
            <h1 className="text-xl font-bold uppercase">Relatório de Notas Fiscais</h1>
            <p className="text-sm text-muted-foreground print:text-black">
              Período: {new Date(from + "T00:00:00").toLocaleDateString("pt-BR")} a{" "}
              {new Date(to + "T00:00:00").toLocaleDateString("pt-BR")} · Emitido em{" "}
              {new Date().toLocaleString("pt-BR")}
            </p>
          </div>

          {/* Vendas */}
          {sales.length === 0 ? (
            <p className="text-muted-foreground py-12 text-center print:text-black">
              Nenhuma venda no período selecionado.
            </p>
          ) : (
            <div className="space-y-6">
              {sales.map((sale) => {
                const st = statusLabel(sale.status);
                return (
                  <div key={sale.id} className="border rounded-lg overflow-hidden print:border-gray-400 print:rounded-none print-page-break">
                    {/* Cabeçalho da venda */}
                    <div className="bg-muted/50 print:bg-gray-100 px-4 py-2 flex flex-wrap items-center gap-4 text-sm">
                      <span className="font-bold tabular-nums">#{sale.sale_number}</span>
                      <span>{fmtDate(sale.sold_at)}</span>
                      {sale.customers ? (
                        <span>
                          {sale.customers.name}
                          {sale.customers.cpf && ` · CPF: ${sale.customers.cpf}`}
                        </span>
                      ) : (
                        <span className="text-muted-foreground print:text-gray-500">CONSUMIDOR - A VISTA</span>
                      )}
                      <span className={`font-bold ${st.cls}`}>{st.text}</span>
                      <span className="ml-auto font-semibold">{saleTypeLabel(sale.origin)}</span>
                    </div>

                    {/* Itens */}
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-xs text-muted-foreground print:text-gray-500">
                          <th className="px-4 py-1.5 font-medium">Cód</th>
                          <th className="px-4 py-1.5 font-medium">Descrição do produto / serviço</th>
                          <th className="px-4 py-1.5 font-medium text-center">NCM</th>
                          <th className="px-4 py-1.5 font-medium text-center">CFOP</th>
                          <th className="px-4 py-1.5 font-medium text-right">Qtd</th>
                          <th className="px-4 py-1.5 font-medium text-right">R$ Unitário</th>
                          <th className="px-4 py-1.5 font-medium text-right">R$ Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sale.sale_items.map((item) => {
                          const ncm = item.ncm_code ?? item.products?.ncm ?? "—";
                          const sku = item.product_sku ?? item.products?.sku ?? "—";
                          const cfop = item.products?.cfop ?? "5102";
                          return (
                            <tr key={item.id} className="border-b last:border-0">
                              <td className="px-4 py-1.5 font-mono text-xs">{sku}</td>
                              <td className="px-4 py-1.5">{item.product_name}</td>
                              <td className="px-4 py-1.5 text-center font-mono text-xs">{ncm}</td>
                              <td className="px-4 py-1.5 text-center font-mono text-xs">{cfop}</td>
                              <td className="px-4 py-1.5 text-right tabular-nums">{item.quantity}</td>
                              <td className="px-4 py-1.5 text-right tabular-nums">{fmtCurrency(Number(item.unit_price))}</td>
                              <td className="px-4 py-1.5 text-right tabular-nums font-medium">{fmtCurrency(Number(item.subtotal))}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    {/* Rodapé da venda */}
                    <div className="bg-muted/30 print:bg-gray-50 px-4 py-2 flex justify-between items-center text-sm">
                      <span className="text-muted-foreground print:text-gray-600">
                        Pagamento: {paymentLabels[sale.payment_method] ?? sale.payment_method}
                      </span>
                      <span className="font-bold tabular-nums">{fmtCurrency(Number(sale.total))}</span>
                    </div>
                  </div>
                );
              })}

              {/* Rodapé geral */}
              <div className="border-t pt-4 flex justify-between items-center font-semibold">
                <span>{sales.length} venda(s) no período</span>
                <span className="text-lg">Total Geral: {fmtCurrency(grandTotal)}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FiscalReport;
