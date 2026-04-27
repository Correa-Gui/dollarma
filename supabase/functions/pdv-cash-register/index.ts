import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-pdv-token",
};

Deno.serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = req.headers.get("x-pdv-token")?.trim();
    if (!token) {
      return new Response(JSON.stringify({ error: "Missing x-pdv-token header" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
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

    const { action, amount, operator_id, datetime, notes } = body;

    if (!action || !["open", "close"].includes(action)) {
      return new Response(
        JSON.stringify({ error: "action must be 'open' or 'close'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========== OPEN ==========
    if (action === "open") {
      if (!operator_id) {
        return new Response(JSON.stringify({ error: "operator_id is required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check if there's already an open session for this terminal
      const { data: existing } = await supabase
        .from("cash_register_sessions")
        .select("id")
        .eq("terminal_id", terminal.id)
        .eq("status", "open")
        .maybeSingle();

      if (existing) {
        return new Response(
          JSON.stringify({ error: "Terminal already has an open session", session_id: existing.id }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: session, error } = await supabase
        .from("cash_register_sessions")
        .insert({
          terminal_id: terminal.id,
          opened_by: operator_id,
          opening_balance: amount ?? 0,
          opened_at: datetime ?? new Date().toISOString(),
        })
        .select("id, terminal_id, opened_at, opening_balance, status")
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, session }), {
        status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ========== CLOSE ==========
    if (action === "close") {
      const { session_id } = body;
      if (!session_id || !operator_id) {
        return new Response(JSON.stringify({ error: "session_id and operator_id are required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get the open session
      const { data: session, error: sessErr } = await supabase
        .from("cash_register_sessions")
        .select("*")
        .eq("id", session_id)
        .eq("terminal_id", terminal.id)
        .eq("status", "open")
        .single();

      if (sessErr || !session) {
        return new Response(JSON.stringify({ error: "Open session not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Compute expected balance from sales + movements
      let expected = Number(session.opening_balance);

      // Sum sales linked to this session
      const { data: salesData } = await supabase
        .from("sales")
        .select("total, payment_method")
        .eq("session_id", session_id)
        .eq("status", "completed");

      let totalSales = 0;
      (salesData || []).forEach((s: any) => {
        totalSales += Number(s.total);
        // Only cash sales affect the cash register balance
        if (["dinheiro", "Dinheiro", "cash"].includes(s.payment_method)) {
          expected += Number(s.total);
        }
      });

      // Sum movements (withdrawals/deposits)
      const { data: movs } = await supabase
        .from("cash_register_movements")
        .select("type, amount")
        .eq("session_id", session_id);

      (movs || []).forEach((m: any) => {
        const amt = Number(m.amount);
        if (m.type === "deposit") expected += amt;
        else if (m.type === "withdrawal") expected -= amt;
      });

      const closingBalance = amount ?? 0;
      const difference = +(closingBalance - expected).toFixed(2);

      const { data: updated, error: updErr } = await supabase
        .from("cash_register_sessions")
        .update({
          closed_by: operator_id,
          closed_at: datetime ?? new Date().toISOString(),
          closing_balance: closingBalance,
          expected_balance: +expected.toFixed(2),
          difference,
          status: "closed",
          notes: notes ?? null,
        })
        .eq("id", session_id)
        .select()
        .single();

      if (updErr) throw updErr;

      return new Response(JSON.stringify({ success: true, session: updated, total_sales: +totalSales.toFixed(2) }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
