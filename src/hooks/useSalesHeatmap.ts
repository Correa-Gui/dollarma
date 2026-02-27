import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface HeatmapCell {
  day: number; // 0=Dom, 1=Seg, ..., 6=Sáb
  hour: number; // 0-23
  count: number;
}

const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function useSalesHeatmap() {
  return useQuery({
    queryKey: ["dashboard-sales-heatmap"],
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - 30);

      const { data } = await supabase
        .from("sales")
        .select("sold_at")
        .eq("status", "completed")
        .gte("sold_at", since.toISOString());

      // Initialize 7×24 grid
      const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
      let maxCount = 0;

      data?.forEach((s) => {
        const d = new Date(s.sold_at);
        const day = d.getDay(); // 0=Sun
        const hour = d.getHours();
        grid[day][hour]++;
        if (grid[day][hour] > maxCount) maxCount = grid[day][hour];
      });

      const cells: HeatmapCell[] = [];
      for (let day = 0; day < 7; day++) {
        for (let hour = 0; hour < 24; hour++) {
          cells.push({ day, hour, count: grid[day][hour] });
        }
      }

      return { cells, maxCount, dayLabels: DAY_LABELS };
    },
  });
}
