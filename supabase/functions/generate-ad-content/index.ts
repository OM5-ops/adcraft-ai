import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {
    const form = await req.json();

    const concepts = [
      {
        angle: "Premium Quality",
        headline: `Experience ${form.productName}`,
        subheadline: `Premium solutions from ${form.businessName}`,
        body: "Designed for customers who value quality and reliability.",
        cta: "Shop Now",
        palette: {
          background: "#111827",
          text: "#ffffff",
          accent: "#3b82f6",
        },
        fontPair: {
          heading: "Inter",
          body: "Inter",
        },
      },
    ];

    return new Response(
      JSON.stringify({ concepts }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});