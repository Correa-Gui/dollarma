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

  const { sale_id, reason, items } = body;

  if (!sale_id || !reason?.trim() || !Array.isArray(items) || items.length === 0) {
    return new Response(
      JSON.stringify({ error: "sale_id, reason and items[] are required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Busca a venda com seus itens
  const { data: sale, error: saleErr } = await supabase
    .from("sales")
    .select("id, sale_number, status, total, sale_items(id, product_id, product_name, quantity, unit_price)")
    .eq("id", sale_id)
    .single();

  if (saleErr || !sale) {
    return new Response(
      JSON.stringify({ error: `Sale ${sale_id} not found` }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (sale.status !== "completed") {
    return new Response(
      JSON.stringify({ error: `Sale is not eligible for refund (status: ${sale.status})` }),
      { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Valida cada item e quantidade
  const saleItemsMap = new Map(
    (sale.sale_items as any[]).map((si: any) => [si.product_id, si])
  );

  for (const item of items) {
    if (!item.product_id || !item.quantity || item.quantity <= 0) {
      return new Response(
        JSON.stringify({ error: "Each item needs product_id and quantity > 0" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const saleItem = saleItemsMap.get(item.product_id);
    if (!saleItem) {
      return new Response(
        JSON.stringify({ error: `Product ${item.product_id} was not in this sale` }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (item.quantity > saleItem.quantity) {
      return new Response(
        JSON.stringify({
          error: `Refund quantity (${item.quantity}) exceeds sold quantity (${saleItem.quantity}) for product ${item.product_id}`,
        }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }

  // Processa devolução: repõe estoque e cria movimentações
  const restocked: any[] = [];
  for (const item of items) {
    const { data: product } = await supabase
      .from("products")
      .select("stock_quantity")
      .eq("id", item.product_id)
      .single();

    const prevQty = product?.stock_quantity ?? 0;
    const newQty = prevQty + item.quantity;

    await supabase.from("products").update({ stock_quantity: newQty }).eq("id", item.product_id);
    await supabase.from("stock_movements").insert({
      product_id: item.product_id,
      type: "refund",
      quantity: item.quantity,
      previous_qty: prevQty,
      new_qty: newQty,
      reason: reason.trim(),
      origin: "pdv",
    });

    restocked.push({ product_id: item.product_id, quantity: item.quantity });
  }

  // Marca a venda como devolvida
  await supabase
    .from("sales")
    .update({ status: "refunded", cancel_reason: reason.trim() })
    .eq("id", sale_id);

  return new Response(
    JSON.stringify({
      success: true,
      sale_id,
      sale_number: sale.sale_number,
      items_refunded: restocked.length,
      restocked,
    }),
    { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
