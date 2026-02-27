import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Insight {
  icon: "red" | "green" | "yellow" | "blue";
  text: string;
}

export function useDashboardInsights() {
  return useQuery({
    queryKey: ["dashboard-insights"],
    queryFn: async () => {
      const now = new Date();
      const insights: Insight[] = [];

      // ── 1. Critical stock with days-of-supply ──
      const { data: products } = await supabase
        .from("products")
        .select("id, name, stock_quantity, min_stock, is_active")
        .eq("is_active", true);

      const since30d = new Date(now);
      since30d.setDate(since30d.getDate() - 30);

      const { data: salesItems } = await supabase
        .from("sale_items")
        .select("product_id, product_name, quantity, subtotal, sales!inner(status, sold_at)")
        .eq("sales.status", "completed")
        .gte("sales.sold_at", since30d.toISOString());

      const soldQty: Record<string, number> = {};
      const soldRevenue: Record<string, number> = {};
      salesItems?.forEach((item: any) => {
        soldQty[item.product_id] = (soldQty[item.product_id] || 0) + item.quantity;
        soldRevenue[item.product_name] = (soldRevenue[item.product_name] || 0) + Number(item.subtotal);
      });

      // Critical stock insights
      products?.forEach((p) => {
        if (p.stock_quantity <= p.min_stock && p.stock_quantity > 0) {
          const dailyRate = (soldQty[p.id] || 0) / 30;
          if (dailyRate > 0) {
            const daysLeft = Math.round(p.stock_quantity / dailyRate);
            if (daysLeft <= 3) {
              insights.push({
                icon: "red",
                text: `${p.name} está com estoque para ~${daysLeft} ${daysLeft === 1 ? "dia" : "dias"} de venda no ritmo atual`,
              });
            }
          }
        }
      });

      // ── 2. Products growing vs last week ──
      const since7d = new Date(now);
      since7d.setDate(since7d.getDate() - 7);
      const since14d = new Date(now);
      since14d.setDate(since14d.getDate() - 14);

      const { data: recentItems } = await supabase
        .from("sale_items")
        .select("product_name, subtotal, sales!inner(status, sold_at)")
        .eq("sales.status", "completed")
        .gte("sales.sold_at", since14d.toISOString());

      const weekRevenue: Record<string, { current: number; previous: number }> = {};
      recentItems?.forEach((item: any) => {
        const soldAt = new Date(item.sales.sold_at);
        const name = item.product_name;
        if (!weekRevenue[name]) weekRevenue[name] = { current: 0, previous: 0 };
        if (soldAt >= since7d) {
          weekRevenue[name].current += Number(item.subtotal);
        } else {
          weekRevenue[name].previous += Number(item.subtotal);
        }
      });

      // Top grower
      let bestGrowth = { name: "", pct: 0 };
      Object.entries(weekRevenue).forEach(([name, v]) => {
        if (v.previous > 0) {
          const pct = ((v.current - v.previous) / v.previous) * 100;
          if (pct > bestGrowth.pct) bestGrowth = { name, pct: +pct.toFixed(0) };
        }
      });
      if (bestGrowth.pct > 10) {
        insights.push({
          icon: "green",
          text: `${bestGrowth.name} cresceu ${bestGrowth.pct}% vs semana passada`,
        });
      }

      // Stuck products
      products?.forEach((p) => {
        const sold = soldQty[p.id] || 0;
        if (p.stock_quantity > 0 && sold === 0) {
          insights.push({
            icon: "yellow",
            text: `${p.name} está parado há 30+ dias — sem vendas no período`,
          });
        }
      });

      // ── 3. Peak prediction from heatmap ──
      const { data: heatSales } = await supabase
        .from("sales")
        .select("sold_at")
        .eq("status", "completed")
        .gte("sold_at", since30d.toISOString());

      const dayTotals = Array(7).fill(0);
      heatSales?.forEach((s) => {
        const d = new Date(s.sold_at).getDay();
        dayTotals[d]++;
      });

      const dayNames = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
      const peakDay = dayTotals.indexOf(Math.max(...dayTotals));
      const today = now.getDay();
      const daysUntilPeak = (peakDay - today + 7) % 7;

      if (daysUntilPeak > 0 && daysUntilPeak <= 3) {
        insights.push({
          icon: "blue",
          text: `Próximo pico previsto: ${dayNames[peakDay]} (baseado no histórico de 30 dias)`,
        });
      } else if (daysUntilPeak === 0) {
        insights.push({
          icon: "blue",
          text: `Hoje é dia de pico! ${dayNames[peakDay]} costuma ser o dia mais movimentado`,
        });
      }

      // ── 4. Today's performance ──
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const { data: todaySales } = await supabase
        .from("sales")
        .select("total")
        .eq("status", "completed")
        .gte("sold_at", todayStart);

      const todayRevenue = todaySales?.reduce((s, r) => s + Number(r.total), 0) ?? 0;
      const todayCount = todaySales?.length ?? 0;

      if (todayCount > 0 && todayRevenue > 0) {
        const avgDaily = Object.values(soldRevenue).reduce((s, v) => s + v, 0) / 30;
        if (avgDaily > 0) {
          const pctOfAvg = +((todayRevenue / avgDaily) * 100).toFixed(0);
          if (pctOfAvg >= 120) {
            insights.push({
              icon: "green",
              text: `Hoje já está ${pctOfAvg - 100}% acima da média diária dos últimos 30 dias`,
            });
          } else if (pctOfAvg <= 50 && now.getHours() >= 14) {
            insights.push({
              icon: "yellow",
              text: `Faturamento de hoje está em apenas ${pctOfAvg}% da média diária — atenção`,
            });
          }
        }
      }

      // Limit to 5 most relevant
      return insights.slice(0, 5);
    },
    refetchInterval: 120000,
  });
}
