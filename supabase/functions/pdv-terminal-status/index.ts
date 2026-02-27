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

  // Get terminal by token
  const { data: terminal, error } = await supabase
    .from("pdv_terminals")
    .select("id, name, status, last_sync, sync_interval_min, created_at")
    .eq("token", token)
    .single();

  if (error || !terminal) {
    return new Response(JSON.stringify({ error: "Invalid terminal token" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Count today's sales for this terminal
  const today = new Date().toISOString().slice(0, 10);
  const { count: salesToday } = await supabase
    .from("sales")
    .select("id", { count: "exact", head: true })
    .eq("terminal_id", terminal.id)
    .gte("sold_at", `${today}T00:00:00`)
    .lte("sold_at", `${today}T23:59:59`);

  // Sum today's revenue
  const { data: revenueData } = await supabase
    .from("sales")
    .select("total")
    .eq("terminal_id", terminal.id)
    .eq("status", "completed")
    .gte("sold_at", `${today}T00:00:00`)
    .lte("sold_at", `${today}T23:59:59`);

  const revenueToday = (revenueData || []).reduce(
    (sum: number, s: any) => sum + Number(s.total),
    0
  );

  return new Response(
    JSON.stringify({
      terminal_id: terminal.id,
      name: terminal.name,
      status: terminal.status,
      last_sync: terminal.last_sync,
      sync_interval_min: terminal.sync_interval_min,
      sales_today: salesToday ?? 0,
      revenue_today: +revenueToday.toFixed(2),
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
