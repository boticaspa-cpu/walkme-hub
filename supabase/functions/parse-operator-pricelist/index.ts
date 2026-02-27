import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const operatorId = formData.get("operator_id") as string | null;

    if (!file) {
      return new Response(JSON.stringify({ error: "No file provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const mimeType = file.type || "application/octet-stream";

    const systemPrompt = `You are an expert at extracting tour pricing data from operator price lists. 
Analyze the document and extract ALL tours with their price variants.
Look for patterns like tables with zones, nationalities, adult/child prices, taxes/fees.
Also detect if the document mentions a general agency commission (e.g. "Comisión Agencias: 20%", "Agency Discount: 15%").
If net_cost is not explicitly stated, leave it as 0.
Common zones: Cancun, Riviera Maya, Playa del Carmen, Costa Mujeres.
Common nationalities: Nacional, Extranjero.
Common pax types: Adulto, Niño, Infante.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: `data:${mimeType};base64,${base64}` },
              },
              {
                type: "text",
                text: `Extract all tours and their price variants from this operator price list document. Operator ID: ${operatorId || "unknown"}.`,
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_pricelist",
              description: "Extract tours and price variants from an operator price list",
              parameters: {
                type: "object",
                properties: {
                  detected_commission_percent: {
                    type: "number",
                    description:
                      "General agency commission percentage if mentioned in document (e.g. 20 for '20% comisión'). Null if not found.",
                  },
                  tours: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        tour_name: { type: "string", description: "Name of the tour" },
                        price_variants: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              zone: { type: "string", description: "Zone (e.g. Cancun, Riviera Maya)" },
                              pax_type: { type: "string", description: "Adulto, Niño, or Infante" },
                              nationality: { type: "string", description: "Nacional or Extranjero" },
                              sale_price: { type: "number", description: "Public sale price (USD)" },
                              net_cost: { type: "number", description: "Net cost to agency (USD). 0 if not stated" },
                              tax_fee: { type: "number", description: "Tax/dock fee (USD). 0 if not stated" },
                            },
                            required: ["zone", "pax_type", "nationality", "sale_price", "net_cost", "tax_fee"],
                          },
                        },
                      },
                      required: ["tour_name", "price_variants"],
                    },
                  },
                },
                required: ["tours"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_pricelist" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error("AI gateway error");
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const extracted = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(extracted), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-operator-pricelist error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
