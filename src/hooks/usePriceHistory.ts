import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { AuditLog } from "./useAuditLog";

export type PriceChangeLog = AuditLog & {
  _salePriceFrom: number | null;
  _salePriceTo: number | null;
  _costPriceFrom: number | null;
  _costPriceTo: number | null;
};

export function usePriceHistory(filters: {
  search?: string;
  from?: string;
  to?: string;
}) {
  return useQuery({
    queryKey: ["price_history", filters],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (supabase as any)
        .from("audit_logs")
        .select("*")
        .eq("entity_type", "product")
        .eq("action", "update")
        .order("created_at", { ascending: false })
        .limit(1000);

      if (filters.from) {
        query = query.gte("created_at", filters.from + "T00:00:00.000Z");
      }
      if (filters.to) {
        query = query.lte("created_at", filters.to + "T23:59:59.999Z");
      }

      const { data, error } = await query;
      if (error) throw error;

      const raw = data as AuditLog[];

      const extractFromTo = (changes: Record<string, unknown> | null, key: string) => {
        const val = changes?.[key];
        if (val && typeof val === "object" && "from" in (val as object)) {
          const typed = val as { from: unknown; to: unknown };
          return { from: typed.from != null ? Number(typed.from) : null, to: typed.to != null ? Number(typed.to) : null };
        }
        if (typeof val === "number" || typeof val === "string") {
          return { from: null, to: Number(val) };
        }
        return null;
      };

      return raw
        .filter((log) => {
          if (!log.changes) return false;
          return "sale_price" in log.changes || "cost_price" in log.changes;
        })
        .filter((log) => {
          if (!filters.search) return true;
          return (log.entity_name ?? "").toLowerCase().includes(filters.search.toLowerCase());
        })
        .map((log): PriceChangeLog => {
          const sp = extractFromTo(log.changes, "sale_price");
          const cp = extractFromTo(log.changes, "cost_price");
          return {
            ...log,
            _salePriceFrom: sp?.from ?? null,
            _salePriceTo: sp?.to ?? null,
            _costPriceFrom: cp?.from ?? null,
            _costPriceTo: cp?.to ?? null,
          };
        });
    },
  });
}
