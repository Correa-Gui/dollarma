import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface KpiSparklineData {
  revenueToday: number[];
  revenueMonth: number[];
  salesToday: number[];
  avgTicket: number[];
}

export function useKpiSparklines() {
  return useQuery({
    queryKey: ["dashboard-kpi-sparklines"],
    queryFn: async () => {
      const now = new Date();
      const since = new Date(now);
      since.setDate(since.getDate() - 6);
      since.setHours(0, 0, 0, 0);

      const { data } = await supabase
        .from("sales")
        .select("sold_at, total")
        .eq("status", "completed")
        .gte("sold_at", since.toISOString())
        .order("sold_at");

      // Build daily buckets for last 7 days
      const buckets: { revenue: number; count: number }[] = Array.from(
        { length: 7 },
        () => ({ revenue: 0, count: 0 })
      );

      data?.forEach((s) => {
        const d = new Date(s.sold_at);
        const daysDiff = Math.floor(
          (d.getTime() - since.getTime()) / 86400000
        );
        if (daysDiff >= 0 && daysDiff < 7) {
          buckets[daysDiff].revenue += Number(s.total);
          buckets[daysDiff].count++;
        }
      });

      return {
        revenueToday: buckets.map((b) => Math.round(b.revenue)),
        revenueMonth: buckets.map((b) => Math.round(b.revenue)), // daily trend serves as proxy
        salesToday: buckets.map((b) => b.count),
        avgTicket: buckets.map((b) =>
          b.count > 0 ? Math.round(b.revenue / b.count) : 0
        ),
      } satisfies KpiSparklineData;
    },
    refetchInterval: 60000,
  });
}
