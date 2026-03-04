import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useCashRegisterSessions(terminalId?: string, dateFrom?: string, dateTo?: string) {
  return useQuery({
    queryKey: ["cash_register_sessions", terminalId, dateFrom, dateTo],
    queryFn: async () => {
      let q = supabase
        .from("cash_register_sessions")
        .select("*")
        .order("opened_at", { ascending: false });

      if (terminalId) q = q.eq("terminal_id", terminalId);
      if (dateFrom) q = q.gte("opened_at", `${dateFrom}T00:00:00`);
      if (dateTo) q = q.lte("opened_at", `${dateTo}T23:59:59`);

      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

export function useCashRegisterMovements(sessionId?: string) {
  return useQuery({
    queryKey: ["cash_register_movements", sessionId],
    enabled: !!sessionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cash_register_movements")
        .select("*")
        .eq("session_id", sessionId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useCashRegisterSales(sessionId?: string) {
  return useQuery({
    queryKey: ["cash_register_sales", sessionId],
    enabled: !!sessionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales")
        .select("id, sale_number, total, payment_method, status, sold_at")
        .eq("session_id", sessionId!)
        .order("sold_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}
