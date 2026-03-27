import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type FiscalSaleItem = {
  id: string;
  product_name: string;
  product_sku: string | null;
  ncm_code: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
  products: { ncm: string | null; sku: string } | null;
};

export type FiscalSale = {
  id: string;
  sale_number: number;
  sold_at: string;
  total: number;
  status: string;
  payment_method: string;
  origin: string;
  customers: { name: string; cpf: string | null } | null;
  sale_items: FiscalSaleItem[];
};

export function deriveCfop(origin: string): string {
  if (origin === "interstate") return "6102";
  return "5102";
}

export function useFiscalReport(from: string, to: string) {
  return useQuery({
    queryKey: ["fiscal_report", from, to],
    queryFn: async () => {
      // to precisa incluir o fim do dia
      const toEnd = to + "T23:59:59.999Z";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("sales")
        .select(`
          id, sale_number, sold_at, total, status, payment_method, origin,
          customers(name, cpf),
          sale_items(
            id, product_name, product_sku, ncm_code, quantity, unit_price, subtotal,
            products(ncm, sku)
          )
        `)
        .gte("sold_at", from + "T00:00:00.000Z")
        .lte("sold_at", toEnd)
        .neq("status", "cancelled")
        .order("sold_at", { ascending: true });

      if (error) throw error;
      return data as FiscalSale[];
    },
    enabled: !!from && !!to,
  });
}
