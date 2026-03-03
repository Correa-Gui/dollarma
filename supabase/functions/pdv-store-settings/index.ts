import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Validate terminal token
  const { data: terminal, error: termErr } = await supabase
    .from("pdv_terminals")
    .select("id, name")
    .eq("token", token)
    .maybeSingle();

  if (termErr || !terminal) {
    return new Response(JSON.stringify({ error: "Invalid terminal token" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Fetch store settings
  const { data: settings, error: settErr } = await supabase
    .from("store_settings")
    .select("store_name, cnpj, address, timezone, currency, logo_url")
    .limit(1)
    .maybeSingle();

  if (settErr) {
    return new Response(JSON.stringify({ error: "Failed to fetch store settings" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({
      terminal: terminal.name,
      settings: settings ?? {
        store_name: "Minha Loja",
        cnpj: null,
        address: null,
        timezone: "America/Sao_Paulo",
        currency: "BRL",
        logo_url: null,
      },
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
});
