import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { businessName, productName, category, audience, tone, offer, extra } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const system = `You are a senior advertising creative director. Generate 4 distinct, premium, social-media-ready ad concepts. Each concept must include a punchy headline (<=7 words), a subheadline (<=14 words), persuasive body copy (1-2 sentences), and a strong call-to-action (<=4 words). Vary tone and angle across the 4 variations: benefit-led, emotional/lifestyle, bold/disruptive, and trust/social-proof. Match the business category and audience.`;

    const user = `Business: ${businessName || "N/A"}
Product/Service: ${productName || "N/A"}
Category: ${category || "General"}
Target audience: ${audience || "General consumers"}
Tone preference: ${tone || "modern, confident"}
Offer/Promotion: ${offer || "none"}
Extra notes: ${extra || "none"}`;

    const tool = {
      type: "function",
      function: {
        name: "return_ad_concepts",
        description: "Return 4 ad concepts.",
        parameters: {
          type: "object",
          properties: {
            concepts: {
              type: "array",
              minItems: 4,
              maxItems: 4,
              items: {
                type: "object",
                properties: {
                  angle: { type: "string" },
                  headline: { type: "string" },
                  subheadline: { type: "string" },
                  body: { type: "string" },
                  cta: { type: "string" },
                  palette: {
                    type: "object",
                    properties: {
                      background: {
                        type: "string",
                        description: "CSS color or linear-gradient(...)",
                      },
                      text: { type: "string" },
                      accent: { type: "string" },
                    },
                    required: ["background", "text", "accent"],
                    additionalProperties: false,
                  },
                  fontPair: {
                    type: "object",
                    properties: {
                      heading: { type: "string", description: "A web-safe or Google font name" },
                      body: { type: "string" },
                    },
                    required: ["heading", "body"],
                    additionalProperties: false,
                  },
                },
                required: [
                  "angle",
                  "headline",
                  "subheadline",
                  "body",
                  "cta",
                  "palette",
                  "fontPair",
                ],
                additionalProperties: false,
              },
            },
          },
          required: ["concepts"],
          additionalProperties: false,
        },
      },
    };

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "return_ad_concepts" } },
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429)
        return new Response(
          JSON.stringify({ error: "Rate limit reached. Please wait and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      if (resp.status === 402)
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Add credits in Lovable Cloud settings." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      const t = await resp.text();
      console.error("AI gateway error", resp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const call = data.choices?.[0]?.message?.tool_calls?.[0];
    const args = call ? JSON.parse(call.function.arguments) : { concepts: [] };
    return new Response(JSON.stringify(args), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-ad-content error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
