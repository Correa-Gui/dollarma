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

  const {
    payment_method,
    items,
    session_id,
    customer_id,
    discount_percent,
    receipt_requested,
    receipt_tax_id,
  } = body;

  if (!payment_method || !Array.isArray(items) || items.length === 0) {
    return new Response(
      JSON.stringify({ error: "payment_method e items[] sao obrigatorios" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  if (!session_id) {
    return new Response(
      JSON.stringify({ error: "session_id is required (open cash register session)" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  let subtotal = 0;
  const saleItems: any[] = [];

  for (const item of items) {
    if ((!item.product_id && !item.barcode && !item.sku) || !item.quantity || item.quantity <= 0) {
      return new Response(
        JSON.stringify({ error: "Cada item precisa de product_id (ou barcode/sku) e quantity > 0" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let product: any = null;

    if (item.product_id) {
      const { data } = await supabase
        .from("products")
        .select("id, name, sku, barcode, sale_price, promo_price, promo_start, promo_end, stock_quantity")
        .eq("id", item.product_id)
        .maybeSingle();
      product = data;
    }

    if (!product && item.barcode) {
      const { data } = await supabase
        .from("products")
        .select("id, name, sku, barcode, sale_price, promo_price, promo_start, promo_end, stock_quantity")
        .eq("barcode", item.barcode)
        .maybeSingle();
      product = data;
    }

    if (!product && item.sku) {
      const { data } = await supabase
        .from("products")
        .select("id, name, sku, barcode, sale_price, promo_price, promo_start, promo_end, stock_quantity")
        .eq("sku", item.sku)
        .maybeSingle();
      product = data;
    }

    if (!product) {
      const identifier = item.barcode ?? item.sku ?? item.product_id;
      return new Response(
        JSON.stringify({ error: `Product not found: ${identifier}` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const now = new Date().toISOString().slice(0, 10);
    let unitPrice = Number(product.sale_price);
    if (product.promo_price && product.promo_start && product.promo_end) {
      if (now >= product.promo_start && now <= product.promo_end) {
        unitPrice = Number(product.promo_price);
      }
    }

    if (item.unit_price && Number(item.unit_price) >= 0) {
      unitPrice = Number(item.unit_price);
    }

    const lineSubtotal = +(unitPrice * item.quantity).toFixed(2);
    subtotal += lineSubtotal;

    saleItems.push({
      product_id: product.id,
      product_name: product.name,
      product_sku: product.sku,
      barcode: product.barcode,
      quantity: item.quantity,
      unit_price: unitPrice,
      subtotal: lineSubtotal,
      _prev_stock: product.stock_quantity,
    });
  }

  subtotal = +subtotal.toFixed(2);
  const parsedDiscountPercent = Math.max(0, Math.min(Number(discount_percent ?? 0), 100));
  const discountAmount = +((subtotal * parsedDiscountPercent) / 100).toFixed(2);
  const total = +(subtotal - discountAmount).toFixed(2);

  const { data: sale, error: saleErr } = await supabase
    .from("sales")
    .insert({
      terminal_id: terminal.id,
      session_id,
      origin: "pdv",
      payment_method,
      total,
      status: "completed",
      sold_at: new Date().toISOString(),
      discount_percent: parsedDiscountPercent,
      discount_amount: discountAmount,
      receipt_requested: Boolean(receipt_requested),
      receipt_tax_id: receipt_tax_id ?? null,
      ...(customer_id ? { customer_id } : {}),
    })
    .select("id, sale_number")
    .single();

  if (saleErr) {
    return new Response(JSON.stringify({ error: saleErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  for (const si of saleItems) {
    const prevStock = si._prev_stock;
    const newStock = prevStock - si.quantity;

    await supabase.from("sale_items").insert({
      sale_id: sale.id,
      product_id: si.product_id,
      product_name: si.product_name,
      product_sku: si.product_sku,
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
    { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
