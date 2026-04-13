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

  if (!["POST", "PUT", "PATCH"].includes(req.method)) {
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

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (req.method === "POST") {
    if (!body.name || !body.sku) {
      return new Response(JSON.stringify({ error: "name e sku sao obrigatorios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: product, error } = await supabase
      .from("products")
      .insert({
        id: body.id ?? undefined,
        name: body.name,
        sku: body.sku,
        barcode: body.barcode ?? null,
        sale_price: body.sale_price ?? 0,
        cost_price: body.cost_price ?? body.sale_price ?? 0,
        stock_quantity: body.stock_quantity ?? 0,
        min_stock: body.min_stock ?? 0,
        unit: body.unit ?? "un",
        is_active: body.is_active ?? true,
      })
      .select("id, name, sku, barcode, sale_price, cost_price, stock_quantity, min_stock, unit, is_active")
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ product }), {
      status: 201,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!body.id) {
    return new Response(JSON.stringify({ error: "id do produto e obrigatorio" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const updates: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    if (key === "id" || typeof value === "undefined") {
      continue;
    }

    updates[key] = value;
  }

  const { data: product, error } = await supabase
    .from("products")
    .update(updates)
    .eq("id", body.id)
    .select("id, name, sku, barcode, sale_price, cost_price, stock_quantity, min_stock, unit, is_active")
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ product }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
