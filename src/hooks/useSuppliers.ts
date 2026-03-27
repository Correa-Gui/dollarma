import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { logAudit } from "./useAuditLog";

export type Supplier = Tables<"suppliers">;

export function useSuppliers() {
  return useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("suppliers").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (s: TablesInsert<"suppliers">) => {
      const { data, error } = await supabase.from("suppliers").insert(s).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Fornecedor criado");
      logAudit("supplier", data.id, data.name, "create");
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}

export function useUpdateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<"suppliers"> & { id: string }) => {
      const { data, error } = await supabase.from("suppliers").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Fornecedor atualizado");
      logAudit("supplier", data.id, data.name, "update");
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}

export function useDeleteSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data: s } = await supabase.from("suppliers").select("name").eq("id", id).single();
      const { error } = await supabase.from("suppliers").delete().eq("id", id);
      if (error) throw error;
      return { id, name: s?.name ?? id };
    },
    onSuccess: ({ id, name }) => {
      qc.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Fornecedor removido");
      logAudit("supplier", id, name, "delete");
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}
