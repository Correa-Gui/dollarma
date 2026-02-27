import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";

export type SaleItem = Tables<"sale_items">;
export type Sale = Tables<"sales"> & {
  sale_items?: SaleItem[];
  pdv_terminals?: { name: string } | null;
};

export function useSales() {
  return useQuery({
    queryKey: ["sales"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales")
        .select("*, sale_items(*), pdv_terminals(name)")
        .order("sold_at", { ascending: false });
      if (error) throw error;
      return data as Sale[];
    },
  });
}

export function useCancelSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { error } = await supabase
        .from("sales")
        .update({ status: "cancelled", cancel_reason: reason })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales"] });
      toast.success("Venda cancelada");
    },
    onError: (e) => toast.error(`Erro: ${e.message}`),
  });
}
