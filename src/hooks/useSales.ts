import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { logAudit } from "./useAuditLog";

export type SaleItem = Tables<"sale_items">;
export type Sale = Tables<"sales"> & {
  sale_items?: SaleItem[];
  pdv_terminals?: { name: string } | null;
  customers?: { name: string } | null;
};

export function useSales() {
  return useQuery({
    queryKey: ["sales"],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("sales")
        .select("*, discount_percent, discount_amount, receipt_requested, receipt_tax_id, sale_items(*), pdv_terminals(name), customers(name)")
        .order("sold_at", { ascending: false });
      if (error) throw error;
      return data as Sale[];
    },
  });
}

export function useCancelSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason, saleNumber }: { id: string; reason: string; saleNumber?: number }) => {
      const { error } = await supabase
        .from("sales")
        .update({ status: "cancelled", cancel_reason: reason })
        .eq("id", id);
      if (error) throw error;
      return { id, reason, saleNumber };
    },
    onSuccess: ({ id, reason, saleNumber }) => {
      qc.invalidateQueries({ queryKey: ["sales"] });
      toast.success("Venda cancelada");
      logAudit("sale", id, `Venda #${saleNumber ?? id}`, "cancel", { reason });
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}
