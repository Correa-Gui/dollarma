import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { logAudit } from "./useAuditLog";
import { trimText } from "@/lib/format";

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

      const { data: products } = await supabase
        .from("products")
        .select("category_id");

      const countMap: Record<string, number> = {};
      products?.forEach((p) => {
        if (p.category_id) countMap[p.category_id] = (countMap[p.category_id] || 0) + 1;
      });

      const catsList = cats ?? [];
      const catMap = new Map(catsList.map((c) => [c.id, c]));
      return catsList.map((c) => ({
        ...c,
        name: trimText(c.name),
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
      const { data, error } = await supabase.from("categories").insert({
        ...cat,
        name: trimText(cat.name),
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Categoria criada");
      logAudit("category", data.id, data.name, "create");
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<"categories"> & { id: string }) => {
      const { data, error } = await supabase.from("categories").update({
        ...updates,
        name: updates.name ? trimText(updates.name) : updates.name,
      }).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Categoria atualizada");
      logAudit("category", data.id, data.name, "update");
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data: c } = await supabase.from("categories").select("name").eq("id", id).single();
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
      return { id, name: c?.name ?? id };
    },
    onSuccess: ({ id, name }) => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Categoria removida");
      logAudit("category", id, name, "delete");
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}
