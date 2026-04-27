import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-pdv-token, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = req.headers.get("x-pdv-token")?.trim();
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
    const normalizedUsername = String(username ?? "").trim();

    if (!normalizedUsername || !password) {
      return new Response(
        JSON.stringify({ error: "username and password are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let userId = "";
    let userEmail = "";
    let profile: { user_id: string; display_name: string | null; avatar_url: string | null } | null = null;

    if (normalizedUsername.includes("@")) {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: normalizedUsername,
        password,
      });

      if (authError || !authData.user?.email) {
        return new Response(
          JSON.stringify({ success: false, error: "Invalid credentials" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      userId = authData.user.id;
      userEmail = authData.user.email;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .eq("user_id", userId)
        .maybeSingle();

      profile = profileData;
    } else {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .ilike("display_name", normalizedUsername)
        .limit(1)
        .maybeSingle();

      if (!profileData) {
        return new Response(
          JSON.stringify({ success: false, error: "Invalid credentials" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      profile = profileData;

      const { data: authUser, error: authUserErr } = await supabase.auth.admin.getUserById(profile.user_id);
      if (authUserErr || !authUser?.user?.email) {
        return new Response(
          JSON.stringify({ success: false, error: "Invalid credentials" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: authUser.user.email,
        password,
      });

      if (authError || !authData.user?.email) {
        return new Response(
          JSON.stringify({ success: false, error: "Invalid credentials" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      userId = authData.user.id;
      userEmail = authData.user.email;
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: userId,
          email: userEmail,
          display_name: profile?.display_name ?? null,
          role: roleData?.role ?? "cashier",
        },
        terminal: {
          id: terminal.id,
          name: terminal.name,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error?.message ?? "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
