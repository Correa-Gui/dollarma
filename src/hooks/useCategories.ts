import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "sonner";

export type Category = Tables<"categories"> & {
  parent?: { name: string } | null;
  product_count?: number;
};

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data: cats, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");
      if (error) throw error;

      // Get product counts per category
      const { data: products } = await supabase
        .from("products")
        .select("category_id");

      const countMap: Record<string, number> = {};
      products?.forEach((p) => {
        if (p.category_id) countMap[p.category_id] = (countMap[p.category_id] || 0) + 1;
      });

      // Map parent names
      const catMap = new Map(cats.map((c) => [c.id, c]));
      return cats.map((c) => ({
        ...c,
        parent: c.parent_id ? { name: catMap.get(c.parent_id)?.name ?? "" } : null,
        product_count: countMap[c.id] ?? 0,
      })) as Category[];
    },
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (cat: TablesInsert<"categories">) => {
      const { data, error } = await supabase.from("categories").insert(cat).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Categoria criada");
    },
    onError: (e) => toast.error(`Erro: ${e.message}`),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<"categories"> & { id: string }) => {
      const { data, error } = await supabase.from("categories").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Categoria atualizada");
    },
    onError: (e) => toast.error(`Erro: ${e.message}`),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Categoria removida");
    },
    onError: (e) => toast.error(`Erro: ${e.message}`),
  });
}
