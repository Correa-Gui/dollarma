import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ProximoVencimento = {
  id: string;
  due_at: string;
  amount: number;
  description: string | null;
  suppliers: { name: string } | null;
};

export type UltimaVenda = {
  id: string;
  sale_number: number;
  sold_at: string;
  total: number;
  payment_method: string;
  customers: { name: string } | null;
};

export type PosicaoFinanceiraData = {
  vendasMes: number;
  pendentes: number;
  vencidas: number;
  saldoEstimado: number;
  proximosVencimentos: ProximoVencimento[];
  ultimasVendas: UltimaVenda[];
};

export function usePosicaoFinanceira() {
  return useQuery({
    queryKey: ["posicao_financeira"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];

      const firstOfMonth = new Date();
      firstOfMonth.setDate(1);
      const mtdStart = firstOfMonth.toISOString().split("T")[0];

      const next30 = new Date();
      next30.setDate(next30.getDate() + 30);
      const next30Str = next30.toISOString().split("T")[0];

      const [salesMtdRes, pendingRes, overdueRes, nextDueRes, lastSalesRes] = await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any)
          .from("sales")
          .select("total")
          .gte("sold_at", mtdStart + "T00:00:00.000Z")
          .neq("status", "cancelled"),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any)
          .from("payables")
          .select("amount")
          .eq("status", "pending"),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any)
          .from("payables")
          .select("amount")
          .eq("status", "pending")
          .lt("due_at", today),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any)
          .from("payables")
          .select("id, due_at, amount, description, suppliers(name)")
          .eq("status", "pending")
          .gte("due_at", today)
          .lte("due_at", next30Str)
          .order("due_at", { ascending: true })
          .limit(20),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any)
          .from("sales")
          .select("id, sale_number, sold_at, total, payment_method, customers(name)")
          .neq("status", "cancelled")
          .order("sold_at", { ascending: false })
          .limit(10),
      ]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sum = (arr: any[], key = "amount") =>
        (arr ?? []).reduce((s: number, v: any) => s + Number(v[key]), 0);

      const vendasMes = sum(salesMtdRes.data, "total");
      const pendentes = sum(pendingRes.data);
      const vencidas = sum(overdueRes.data);

      return {
        vendasMes,
        pendentes,
        vencidas,
        saldoEstimado: vendasMes - pendentes,
        proximosVencimentos: (nextDueRes.data ?? []) as ProximoVencimento[],
        ultimasVendas: (lastSalesRes.data ?? []) as UltimaVenda[],
      } as PosicaoFinanceiraData;
    },
  });
}
