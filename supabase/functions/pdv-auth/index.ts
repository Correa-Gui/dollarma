import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-pdv-token, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

  // Validate terminal token
  const { data: terminal, error: termErr } = await supabase
    .from("pdv_terminals")
    .select("id, name")
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

  const { username, password } = body;

  if (!username || !password) {
    return new Response(
      JSON.stringify({ error: "username and password are required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Look up user by display_name in profiles
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("user_id, display_name, avatar_url")
    .eq("display_name", username)
    .single();

  if (profileErr || !profile) {
    return new Response(
      JSON.stringify({ success: false, error: "Invalid credentials" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Get the user's email from auth.users via admin API
  const { data: authUser, error: authUserErr } = await supabase.auth.admin.getUserById(profile.user_id);

  if (authUserErr || !authUser?.user?.email) {
    return new Response(
      JSON.stringify({ success: false, error: "Invalid credentials" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Authenticate with the resolved email + provided password
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: authUser.user.email,
    password,
  });

  if (authError || !authData.user) {
    return new Response(
      JSON.stringify({ success: false, error: "Invalid credentials" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const userId = authData.user.id;

  // Fetch user role
  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .single();

  return new Response(
    JSON.stringify({
      success: true,
      user: {
        id: userId,
        email: authData.user.email,
        display_name: profile.display_name ?? null,
        role: roleData?.role ?? "cashier",
      },
      terminal: {
        id: terminal.id,
        name: terminal.name,
      },
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
