import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { logAudit } from "./useAuditLog";
import { trimOptionalText, trimText } from "@/lib/format";

export type Product = Tables<"products"> & {
  categories?: { name: string } | null;
  suppliers?: { name: string } | null;
};

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name), suppliers(name)")
        .order("name");
      if (error) throw error;
      return ((data ?? []) as Product[]).map((product) => ({
        ...product,
        name: trimText(product.name),
        sku: trimText(product.sku),
        barcode: trimOptionalText(product.barcode),
        unit: trimText(product.unit),
      }));
    },
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (product: TablesInsert<"products">) => {
      const { data, error } = await supabase.from("products").insert({
        ...product,
        name: trimText(product.name),
        sku: trimText(product.sku),
        barcode: trimOptionalText(product.barcode),
        category_id: trimOptionalText(product.category_id),
        supplier_id: trimOptionalText(product.supplier_id),
        ncm: trimOptionalText(product.ncm),
        cfop: trimOptionalText(product.cfop),
        unit: trimText(product.unit),
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Produto criado");
      logAudit("product", data.id, data.name, "create", { sku: data.sku, sale_price: data.sale_price });
    },
    onError: (e: Error) => toast.error(`Erro ao criar produto: ${e.message}`),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<"products"> & { id: string }) => {
      const { data, error } = await supabase.from("products").update({
        ...updates,
        name: updates.name ? trimText(updates.name) : updates.name,
        sku: updates.sku ? trimText(updates.sku) : updates.sku,
        barcode: updates.barcode === undefined ? undefined : trimOptionalText(updates.barcode),
        category_id: updates.category_id === undefined ? undefined : trimOptionalText(updates.category_id),
        supplier_id: updates.supplier_id === undefined ? undefined : trimOptionalText(updates.supplier_id),
        ncm: updates.ncm === undefined ? undefined : trimOptionalText(updates.ncm),
        cfop: updates.cfop === undefined ? undefined : trimOptionalText(updates.cfop),
        unit: updates.unit ? trimText(updates.unit) : updates.unit,
      }).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Produto atualizado");
      logAudit("product", data.id, data.name, "update", { sale_price: data.sale_price, stock_quantity: data.stock_quantity });
    },
    onError: (e: Error) => toast.error(`Erro ao atualizar: ${e.message}`),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data: p } = await supabase.from("products").select("name").eq("id", id).single();
      await supabase.from("stock_movements").delete().eq("product_id", id);
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
      return { id, name: p?.name ?? id };
    },
    onSuccess: ({ id, name }) => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Produto removido");
      logAudit("product", id, name, "delete");
    },
    onError: (e: Error) => toast.error(`Erro ao remover: ${e.message}`),
  });
}
