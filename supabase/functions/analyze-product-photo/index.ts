const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let imageBase64: string;
  let mediaType: string;

  try {
    const body = await req.json();
    imageBase64 = body.imageBase64;
    mediaType = body.mediaType ?? "image/jpeg";
    if (!imageBase64) throw new Error("imageBase64 is required");
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const claudePayload = {
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType,
              data: imageBase64,
            },
          },
          {
            type: "text",
            text: `Analise esta foto de produto/embalagem e extraia as informações visíveis.
Retorne APENAS um JSON válido, sem markdown, sem explicações, com os campos:
- "name": nome completo do produto incluindo marca (ex: "Fratelli Conjunto Porta Molho e Petisco")
- "barcode": código EAN/código de barras visível como string numérica (ou null se não visível)

Regras:
- Se houver marca visível, inclua-a no início do nome
- O nome deve ser claro e descritivo para um sistema de estoque
- O barcode deve ser apenas os dígitos, sem espaços

Exemplo de resposta: {"name":"Fratelli Conjunto Porta Molho e Petisco","barcode":"7898008426730"}`,
          },
        ],
      },
    ],
  };

  const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify(claudePayload),
  });

  if (!claudeRes.ok) {
    const err = await claudeRes.text();
    return new Response(JSON.stringify({ error: `Anthropic API error: ${err}` }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const claudeData = await claudeRes.json();
  const text: string = claudeData.content?.[0]?.text ?? "";

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return new Response(JSON.stringify({ name: "", barcode: null }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const result = JSON.parse(jsonMatch[0]);
    return new Response(
      JSON.stringify({
        name: result.name ?? "",
        barcode: result.barcode ?? null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch {
    return new Response(JSON.stringify({ name: "", barcode: null }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
