import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CashSession {
  id: string;
  terminal_id: string;
  opened_at: string;
  closed_at: string | null;
  opening_balance: number;
  closing_balance: number | null;
  expected_balance: number | null;
  difference: number | null;
  status: string;
  opened_by: string;
  closed_by: string | null;
  notes: string | null;
  created_at: string;
  sales: {
    id: string;
    sale_number: number;
    total: number;
    payment_method: string;
    status: string;
    sold_at: string;
    customer_name: string | null;
    customers: { name: string | null } | null;
    sale_items: { id: string; product_name: string; quantity: number; unit_price: number; subtotal: number }[];
    discount_amount: number | null;
    discount_percent: number | null;
  }[];
  cash_register_movements: { id: string; type: string; amount: number; payment_method: string | null; description: string | null; created_at: string }[];
}

export function useCashRegisterSessions(terminalId?: string, dateFrom?: string, dateTo?: string) {
  return useQuery({
    queryKey: ["cash_register_sessions", terminalId, dateFrom, dateTo],
    queryFn: async () => {
      let q = supabase
        .from("cash_register_sessions")
        .select("*, sales(id, sale_number, total, payment_method, status, sold_at, customer_name, discount_amount, discount_percent, customers(name), sale_items(id, product_name, quantity, unit_price, subtotal)), cash_register_movements(id, type, amount, payment_method, description, created_at)")
        .order("opened_at", { ascending: false });

      if (terminalId) q = q.eq("terminal_id", terminalId);
      if (dateFrom) q = q.gte("opened_at", `${dateFrom}T00:00:00`);
      if (dateTo) q = q.lte("opened_at", `${dateTo}T23:59:59`);

      const { data, error } = await q;
      if (error) throw error;
      return data as unknown as CashSession[];
    },
  });
}
