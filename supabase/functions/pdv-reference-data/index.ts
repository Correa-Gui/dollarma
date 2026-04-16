import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { trimOptionalText, trimText } from "../_shared/format.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-pdv-token",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const token = req.headers.get("x-pdv-token");
  if (!token) {
    return new Response(JSON.stringify({ error: "Missing x-pdv-token header" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: terminal, error: termErr } = await supabase
    .from("pdv_terminals")
    .select("id")
    .eq("token", token)
    .single();

  if (termErr || !terminal) {
    return new Response(JSON.stringify({ error: "Invalid terminal token" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const [categoriesResult, suppliersResult] = await Promise.all([
    supabase.from("categories").select("id, name, parent_id").order("name"),
    supabase.from("suppliers").select("id, name, cnpj, contact, phone, email, avg_delivery_days, notes").order("name"),
  ]);

  if (categoriesResult.error) {
    return new Response(JSON.stringify({ error: categoriesResult.error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (suppliersResult.error) {
    return new Response(JSON.stringify({ error: suppliersResult.error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({
    categories: (categoriesResult.data ?? []).map((category: any) => ({
      ...category,
      name: trimText(category.name),
      parent_id: trimOptionalText(category.parent_id),
    })),
    suppliers: (suppliersResult.data ?? []).map((supplier: any) => ({
      ...supplier,
      name: trimText(supplier.name),
      cnpj: trimOptionalText(supplier.cnpj),
      contact: trimOptionalText(supplier.contact),
      phone: trimOptionalText(supplier.phone),
      email: trimOptionalText(supplier.email),
      notes: trimOptionalText(supplier.notes),
    })),
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
