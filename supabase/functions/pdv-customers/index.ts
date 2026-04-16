import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildLooseLikePattern } from "../_shared/search.ts";
import { digitsOnly, formatCpfCnpj, trimOptionalText, trimText } from "../_shared/format.ts";

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

  if (req.method === "GET") {
    const url = new URL(req.url);
    const search = url.searchParams.get("search") ?? "";
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50"), 200);
    const like = buildLooseLikePattern(search);

    let query = supabase
      .from("customers")
      .select("id, name, cpf, phone, email, address, notes, created_at")
      .order("name")
      .limit(limit);

    if (search.trim()) {
      query = query.or(
        `name.ilike.${like},cpf.ilike.${like},phone.ilike.${like},email.ilike.${like}`
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

  const body = await req.json().catch(() => null);
  if (!body) {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if ((req.method === "PUT" || req.method === "PATCH") && !body.id) {
    return new Response(JSON.stringify({ error: "id is required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (req.method === "DELETE") {
    if (!body.id) {
      return new Response(JSON.stringify({ error: "id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error } = await supabase.from("customers").delete().eq("id", body.id);
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (req.method === "PUT" || req.method === "PATCH") {
    if (!body.name || !body.name.trim()) {
      return new Response(JSON.stringify({ error: "name is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: customer, error } = await supabase
      .from("customers")
      .update({
        name: trimText(body.name),
        cpf: formatCpfCnpj(body.cpf),
        phone: trimOptionalText(body.phone),
        email: trimOptionalText(body.email),
        address: trimOptionalText(body.address),
        notes: trimOptionalText(body.notes),
      })
      .eq("id", body.id)
      .select("id, name, cpf, phone, email, address, notes, created_at")
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ customer }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (req.method === "POST") {
    const { name, cpf, phone, email, address, notes } = body;
    const normalizedCpf = formatCpfCnpj(cpf);

    if (!name || !name.trim()) {
      return new Response(JSON.stringify({ error: "name is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (normalizedCpf) {
      const { data: existing } = await supabase
        .from("customers")
        .select("id, name")
        .eq("cpf", normalizedCpf)
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
      .insert({
        name: trimText(name),
        cpf: normalizedCpf,
        phone: trimOptionalText(phone),
        email: trimOptionalText(email),
        address: trimOptionalText(address),
        notes: trimOptionalText(notes),
      })
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
