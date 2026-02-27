import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { toast } from "sonner";

export type StockMovement = Tables<"stock_movements"> & {
  products?: { name: string } | null;
};

export function useStockMovements() {
  return useQuery({
    queryKey: ["stock_movements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stock_movements")
        .select("*, products(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as StockMovement[];
    },
  });
}

export function useCreateStockMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (movement: TablesInsert<"stock_movements">) => {
      // Get current product stock
      const { data: product } = await supabase
        .from("products")
        .select("stock_quantity")
        .eq("id", movement.product_id)
        .single();

      const prevQty = product?.stock_quantity ?? 0;
      const isOut = movement.type === "sale" || movement.type === "adjustment_out";
      const newQty = isOut ? prevQty - movement.quantity : prevQty + movement.quantity;

      const { data, error } = await supabase
        .from("stock_movements")
        .insert({
          ...movement,
          previous_qty: prevQty,
          new_qty: Math.max(0, newQty),
        })
        .select()
        .single();
      if (error) throw error;

      // Update product stock
      await supabase
        .from("products")
        .update({ stock_quantity: Math.max(0, newQty) })
        .eq("id", movement.product_id);

      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stock_movements"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Movimentação registrada");
    },
    onError: (e) => toast.error(`Erro: ${e.message}`),
  });
}
