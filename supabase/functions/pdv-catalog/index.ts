import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildLooseLikePattern } from "../_shared/search.ts";
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
    .select("id, name")
    .eq("token", token)
    .single();

  if (termErr || !terminal) {
    return new Response(JSON.stringify({ error: "Invalid terminal token" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  await supabase
    .from("pdv_terminals")
    .update({ last_sync: new Date().toISOString(), status: "online" })
    .eq("id", terminal.id);

  const url = new URL(req.url);
  const search = url.searchParams.get("search") ?? "";
  const like = buildLooseLikePattern(search);

  let productsQuery = supabase
    .from("products")
    .select("id, sku, barcode, name, sale_price, cost_price, promo_price, promo_start, promo_end, stock_quantity, unit, image_url, category_id, supplier_id, ncm, cfop, categories(name), suppliers(name)")
    .eq("is_active", true)
    .order("name");

  if (search.trim()) {
    productsQuery = productsQuery.or(`name.ilike.${like},sku.ilike.${like},barcode.ilike.${like}`);
  }

  const { data: products, error: prodErr } = await productsQuery;

  if (prodErr) {
    return new Response(JSON.stringify({ error: prodErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const catalog = (products || []).map((p: any) => ({
    id: p.id,
    sku: trimText(p.sku),
    barcode: trimOptionalText(p.barcode),
    name: trimText(p.name),
    price: Number(p.sale_price),
    cost_price: p.cost_price !== null && typeof p.cost_price !== "undefined" ? Number(p.cost_price) : null,
    promoPrice: p.promo_price ? Number(p.promo_price) : null,
    promoStart: p.promo_start,
    promoEnd: p.promo_end,
    stock: p.stock_quantity,
    unit: trimText(p.unit),
    imageUrl: p.image_url,
    category_id: p.category_id,
    supplier_id: p.supplier_id,
    ncm: p.ncm ?? null,
    cfop: p.cfop ?? null,
    category: trimOptionalText(p.categories?.name),
    supplier: trimOptionalText(p.suppliers?.name),
  }));

  return new Response(JSON.stringify({ terminal: terminal.name, catalog }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
