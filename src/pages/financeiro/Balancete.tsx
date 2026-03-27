import { useState } from "react";
import { useBalancete } from "@/hooks/useBalancete";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Loader2, Printer } from "lucide-react";

const today = () => new Date().toISOString().split("T")[0];
const firstOfMonth = () => {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().split("T")[0];
};

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const fmtDateRange = (start: string, end: string) => {
  const s = new Date(start + "T00:00:00").toLocaleDateString("pt-BR");
  const e = new Date(end + "T00:00:00").toLocaleDateString("pt-BR");
  return s === e ? s : `${s} a ${e}`;
};

const SaldoCell = ({ value }: { value: number }) => (
  <span className={value > 0 ? "text-emerald-600 font-medium" : value < 0 ? "text-destructive font-medium" : ""}>
    {fmt(value)}
  </span>
);

const Balancete = () => {
  const [from, setFrom] = useState(firstOfMonth);
  const [to, setTo] = useState(today);

  const { data, isLoading } = useBalancete(from, to);

  return (
    <div className="space-y-4">
      <div className="print:hidden flex flex-wrap items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Balancete</h1>
          <p className="text-muted-foreground text-sm">
            Receitas vs Despesas por período
          </p>
        </div>
        <div className="ml-auto flex items-end gap-3">
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
      </div>

      {isLoading && (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && data && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Receitas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-emerald-600">{fmt(data.totalReceitas)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Despesas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-destructive">{fmt(data.totalDespesas)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Saldo</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${data.saldo >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                  {fmt(data.saldo)}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Semana</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead className="text-right">Receitas</TableHead>
                  <TableHead className="text-right">Despesas</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.weeks.map((week) => (
                  <TableRow key={week.label}>
                    <TableCell className="font-medium">{week.label}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {fmtDateRange(week.startDate, week.endDate)}
                    </TableCell>
                    <TableCell className="text-right text-emerald-600">{fmt(week.receitas)}</TableCell>
                    <TableCell className="text-right text-destructive">{fmt(week.despesas)}</TableCell>
                    <TableCell className="text-right"><SaldoCell value={week.saldo} /></TableCell>
                  </TableRow>
                ))}
                {data.weeks.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhum dado no período selecionado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
};

export default Balancete;
