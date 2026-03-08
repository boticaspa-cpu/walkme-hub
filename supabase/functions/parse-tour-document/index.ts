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
    if (!file) {
      return new Response(JSON.stringify({ error: "No file provided" }), {
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

    const systemPrompt = `You are a tour document analyzer for a travel agency ERP system in Mexico's Riviera Maya.
Analyze the uploaded document (PDF or image) which contains tour information and price lists.
Extract all relevant data and return it as structured JSON using the provided tool.

Key extraction rules:
- Prices should be in MXN unless explicitly stated otherwise
- Zones are typically: Cancun, Playa, Tulum, Riviera Maya
- Nationalities: Nacional, Extranjero
- Pax types: Adulto, Menor
- Look for price matrices/tables showing different prices by zone and nationality
- Extract tour description, itinerary, includes/excludes lists
- If prices are in USD, note that in the response`;

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
                text: "Analyze this tour document and extract all tour information and pricing data using the extract_tour_data tool.",
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_tour_data",
              description: "Extract structured tour data from a document",
              parameters: {
                type: "object",
                properties: {
                  tour_name: { type: "string", description: "Name of the tour" },
                  short_description: { type: "string", description: "Brief description of the tour" },
                  itinerary: { type: "string", description: "Detailed itinerary or schedule" },
                  includes: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of what is included",
                  },
                  excludes: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of what is NOT included",
                  },
                  meeting_point: { type: "string", description: "Meeting/pickup point" },
                  what_to_bring: {
                    type: "array",
                    items: { type: "string" },
                    description: "Recommended items to bring",
                  },
                  recommendations: { type: "string", description: "General recommendations" },
                  price_variants: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        zone: { type: "string", enum: ["Cancun", "Playa", "Tulum", "Riviera Maya"] },
                        pax_type: { type: "string", enum: ["Adulto", "Niño"] },
                        nationality: { type: "string", enum: ["Mexicano", "Extranjero"] },
                        sale_price: { type: "number", description: "Sale price in MXN" },
                        net_cost: { type: "number", description: "Net cost if available" },
                        tax_fee: { type: "number", description: "Tax or fees if available" },
                      },
                      required: ["zone", "pax_type", "nationality", "sale_price"],
                    },
                    description: "Price matrix with all zone/nationality/pax_type combinations found",
                  },
                },
                required: ["tour_name", "price_variants"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_tour_data" } },
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
    console.error("parse-tour-document error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
