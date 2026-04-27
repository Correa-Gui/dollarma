import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PAYMENT_LABELS: Record<string, string> = {
  cash: "Dinheiro",
  pix: "PIX",
  credit_card: "Crédito",
  debit_card: "Débito",
};

function bucketKey(method?: string | null): string {
  const v = (method ?? "").trim().toLowerCase();
  switch (v) {
    case "dinheiro": return "cash";
    case "cartao_credito":
    case "credito":
    case "credit_card": return "credit_card";
    case "cartao_debito":
    case "debito":
    case "debit_card": return "debit_card";
    case "pix": return "pix";
    default: return v || "cash";
  }
}

function fmt(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

Deno.serve(async (req) => {
  // Allow manual trigger via POST with optional secret check
  const internalSecret = Deno.env.get("REPORT_INTERNAL_SECRET");
  if (internalSecret) {
    const authHeader = req.headers.get("authorization") ?? "";
    if (authHeader !== `Bearer ${internalSecret}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Today's window in America/Sao_Paulo
  const now = new Date();
  const tz = "America/Sao_Paulo";
  const todayStr = now.toLocaleDateString("sv-SE", { timeZone: tz }); // YYYY-MM-DD
  const todayStart = new Date(`${todayStr}T00:00:00-03:00`);
  const todayEnd = new Date(`${todayStr}T23:59:59-03:00`);

  const { data: sales, error } = await supabase
    .from("sales")
    .select("payment_method, total")
    .eq("status", "completed")
    .gte("sold_at", todayStart.toISOString())
    .lte("sold_at", todayEnd.toISOString());

  if (error) {
    console.error("DB error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const totals: Record<string, number> = {};
  let grand = 0;

  (sales ?? []).forEach((s) => {
    const key = bucketKey(s.payment_method);
    totals[key] = (totals[key] || 0) + Number(s.total);
    grand += Number(s.total);
  });

  // Build message — fixed order: total, débito, crédito, dinheiro, pix
  const order: Array<[string, string]> = [
    ["debit_card", "Débito"],
    ["credit_card", "Crédito"],
    ["cash", "Dinheiro"],
    ["pix", "PIX"],
  ];

  const lines = order
    .filter(([key]) => totals[key] !== undefined)
    .map(([key, label]) => `${label}: ${fmt(totals[key])}`);

  // Add any unexpected methods not in order
  Object.entries(totals).forEach(([key]) => {
    if (!order.some(([k]) => k === key)) {
      const label = PAYMENT_LABELS[key] ?? key;
      lines.push(`${label}: ${fmt(totals[key])}`);
    }
  });

  const message = [
    `📊 *Relatório de Vendas — ${todayStr.split("-").reverse().join("/")}*`,
    "",
    `*Total em vendas hoje: ${fmt(grand)}*`,
    "",
    ...lines,
  ].join("\n");

  // Send via Evolution API
  const evolutionUrl = Deno.env.get("EVOLUTION_API_URL");
  const evolutionKey = Deno.env.get("EVOLUTION_API_KEY");
  const evolutionInstance = Deno.env.get("EVOLUTION_INSTANCE");
  const targetNumber = Deno.env.get("WHATSAPP_REPORT_NUMBER");

  if (!evolutionUrl || !evolutionKey || !evolutionInstance || !targetNumber) {
    console.error("Missing Evolution API env vars");
    return new Response(
      JSON.stringify({ error: "Missing Evolution API configuration", message }),
      { status: 500 }
    );
  }

  const res = await fetch(
    `${evolutionUrl}/message/sendText/${evolutionInstance}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: evolutionKey,
      },
      body: JSON.stringify({ number: targetNumber, text: message }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    console.error("Evolution API error:", res.status, body);
    return new Response(
      JSON.stringify({ error: "Evolution API error", status: res.status, body }),
      { status: 502 }
    );
  }

  return new Response(JSON.stringify({ ok: true, message }), {
    headers: { "Content-Type": "application/json" },
  });
});
