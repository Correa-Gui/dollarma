import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type Payable = {
  id: string;
  supplier_id: string | null;
  number: string | null;
  issued_at: string;
  due_at: string;
  amount: number;
  description: string | null;
  status: "pending" | "paid" | "cancelled";
  paid_at: string | null;
  paid_amount: number | null;
  installment: boolean;
  installment_count: number;
  installment_current: number;
  created_at: string;
  suppliers?: { name: string } | null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = () => (supabase as any).from("payables");

export function usePayables(status?: string) {
  return useQuery({
    queryKey: ["payables", status],
    queryFn: async () => {
      let q = db()
        .select("*, suppliers(name)")
        .order("due_at", { ascending: true });
      if (status && status !== "all") q = q.eq("status", status);
      const { data, error } = await q;
      if (error) throw error;
      return data as Payable[];
    },
  });
}

export function useCreatePayable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<Payable, "id" | "created_at" | "suppliers">) => {
      const { data, error } = await db().insert(payload).select().single();
      if (error) throw error;
      return data as Payable;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payables"] });
      toast.success("Lançamento criado");
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}

export function useUpdatePayable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<Payable> & { id: string }) => {
      const { data, error } = await db().update(payload).eq("id", id).select().single();
      if (error) throw error;
      return data as Payable;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payables"] });
      toast.success("Lançamento atualizado");
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}

export function useDeletePayable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db().delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payables"] });
      toast.success("Lançamento removido");
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}

export function useMarkAsPaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, paid_at, paid_amount }: { id: string; paid_at: string; paid_amount: number }) => {
      const { data, error } = await db()
        .update({ status: "paid", paid_at, paid_amount })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Payable;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payables"] });
      toast.success("Marcado como pago");
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}
