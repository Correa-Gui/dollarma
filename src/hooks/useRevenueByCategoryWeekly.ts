import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CategoryWeekData {
  week: string; // e.g. "Sem 1", "Sem 2"...
  [category: string]: string | number; // dynamic category keys
}

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(225 50% 72%)",
  "hsl(173 40% 55%)",
  "hsl(35 80% 60%)",
];

export function useRevenueByCategoryWeekly() {
  return useQuery({
    queryKey: ["dashboard-revenue-by-category-weekly"],
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - 28); // 4 weeks
      since.setHours(0, 0, 0, 0);

      const { data } = await supabase
        .from("sale_items")
        .select("subtotal, quantity, product_id, sale_id, sales!inner(status, sold_at), products!inner(category_id, categories(name))")
        .gte("sales.sold_at", since.toISOString())
        .eq("sales.status", "completed");

      // Group by week + category
      const weekMap: Record<string, Record<string, number>> = {};
      const allCategories = new Set<string>();

      data?.forEach((item: any) => {
        const soldAt = new Date(item.sales.sold_at);
        const weekNum = Math.floor((soldAt.getTime() - since.getTime()) / (7 * 86400000));
        const weekLabel = `Sem ${weekNum + 1}`;
        const catName = item.products?.categories?.name ?? "Sem categoria";

        allCategories.add(catName);
        if (!weekMap[weekLabel]) weekMap[weekLabel] = {};
        weekMap[weekLabel][catName] = (weekMap[weekLabel][catName] || 0) + Number(item.subtotal);
      });

      const categories = Array.from(allCategories).sort();
      const weeks: CategoryWeekData[] = [];

      for (let i = 0; i < 4; i++) {
        const label = `Sem ${i + 1}`;
        const row: CategoryWeekData = { week: label };
        categories.forEach((cat) => {
          row[cat] = Math.round(weekMap[label]?.[cat] ?? 0);
        });
        weeks.push(row);
      }

      return {
        weeks,
        categories,
        colors: categories.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
      };
    },
  });
}
