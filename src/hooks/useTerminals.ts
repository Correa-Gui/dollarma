import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { toast } from "sonner";

export type Terminal = Tables<"pdv_terminals">;

export function useTerminals() {
  return useQuery({
    queryKey: ["pdv_terminals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pdv_terminals")
        .select("*")
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateTerminal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from("pdv_terminals")
        .insert({ name } as TablesInsert<"pdv_terminals">)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pdv_terminals"] });
      toast.success("Terminal criado — copie o token de API");
    },
    onError: (e) => toast.error(`Erro: ${e.message}`),
  });
}

export function useRegenerateToken() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const newToken = `tk_live_${Math.random().toString(36).substring(2, 14)}`;
      const { error } = await supabase
        .from("pdv_terminals")
        .update({ token: newToken })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pdv_terminals"] });
      toast.success("Token regenerado");
    },
    onError: (e) => toast.error(`Erro: ${e.message}`),
  });
}

export function useUpdateSyncInterval() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, interval }: { id: string; interval: number }) => {
      const { error } = await supabase
        .from("pdv_terminals")
        .update({ sync_interval_min: interval })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pdv_terminals"] });
      toast.success("Configuração salva");
    },
    onError: (e) => toast.error(`Erro: ${e.message}`),
  });
}
