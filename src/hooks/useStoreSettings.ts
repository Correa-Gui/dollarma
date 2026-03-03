import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type StoreSettings = {
  id: string;
  store_name: string;
  cnpj: string | null;
  address: string | null;
  timezone: string;
  currency: string;
  logo_url: string | null;
};

export function useStoreSettings() {
  return useQuery({
    queryKey: ["store_settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_settings")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as StoreSettings | null;
    },
  });
}

export function useUpdateStoreSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Partial<Omit<StoreSettings, "id">>) => {
      // Get the single settings row
      const { data: existing } = await supabase
        .from("store_settings")
        .select("id")
        .limit(1)
        .single();
      if (!existing) throw new Error("Settings not found");

      const { data, error } = await supabase
        .from("store_settings")
        .update(updates)
        .eq("id", existing.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["store_settings"] });
      toast.success("Configurações salvas");
    },
    onError: (e) => toast.error(`Erro: ${e.message}`),
  });
}
