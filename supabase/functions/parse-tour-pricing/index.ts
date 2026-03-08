import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const mode = formData.get("mode") as string | null; // "packages" or "variants"

    if (!file) {
      return new Response(JSON.stringify({ error: "No file provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!mode || !["packages", "variants"].includes(mode)) {
      return new Response(JSON.stringify({ error: "Invalid mode. Use 'packages' or 'variants'" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Convert file to base64 (chunked to avoid stack overflow)
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = "";
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
      for (let j = 0; j < chunk.length; j++) {
        binary += String.fromCharCode(chunk[j]);
      }
    }
    const base64 = btoa(binary);
    const mimeType = file.type || "application/octet-stream";

    const systemPromptPackages = `You are a tour pricing analyzer for a travel agency ERP in Mexico's Riviera Maya.
Analyze the uploaded document (PDF or image) which contains tour package information and pricing.
Extract ALL packages/service tiers you find (e.g. "Clásico", "Plus", "Premium", "Solo Entrada", "Con Transporte").

Key rules:
- Prices are in USD unless explicitly stated otherwise
- service_type: "with_transport" if the package includes transportation, "entry_only" if it's only entrance/admission
- Extract public/retail prices AND net/cost prices if both are shown
- mandatory_fees_usd = dock fees, park fees, or boarding fees if shown
- includes/excludes: extract as arrays of strings
- If only one package exists, still return it as an array`;

    const systemPromptVariants = `You are a tour pricing analyzer for a travel agency ERP in Mexico's Riviera Maya.
Analyze the uploaded document (PDF or image) which contains a price matrix/table.
Extract ALL price rows for different combinations of zone, pax type, and nationality.

Key rules:
- Zones are typically: Cancun, Playa, Tulum, Riviera Maya
- Pax types: Adulto, Menor
- Nationalities: Nacional, Extranjero
- sale_price = the retail/public price shown
- net_cost = the operator's net cost if shown (0 if not available)
- tax_fee = any taxes or fees shown separately (0 if not available)
- Prices are in USD unless explicitly stated otherwise
- Extract EVERY row you can identify from the price table/matrix`;

    const tools = mode === "packages"
      ? [{
          type: "function" as const,
          function: {
            name: "extract_packages",
            description: "Extract tour packages/tiers with pricing from a document",
            parameters: {
              type: "object",
              properties: {
                packages: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string", description: "Package name (e.g. Clásico, Premium, Solo Entrada)" },
                      service_type: { type: "string", enum: ["with_transport", "entry_only"], description: "Whether includes transport" },
                      public_price_adult_usd: { type: "number", description: "Public/retail adult price USD" },
                      public_price_child_usd: { type: "number", description: "Public/retail child price USD" },
                      cost_adult_usd: { type: "number", description: "Net cost adult USD" },
                      cost_child_usd: { type: "number", description: "Net cost child USD" },
                      mandatory_fees_usd: { type: "number", description: "Dock/park fees USD" },
                      includes: { type: "array", items: { type: "string" }, description: "What's included" },
                      excludes: { type: "array", items: { type: "string" }, description: "What's NOT included" },
                    },
                    required: ["name", "service_type", "public_price_adult_usd", "public_price_child_usd"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["packages"],
              additionalProperties: false,
            },
          },
        }]
      : [{
          type: "function" as const,
          function: {
            name: "extract_variants",
            description: "Extract price matrix rows (zone × pax type × nationality) from a document",
            parameters: {
              type: "object",
              properties: {
                variants: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      zone: { type: "string", enum: ["Cancun", "Playa", "Tulum", "Riviera Maya"] },
                      pax_type: { type: "string", enum: ["Adulto", "Niño"] },
                      nationality: { type: "string", enum: ["Mexicano", "Extranjero"] },
                      sale_price: { type: "number", description: "Retail/sale price" },
                      net_cost: { type: "number", description: "Net cost to operator" },
                      tax_fee: { type: "number", description: "Tax or fee amount" },
                    },
                    required: ["zone", "pax_type", "nationality", "sale_price"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["variants"],
              additionalProperties: false,
            },
          },
        }];

    const toolName = mode === "packages" ? "extract_packages" : "extract_variants";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: mode === "packages" ? systemPromptPackages : systemPromptVariants },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: `data:${mimeType};base64,${base64}` },
              },
              {
                type: "text",
                text: mode === "packages"
                  ? "Analyze this document and extract all tour packages/tiers with their pricing using the extract_packages tool."
                  : "Analyze this document and extract all price matrix rows (zone × pax type × nationality) using the extract_variants tool.",
              },
            ],
          },
        ],
        tools,
        tool_choice: { type: "function", function: { name: toolName } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Demasiadas solicitudes, intenta en unos segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes para IA." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Error al analizar documento" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      return new Response(JSON.stringify({ error: "No se pudo extraer datos del documento" }), {
        status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const extractedData = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(extractedData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-tour-pricing error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
