import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { formatCpfCnpj, trimOptionalText, trimText } from "../_shared/format.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-pdv-token",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
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

  const body = await req.json().catch(() => null);
  if (!trimText(body?.name)) {
    return new Response(JSON.stringify({ error: "name is required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: supplier, error } = await supabase
    .from("suppliers")
    .insert({
      name: trimText(body.name),
      cnpj: formatCpfCnpj(body.cnpj),
      contact: trimOptionalText(body.contact),
      phone: trimOptionalText(body.phone),
      email: trimOptionalText(body.email),
      avg_delivery_days: body.avg_delivery_days ?? 0,
      notes: trimOptionalText(body.notes),
    })
    .select("id, name, cnpj, contact, phone, email, avg_delivery_days, notes, created_at")
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ supplier }), {
    status: 201,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
