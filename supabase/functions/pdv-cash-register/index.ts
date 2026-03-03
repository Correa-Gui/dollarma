import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-pdv-token",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
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
    .select("id, name")
    .eq("token", token)
    .single();

  if (termErr || !terminal) {
    return new Response(JSON.stringify({ error: "Invalid terminal token" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action"); // open, close, withdrawal, deposit, status

  try {
    // ========== OPEN ==========
    if (req.method === "POST" && action === "open") {
      const body = await req.json();
      const { operator_id, opening_balance = 0 } = body;
      if (!operator_id) throw { status: 400, message: "operator_id is required" };

      // Check if there's already an open session
      const { data: existing } = await supabase
        .from("cash_register_sessions")
        .select("id")
        .eq("terminal_id", terminal.id)
        .eq("status", "open")
        .maybeSingle();

      if (existing) throw { status: 409, message: "Terminal already has an open session", session_id: existing.id };

      const { data: session, error } = await supabase
        .from("cash_register_sessions")
        .insert({ terminal_id: terminal.id, opened_by: operator_id, opening_balance })
        .select()
        .single();

      if (error) throw { status: 500, message: error.message };
      return json({ success: true, session });
    }

    // ========== CLOSE ==========
    if (req.method === "POST" && action === "close") {
      const body = await req.json();
      const { session_id, operator_id, closing_balance = 0, notes } = body;
      if (!session_id || !operator_id) throw { status: 400, message: "session_id and operator_id are required" };

      // Get session and compute expected
      const { data: session, error: sessErr } = await supabase
        .from("cash_register_sessions")
        .select("*")
        .eq("id", session_id)
        .eq("terminal_id", terminal.id)
        .eq("status", "open")
        .single();

      if (sessErr || !session) throw { status: 404, message: "Open session not found" };

      // Sum movements
      const { data: movs } = await supabase
        .from("cash_register_movements")
        .select("type, amount")
        .eq("session_id", session_id);

      let expected = Number(session.opening_balance);
      (movs || []).forEach((m: any) => {
        const amt = Number(m.amount);
        if (m.type === "sale" || m.type === "deposit") expected += amt;
        else if (m.type === "withdrawal" || m.type === "refund") expected -= amt;
      });

      const difference = closing_balance - expected;

      const { data: updated, error: updErr } = await supabase
        .from("cash_register_sessions")
        .update({ closed_by: operator_id, closed_at: new Date().toISOString(), closing_balance, expected_balance: +expected.toFixed(2), difference: +difference.toFixed(2), status: "closed", notes })
        .eq("id", session_id)
        .select()
        .single();

      if (updErr) throw { status: 500, message: updErr.message };
      return json({ success: true, session: updated });
    }

    // ========== WITHDRAWAL / DEPOSIT ==========
    if (req.method === "POST" && (action === "withdrawal" || action === "deposit")) {
      const body = await req.json();
      const { session_id, amount, description, operator_id } = body;
      if (!session_id || !amount || amount <= 0) throw { status: 400, message: "session_id and positive amount are required" };

      // Verify session is open
      const { data: sess } = await supabase
        .from("cash_register_sessions")
        .select("id")
        .eq("id", session_id)
        .eq("terminal_id", terminal.id)
        .eq("status", "open")
        .single();

      if (!sess) throw { status: 404, message: "Open session not found" };

      const { data: mov, error } = await supabase
        .from("cash_register_movements")
        .insert({ session_id, type: action, amount, description: description || (action === "withdrawal" ? "Sangria" : "Suprimento"), created_by: operator_id })
        .select()
        .single();

      if (error) throw { status: 500, message: error.message };
      return json({ success: true, movement: mov });
    }

    // ========== STATUS (GET) ==========
    if (req.method === "GET" && action === "status") {
      const { data: session } = await supabase
        .from("cash_register_sessions")
        .select("*")
        .eq("terminal_id", terminal.id)
        .eq("status", "open")
        .maybeSingle();

      if (!session) return json({ open: false, terminal_id: terminal.id });

      const { data: movs } = await supabase
        .from("cash_register_movements")
        .select("type, amount")
        .eq("session_id", session.id);

      let currentBalance = Number(session.opening_balance);
      let totalSales = 0, totalWithdrawals = 0, totalDeposits = 0;
      (movs || []).forEach((m: any) => {
        const amt = Number(m.amount);
        if (m.type === "sale") { currentBalance += amt; totalSales += amt; }
        else if (m.type === "deposit") { currentBalance += amt; totalDeposits += amt; }
        else if (m.type === "withdrawal") { currentBalance -= amt; totalWithdrawals += amt; }
        else if (m.type === "refund") { currentBalance -= amt; }
      });

      return json({
        open: true,
        session_id: session.id,
        terminal_id: terminal.id,
        opened_at: session.opened_at,
        opening_balance: session.opening_balance,
        current_balance: +currentBalance.toFixed(2),
        total_sales: +totalSales.toFixed(2),
        total_withdrawals: +totalWithdrawals.toFixed(2),
        total_deposits: +totalDeposits.toFixed(2),
        movements_count: (movs || []).length,
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action. Use ?action=open|close|withdrawal|deposit|status" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    const status = e.status || 500;
    return new Response(JSON.stringify({ error: e.message, ...(e.session_id ? { session_id: e.session_id } : {}) }), {
      status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function json(data: unknown) {
  return new Response(JSON.stringify(data), {
    headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
  });
}
