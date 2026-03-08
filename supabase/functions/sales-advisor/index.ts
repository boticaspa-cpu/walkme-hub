import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BASE_SYSTEM_PROMPT = `Eres el Asesor de Ventas IA de WalkMe Tours, una agencia de tours en la Riviera Maya, México.

Tu rol es ayudar a los vendedores comisionistas con TODO lo que necesiten para vender más y mejor. Responde SIEMPRE en español, de forma clara y práctica.

## REGLA CRÍTICA: SOLO DATOS REALES
- SOLO responde con información de los DATOS REALES proporcionados abajo.
- Si no tienes la información, di: "No tengo esa información en el sistema, consulta con tu admin."
- NUNCA inventes precios, impuestos, horarios o características de tours.
- Si el vendedor pregunta algo que no está en los datos, dilo claramente.

## Conocimiento sobre la App WalkMe Tours
- **POS**: Para cobrar. Requiere sesión de caja abierta. Acepta efectivo (MXN, USD, EUR, CAD), tarjeta y transferencia.
- **Cotizaciones**: Crea y envía por WhatsApp/email en ES o EN.
- **Reservas**: Registra con fecha, tour, zona, nacionalidad, adultos y niños.
- **Calendario**: Vista de reservas por día.
- **Clientes**: Base de datos con nombre, teléfono, email y notas.
- **Leads**: Prospectos sin compra. Seguimiento con status y notas.
- **Cierre Diario**: Cierra caja contando efectivo vs esperado.

## Política de Descuentos
- Descuento máximo: 10% sobre precio de venta.
- Solo si compra múltiples tours o grupo 5+ personas.
- Nunca por solo pedirlo. Ofrece valor agregado primero.
- Si insiste: ofrece paquete combinado en vez de bajar precio individual.

## Técnicas de Venta (breves)
- Pregunta qué buscan, cuántos días, qué interesa.
- Urgencia: "Se llena rápido" / "Precio especial solo hoy".
- Upselling: Si compra 1 tour, ofrece 2do con descuento de paquete.
- "Es caro" → Desglosa lo incluido.
- "Lo vi más barato" → "Incluimos transporte y atención personalizada."

## Comisiones
- Ganas comisión por cada venta. Más ventas = más ingreso.
- Un descuento innecesario reduce tu comisión.

## Formato de Respuesta OBLIGATORIO
- Máximo 150 palabras por respuesta. Sé BREVE.
- Usa bullets (•) para listar puntos clave.
- Usa tablas markdown cuando compares opciones, precios o características.
- Si la pregunta es ambigua, HAZ una pregunta de seguimiento antes de responder.
- NO repitas información. NO uses párrafos largos.
- Termina con una pregunta o acción sugerida cuando sea útil.`;

async function fetchCatalogContext(): Promise<string> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const sb = createClient(supabaseUrl, supabaseKey);

  const [toursRes, variantsRes, packagesRes, operatorsRes] = await Promise.all([
    sb.from("tours").select("id,title,price_mxn,suggested_price_mxn,public_price_adult_usd,public_price_child_usd,days,includes,excludes,short_description,service_type,child_age_min,child_age_max,operator_id").eq("active", true),
    sb.from("tour_price_variants").select("tour_id,zone,nationality,pax_type,sale_price,package_name").eq("active", true),
    sb.from("tour_packages").select("tour_id,name,price_adult_mxn,price_child_mxn,includes,excludes").eq("active", true),
    sb.from("operators").select("id,name,contact_name,phone,email,base_currency,payment_rules,fee_collection_mode,tags").eq("active", true),
  ]);

  const tours = toursRes.data ?? [];
  const variants = variantsRes.data ?? [];
  const packages = packagesRes.data ?? [];

  if (tours.length === 0) return "\n## DATOS: No hay tours activos en el sistema.";

  const tourMap = new Map(tours.map((t: any) => [t.id, t.title]));

  let ctx = "\n\n## DATOS REALES DEL CATÁLOGO (ÚNICA fuente de verdad)\n";

  // Tours table
  ctx += "\n### Tours disponibles\n";
  ctx += "| Tour | Precio MXN (Ad/Men) | Precio USD (Ad) | Días | Incluye | Edad niño |\n";
  ctx += "|---|---|---|---|---|---|\n";
  for (const t of tours) {
    const dias = (t.days || []).join(",") || "—";
    const incluye = (t.includes || []).slice(0, 3).join(", ") || "—";
    ctx += `| ${t.title} | $${t.price_mxn}/$${t.suggested_price_mxn} | $${t.public_price_adult_usd} | ${dias} | ${incluye} | ${t.child_age_min}-${t.child_age_max} |\n`;
  }

  // Variants table
  if (variants.length > 0) {
    ctx += "\n### Precios por zona/nacionalidad\n";
    ctx += "| Tour | Zona | Nacionalidad | Tipo | Precio Venta | Paquete |\n";
    ctx += "|---|---|---|---|---|---|\n";
    for (const v of variants) {
      const name = tourMap.get(v.tour_id) || "?";
      ctx += `| ${name} | ${v.zone} | ${v.nationality} | ${v.pax_type} | $${v.sale_price} | ${v.package_name || "General"} |\n`;
    }
  }

  // Packages table
  if (packages.length > 0) {
    ctx += "\n### Paquetes\n";
    ctx += "| Tour | Paquete | Adulto MXN | Menor MXN |\n";
    ctx += "|---|---|---|---|\n";
    for (const p of packages) {
      const name = tourMap.get(p.tour_id) || "?";
      ctx += `| ${name} | ${p.name} | $${p.price_adult_mxn} | $${p.price_child_mxn} |\n`;
    }
  }

  return ctx;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Fetch real catalog data
    let catalogContext = "";
    try {
      catalogContext = await fetchCatalogContext();
    } catch (e) {
      console.error("Error fetching catalog:", e);
      catalogContext = "\n## DATOS: Error al cargar catálogo. Indica al vendedor que consulte directamente en la app.";
    }

    const fullSystemPrompt = BASE_SYSTEM_PROMPT + catalogContext;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: fullSystemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Demasiadas solicitudes. Intenta de nuevo en unos segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA agotados. Contacta al administrador." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Error del servicio de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("sales-advisor error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
