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
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Validate terminal
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

  const { payment_method, items } = body;

  if (!payment_method || !Array.isArray(items) || items.length === 0) {
    return new Response(
      JSON.stringify({ error: "payment_method and items[] are required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Calculate total
  let total = 0;
  const saleItems: any[] = [];

  for (const item of items) {
    if (!item.product_id || !item.quantity || item.quantity <= 0) {
      return new Response(
        JSON.stringify({ error: "Each item needs product_id and quantity > 0" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: product } = await supabase
      .from("products")
      .select("id, name, sale_price, promo_price, promo_start, promo_end, stock_quantity")
      .eq("id", item.product_id)
      .single();

    if (!product) {
      return new Response(
        JSON.stringify({ error: `Product ${item.product_id} not found` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check promo
    const now = new Date().toISOString().slice(0, 10);
    let price = Number(product.sale_price);
    if (product.promo_price && product.promo_start && product.promo_end) {
      if (now >= product.promo_start && now <= product.promo_end) {
        price = Number(product.promo_price);
      }
    }

    const subtotal = +(price * item.quantity).toFixed(2);
    total += subtotal;

    saleItems.push({
      product_id: product.id,
      product_name: product.name,
      quantity: item.quantity,
      unit_price: price,
      subtotal,
      _prev_stock: product.stock_quantity,
    });
  }

  total = +total.toFixed(2);

  // Insert sale
  const { data: sale, error: saleErr } = await supabase
    .from("sales")
    .insert({
      terminal_id: terminal.id,
      origin: "pdv",
      payment_method,
      total,
      status: "completed",
      sold_at: new Date().toISOString(),
    })
    .select("id, sale_number")
    .single();

  if (saleErr) {
    return new Response(JSON.stringify({ error: saleErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Insert sale items + update stock + create movements
  for (const si of saleItems) {
    const prevStock = si._prev_stock;
    const newStock = prevStock - si.quantity;

    await supabase.from("sale_items").insert({
      sale_id: sale.id,
      product_id: si.product_id,
      product_name: si.product_name,
      quantity: si.quantity,
      unit_price: si.unit_price,
      subtotal: si.subtotal,
    });

    await supabase
      .from("products")
      .update({ stock_quantity: newStock })
      .eq("id", si.product_id);

    await supabase.from("stock_movements").insert({
      product_id: si.product_id,
      type: "saida",
      quantity: si.quantity,
      previous_qty: prevStock,
      new_qty: newStock,
      reason: `Venda #${sale.sale_number}`,
      origin: "pdv",
    });
  }

  return new Response(
    JSON.stringify({
      sale_id: sale.id,
      sale_number: sale.sale_number,
      total,
      items_count: saleItems.length,
    }),
    { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
