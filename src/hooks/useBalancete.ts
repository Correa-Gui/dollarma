import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type WeekRow = {
  label: string;
  startDate: string;
  endDate: string;
  receitas: number;
  despesas: number;
  saldo: number;
};

export type BalanceteData = {
  totalReceitas: number;
  totalDespesas: number;
  saldo: number;
  weeks: WeekRow[];
};

export function useBalancete(from: string, to: string) {
  return useQuery({
    queryKey: ["balancete", from, to],
    enabled: !!from && !!to,
    queryFn: async () => {
      const [salesRes, payablesRes] = await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any)
          .from("sales")
          .select("sold_at, total, status")
          .gte("sold_at", from + "T00:00:00.000Z")
          .lte("sold_at", to + "T23:59:59.999Z")
          .neq("status", "cancelled"),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any)
          .from("payables")
          .select("paid_at, paid_amount, amount, status")
          .eq("status", "paid")
          .gte("paid_at", from)
          .lte("paid_at", to),
      ]);

      if (salesRes.error) throw salesRes.error;
      if (payablesRes.error) throw payablesRes.error;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sales: any[] = salesRes.data ?? [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payables: any[] = payablesRes.data ?? [];

      // Agrupa em semanas
      const start = new Date(from + "T00:00:00");
      const end = new Date(to + "T00:00:00");

      const weeks: WeekRow[] = [];
      const cursor = new Date(start);
      let weekNum = 1;

      while (cursor <= end) {
        const weekStart = new Date(cursor);
        const weekEnd = new Date(cursor);
        weekEnd.setDate(weekEnd.getDate() + 6);
        if (weekEnd > end) weekEnd.setTime(end.getTime());

        const ws = weekStart.toISOString().split("T")[0];
        const we = weekEnd.toISOString().split("T")[0];

        const receitas = sales
          .filter((s) => s.sold_at >= ws + "T00:00:00.000Z" && s.sold_at <= we + "T23:59:59.999Z")
          .reduce((sum, s) => sum + Number(s.total), 0);

        const despesas = payables
          .filter((p) => p.paid_at >= ws && p.paid_at <= we)
          .reduce((sum, p) => sum + Number(p.paid_amount ?? p.amount), 0);

        weeks.push({
          label: `Semana ${weekNum}`,
          startDate: ws,
          endDate: we,
          receitas,
          despesas,
          saldo: receitas - despesas,
        });

        cursor.setDate(cursor.getDate() + 7);
        weekNum++;
      }

      const totalReceitas = weeks.reduce((s, w) => s + w.receitas, 0);
      const totalDespesas = weeks.reduce((s, w) => s + w.despesas, 0);

      return {
        totalReceitas,
        totalDespesas,
        saldo: totalReceitas - totalDespesas,
        weeks,
      } as BalanceteData;
    },
  });
}
