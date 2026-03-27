import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logAudit } from "./useAuditLog";

export type Customer = {
  id: string;
  name: string;
  cpf: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const anySupabase = supabase as any;

export function useCustomers() {
  return useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await anySupabase
        .from("customers")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Customer[];
    },
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (customer: Omit<Customer, "id" | "created_at">) => {
      const { data, error } = await anySupabase
        .from("customers")
        .insert(customer)
        .select()
        .single();
      if (error) throw error;
      return data as Customer;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Cliente criado");
      logAudit("customer", data.id, data.name, "create");
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}

export function useUpdateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Omit<Customer, "created_at">> & { id: string }) => {
      const { data, error } = await anySupabase
        .from("customers")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Customer;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Cliente atualizado");
      logAudit("customer", data.id, data.name, "update");
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}

export function useDeleteCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await anySupabase.from("customers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Cliente removido");
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}

export function useLinkCustomerToSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ saleId, customerId }: { saleId: string; customerId: string | null }) => {
      const { error } = await anySupabase
        .from("sales")
        .update({ customer_id: customerId })
        .eq("id", saleId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales"] });
      toast.success("Cliente vinculado");
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}

