import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getPaymentLabel, getPaymentBucketKey } from "@/lib/payment";

export function useDashboardKpis() {
  return useQuery({
    queryKey: ["dashboard-kpis"],
    queryFn: async () => {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

      // Today's sales
      const { data: todaySales } = await supabase
        .from("sales")
        .select("total")
        .eq("status", "completed")
        .gte("sold_at", todayStart);

      // Yesterday's sales
      const { data: yesterdaySales } = await supabase
        .from("sales")
        .select("total")
        .eq("status", "completed")
        .gte("sold_at", yesterdayStart)
        .lt("sold_at", todayStart);

      // Month sales
      const { data: monthSales } = await supabase
        .from("sales")
        .select("total")
        .eq("status", "completed")
        .gte("sold_at", monthStart);

      // Prev month sales
      const { data: prevMonthSales } = await supabase
        .from("sales")
        .select("total")
        .eq("status", "completed")
        .gte("sold_at", prevMonthStart)
        .lt("sold_at", monthStart);

      const todayRevenue = todaySales?.reduce((s, r) => s + Number(r.total), 0) ?? 0;
      const yesterdayRevenue = yesterdaySales?.reduce((s, r) => s + Number(r.total), 0) ?? 0;
      const monthRevenue = monthSales?.reduce((s, r) => s + Number(r.total), 0) ?? 0;
      const prevMonthRevenue = prevMonthSales?.reduce((s, r) => s + Number(r.total), 0) ?? 0;
      const todayCount = todaySales?.length ?? 0;
      const yesterdayCount = yesterdaySales?.length ?? 0;
      const avgTicket = todayCount > 0 ? todayRevenue / todayCount : 0;
      const yesterdayAvg = yesterdayCount > 0 ? yesterdayRevenue / yesterdayCount : 0;

      const pct = (cur: number, prev: number) =>
        prev > 0 ? +((((cur - prev) / prev) * 100).toFixed(1)) : 0;

      return {
        revenueToday: { value: todayRevenue, change: pct(todayRevenue, yesterdayRevenue) },
        revenueMonth: { value: monthRevenue, change: pct(monthRevenue, prevMonthRevenue) },
        salesToday: { value: todayCount, change: pct(todayCount, yesterdayCount) },
        avgTicket: { value: avgTicket, change: pct(avgTicket, yesterdayAvg) },
      };
    },
    refetchInterval: 60000,
  });
}

export function useRevenueLast30Days() {
  return useQuery({
    queryKey: ["dashboard-revenue-30d"],
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - 59);

      const { data } = await supabase
        .from("sales")
        .select("sold_at, total")
        .eq("status", "completed")
        .gte("sold_at", since.toISOString())
        .order("sold_at");

      const now = new Date();
      const buckets: Record<string, { current: number; previous: number }> = {};

      for (let i = 0; i < 30; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() - 29 + i);
        const key = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
        buckets[key] = { current: 0, previous: 0 };
      }

      data?.forEach((s) => {
        const d = new Date(s.sold_at);
        const daysAgo = Math.floor((now.getTime() - d.getTime()) / 86400000);
        const key = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
        if (daysAgo < 30 && buckets[key]) {
          buckets[key].current += Number(s.total);
        } else if (daysAgo >= 30 && daysAgo < 60) {
          const mappedDate = new Date(d);
          mappedDate.setDate(mappedDate.getDate() + 30);
          const mKey = mappedDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
          if (buckets[mKey]) buckets[mKey].previous += Number(s.total);
        }
      });

      return Object.entries(buckets).map(([date, vals]) => ({
        date,
        current: Math.round(vals.current),
        previous: Math.round(vals.previous),
      }));
    },
  });
}

export function usePaymentMethodBreakdown() {
  return useQuery({
    queryKey: ["dashboard-payment-methods"],
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - 30);

      const { data } = await supabase
        .from("sales")
        .select("payment_method, total")
        .eq("status", "completed")
        .gte("sold_at", since.toISOString());

      const totals: Record<string, number> = {};
      let grand = 0;
      data?.forEach((s) => {
        const t = Number(s.total);
        const key = getPaymentBucketKey(s.payment_method);
        totals[key] = (totals[key] || 0) + t;
        grand += t;
      });

      const colors = [
        "hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))",
        "hsl(var(--chart-4))", "hsl(var(--chart-5))",
      ];

      return Object.entries(totals)
        .sort((a, b) => b[1] - a[1])
        .map(([name, value], i) => ({
          name: getPaymentLabel(name),
          value: grand > 0 ? Math.round((value / grand) * 100) : 0,
          color: colors[i % colors.length],
        }));
    },
  });
}

export function usePaymentMethodRevenue() {
  return useQuery({
    queryKey: ["dashboard-payment-revenue"],
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - 30);

      const { data } = await supabase
        .from("sales")
        .select("payment_method, total")
        .eq("status", "completed")
        .gte("sold_at", since.toISOString());

      const totals: Record<string, { value: number; count: number }> = {};
      data?.forEach((s) => {
        const key = getPaymentBucketKey(s.payment_method);
        if (!totals[key]) totals[key] = { value: 0, count: 0 };
        totals[key].value += Number(s.total);
        totals[key].count++;
      });

      const colors = [
        "hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))",
        "hsl(var(--chart-4))", "hsl(var(--chart-5))",
      ];

      return Object.entries(totals)
        .sort((a, b) => b[1].value - a[1].value)
        .map(([key, v], i) => ({
          name: getPaymentLabel(key),
          value: Math.round(v.value * 100) / 100,
          count: v.count,
          color: colors[i % colors.length],
        }));
    },
    refetchInterval: 60000,
  });
}

export function useTopProductsDashboard() {
  return useQuery({
    queryKey: ["dashboard-top-products"],
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - 30);

      const { data } = await supabase
        .from("sale_items")
        .select("product_name, quantity, sale_id, sales!inner(status, sold_at)")
        .gte("sales.sold_at", since.toISOString())
        .eq("sales.status", "completed");

      const totals: Record<string, number> = {};
      data?.forEach((item) => {
        totals[item.product_name] = (totals[item.product_name] || 0) + item.quantity;
      });

      return Object.entries(totals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, quantity]) => ({ name, quantity }));
    },
  });
}

export function useSalesByHour() {
  return useQuery({
    queryKey: ["dashboard-sales-by-hour"],
    queryFn: async () => {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { data } = await supabase
        .from("sales")
        .select("sold_at")
        .eq("status", "completed")
        .gte("sold_at", todayStart.toISOString());

      const hours = Array.from({ length: 24 }, (_, i) => ({
        hour: `${String(i).padStart(2, "0")}h`,
        sales: 0,
      }));

      data?.forEach((s) => {
        const h = new Date(s.sold_at).getHours();
        hours[h].sales++;
      });

      return hours;
    },
  });
}

export function useCriticalStockDashboard() {
  return useQuery({
    queryKey: ["dashboard-critical-stock"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, stock_quantity, min_stock, suppliers(name)")
        .filter("is_active", "eq", true)
        .order("stock_quantity");
      if (error) throw error;

      return (data ?? [])
        .filter((p) => p.stock_quantity <= p.min_stock)
        .map((p) => ({
          id: p.id,
          name: p.name,
          current: p.stock_quantity,
          minimum: p.min_stock,
          supplier: (p.suppliers as { name: string } | null)?.name ?? "—",
        }));
    },
  });
}

export function usePdvTerminals() {
  return useQuery({
    queryKey: ["pdv-terminals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pdv_terminals")
        .select("*")
        .order("name");
      if (error) throw error;

      return (data ?? []).map((t) => {
        const lastSync = t.last_sync
          ? formatTimeAgo(new Date(t.last_sync))
          : "Nunca";
        return {
          id: t.id,
          name: t.name,
          status: t.status as "online" | "offline",
          lastSync,
          pendingSales: 0,
        };
      });
    },
    refetchInterval: 30000,
  });
}

function formatTimeAgo(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return `Há ${diff}s`;
  if (diff < 3600) return `Há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Há ${Math.floor(diff / 3600)} horas`;
  return `Há ${Math.floor(diff / 86400)} dias`;
}
