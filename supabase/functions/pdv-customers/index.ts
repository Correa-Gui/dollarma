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

  // GET — buscar clientes
  if (req.method === "GET") {
    const url = new URL(req.url);
    const search = url.searchParams.get("search") ?? "";
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50"), 200);

    let query = supabase
      .from("customers")
      .select("id, name, cpf, phone, email, address, notes, created_at")
      .order("name")
      .limit(limit);

    if (search.trim()) {
      query = query.or(
        `name.ilike.%${search}%,cpf.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ customers: data, total: data.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // POST — criar cliente
  if (req.method === "POST") {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { name, cpf, phone, email, address, notes } = body;

    if (!name || !name.trim()) {
      return new Response(JSON.stringify({ error: "name is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verifica duplicata por CPF (se informado)
    if (cpf) {
      const { data: existing } = await supabase
        .from("customers")
        .select("id, name")
        .eq("cpf", cpf)
        .maybeSingle();

      if (existing) {
        return new Response(
          JSON.stringify({ error: `CPF já cadastrado para: ${existing.name}`, existing_id: existing.id }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const { data: customer, error } = await supabase
      .from("customers")
      .insert({ name: name.trim(), cpf: cpf ?? null, phone: phone ?? null, email: email ?? null, address: address ?? null, notes: notes ?? null })
      .select("id, name, cpf, phone, email, address, notes, created_at")
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ customer }), {
      status: 201,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
