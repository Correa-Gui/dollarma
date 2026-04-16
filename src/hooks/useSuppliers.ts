import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { logAudit } from "./useAuditLog";
import { formatCpfCnpj, formatCpfCnpjPartial, trimOptionalText, trimText } from "@/lib/format";

export type Supplier = Tables<"suppliers">;

export function useSuppliers() {
  return useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("suppliers").select("*").order("name");
      if (error) throw error;
      return ((data ?? []) as Supplier[]).map((supplier) => ({
        ...supplier,
        name: trimText(supplier.name),
        cnpj: supplier.cnpj ? formatCpfCnpjPartial(supplier.cnpj) : null,
        contact: trimOptionalText(supplier.contact),
        phone: trimOptionalText(supplier.phone),
        email: trimOptionalText(supplier.email),
        notes: trimOptionalText(supplier.notes),
      }));
    },
  });
}

export function useCreateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (s: TablesInsert<"suppliers">) => {
      const { data, error } = await supabase.from("suppliers").insert({
        ...s,
        name: trimText(s.name),
        cnpj: formatCpfCnpj(s.cnpj),
        contact: trimOptionalText(s.contact),
        phone: trimOptionalText(s.phone),
        email: trimOptionalText(s.email),
        notes: trimOptionalText(s.notes),
      }).select().single();
      if (error) throw error;
      return {
        ...data,
        name: trimText(data.name),
        cnpj: data.cnpj ? formatCpfCnpjPartial(data.cnpj) : null,
        contact: trimOptionalText(data.contact),
        phone: trimOptionalText(data.phone),
        email: trimOptionalText(data.email),
        notes: trimOptionalText(data.notes),
      };
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
      const { data, error } = await supabase.from("suppliers").update({
        ...updates,
        name: updates.name ? trimText(updates.name) : updates.name,
        cnpj: updates.cnpj === undefined ? undefined : formatCpfCnpj(updates.cnpj),
        contact: updates.contact === undefined ? undefined : trimOptionalText(updates.contact),
        phone: updates.phone === undefined ? undefined : trimOptionalText(updates.phone),
        email: updates.email === undefined ? undefined : trimOptionalText(updates.email),
        notes: updates.notes === undefined ? undefined : trimOptionalText(updates.notes),
      }).eq("id", id).select().single();
      if (error) throw error;
      return {
        ...data,
        name: trimText(data.name),
        cnpj: data.cnpj ? formatCpfCnpjPartial(data.cnpj) : null,
        contact: trimOptionalText(data.contact),
        phone: trimOptionalText(data.phone),
        email: trimOptionalText(data.email),
        notes: trimOptionalText(data.notes),
      };
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
