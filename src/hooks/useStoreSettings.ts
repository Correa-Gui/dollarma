import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatCpfCnpj, formatCpfCnpjPartial, trimOptionalText, trimText } from "@/lib/format";

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
      if (!data) return null;
      return {
        ...data,
        store_name: trimText(data.store_name),
        cnpj: data.cnpj ? formatCpfCnpjPartial(data.cnpj) : null,
        address: trimOptionalText(data.address),
        timezone: trimText(data.timezone),
        currency: trimText(data.currency),
        logo_url: trimOptionalText(data.logo_url),
      } as StoreSettings;
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
        .update({
          ...updates,
          store_name: updates.store_name ? trimText(updates.store_name) : updates.store_name,
          cnpj: updates.cnpj === undefined ? undefined : formatCpfCnpj(updates.cnpj),
          address: updates.address === undefined ? undefined : trimOptionalText(updates.address),
          timezone: updates.timezone ? trimText(updates.timezone) : updates.timezone,
          currency: updates.currency ? trimText(updates.currency) : updates.currency,
          logo_url: updates.logo_url === undefined ? undefined : trimOptionalText(updates.logo_url),
        })
        .eq("id", existing.id)
        .select()
        .single();
      if (error) throw error;
      return {
        ...data,
        store_name: trimText(data.store_name),
        cnpj: data.cnpj ? formatCpfCnpjPartial(data.cnpj) : null,
        address: trimOptionalText(data.address),
        timezone: trimText(data.timezone),
        currency: trimText(data.currency),
        logo_url: trimOptionalText(data.logo_url),
      };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["store_settings"] });
      toast.success("Configurações salvas");
    },
    onError: (e) => toast.error(`Erro: ${e.message}`),
  });
}
