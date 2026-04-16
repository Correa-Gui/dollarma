import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logAudit } from "./useAuditLog";
import { formatCpfCnpj, formatCpfCnpjPartial, trimOptionalText, trimText } from "@/lib/format";

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
      return ((data ?? []) as Customer[]).map((customer) => ({
        ...customer,
        name: trimText(customer.name),
        cpf: customer.cpf ? formatCpfCnpjPartial(customer.cpf) : null,
        phone: trimOptionalText(customer.phone),
        email: trimOptionalText(customer.email),
        address: trimOptionalText(customer.address),
        notes: trimOptionalText(customer.notes),
      }));
    },
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (customer: Omit<Customer, "id" | "created_at">) => {
      const payload = {
        ...customer,
        name: trimText(customer.name),
        cpf: formatCpfCnpj(customer.cpf),
        phone: trimOptionalText(customer.phone),
        email: trimOptionalText(customer.email),
        address: trimOptionalText(customer.address),
        notes: trimOptionalText(customer.notes),
      };
      const { data, error } = await anySupabase
        .from("customers")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return {
        ...(data as Customer),
        name: trimText(data.name),
        cpf: data.cpf ? formatCpfCnpjPartial(data.cpf) : null,
        phone: trimOptionalText(data.phone),
        email: trimOptionalText(data.email),
        address: trimOptionalText(data.address),
        notes: trimOptionalText(data.notes),
      };
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
      const payload = {
        ...updates,
        name: updates.name ? trimText(updates.name) : updates.name,
        cpf: updates.cpf === undefined ? undefined : formatCpfCnpj(updates.cpf),
        phone: updates.phone === undefined ? undefined : trimOptionalText(updates.phone),
        email: updates.email === undefined ? undefined : trimOptionalText(updates.email),
        address: updates.address === undefined ? undefined : trimOptionalText(updates.address),
        notes: updates.notes === undefined ? undefined : trimOptionalText(updates.notes),
      };
      const { data, error } = await anySupabase
        .from("customers")
        .update(payload)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return {
        ...(data as Customer),
        name: trimText(data.name),
        cpf: data.cpf ? formatCpfCnpjPartial(data.cpf) : null,
        phone: trimOptionalText(data.phone),
        email: trimOptionalText(data.email),
        address: trimOptionalText(data.address),
        notes: trimOptionalText(data.notes),
      };
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

