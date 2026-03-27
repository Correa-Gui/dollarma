const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "OPENAI_API_KEY not configured" }), {
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
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const openaiPayload = {
    model: "gpt-4o-mini",
    max_tokens: 256,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: `data:${mediaType};base64,${imageBase64}` },
          },
          {
            type: "text",
            text: 'Analise esta foto de produto. Retorne APENAS um JSON válido, sem markdown, com os campos: "name" (nome completo do produto, incluindo marca, ex: "Coca-Cola Lata 350ml") e "barcode" (código EAN/código de barras visível na embalagem como string, ou null se não visível). Exemplo: {"name":"Nescafé Tradicional 500g","barcode":"7891000315507"}',
          },
        ],
      },
    ],
  };

  const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(openaiPayload),
  });

  if (!openaiRes.ok) {
    const err = await openaiRes.text();
    return new Response(JSON.stringify({ error: `OpenAI API error: ${err}` }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const openaiData = await openaiRes.json();
  const text: string = openaiData.choices?.[0]?.message?.content ?? "";

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return new Response(JSON.stringify({ name: "", barcode: null }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const result = JSON.parse(jsonMatch[0]);
    return new Response(JSON.stringify({ name: result.name ?? "", barcode: result.barcode ?? null }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ name: "", barcode: null }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
