import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-pdv-token",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const token = req.headers.get("x-pdv-token");
  if (!token) {
    return new Response(JSON.stringify({ error: "Missing x-pdv-token header" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Validate terminal
  const { data: terminal, error: termErr } = await supabase
    .from("pdv_terminals")
    .select("id")
    .eq("token", token)
    .single();

  if (termErr || !terminal) {
    return new Response(JSON.stringify({ error: "Invalid terminal token" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { session_id, amount, description, operator_id } = body;

  if (!session_id || !amount || amount <= 0) {
    return new Response(
      JSON.stringify({ error: "session_id and positive amount are required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Verify session is open and belongs to terminal
  const { data: session } = await supabase
    .from("cash_register_sessions")
    .select("id")
    .eq("id", session_id)
    .eq("terminal_id", terminal.id)
    .eq("status", "open")
    .single();

  if (!session) {
    return new Response(JSON.stringify({ error: "Open session not found for this terminal" }), {
      status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: movement, error } = await supabase
    .from("cash_register_movements")
    .insert({
      session_id,
      type: "withdrawal",
      amount,
      description: description || "Sangria",
      created_by: operator_id ?? null,
    })
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true, movement }), {
    status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
