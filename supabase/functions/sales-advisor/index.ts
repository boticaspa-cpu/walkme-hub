import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BASE_SYSTEM_PROMPT = `Eres el Asesor de Ventas IA de WalkMe Tours (Riviera Maya, México). Ayudas a vendedores comisionistas a vender más.

## REGLAS DE FORMATO (OBLIGATORIAS)
1. Máximo 100 palabras por respuesta. Sé ULTRA breve.
2. Estructura SIEMPRE así:
   - **Línea 1**: Respuesta directa en 1 oración.
   - **Opciones** (si aplica): Máximo 3 bullets con "-". Una línea por bullet.
   - **Siguiente paso**: 1 oración con acción concreta o pregunta.
3. PROHIBIDO: tablas markdown, párrafos de más de 2 líneas, copiar bloques del catálogo.
4. PROHIBIDO: repetir información, usar relleno, dar contexto no solicitado.
5. Usa salto de línea entre cada sección.
6. Si no tienes la info, di: "No tengo esa info, consulta con tu admin."

## REGLA: SOLO DATOS REALES
- Responde SOLO con los DATOS REALES de abajo. NUNCA inventes.

## Conocimiento App
- **POS**: Cobrar. Requiere caja abierta. Efectivo (MXN/USD/EUR/CAD), tarjeta, transferencia.
- **Cotizaciones**: Crear y enviar por WhatsApp/email.
- **Reservas**: Fecha, tour, zona, nacionalidad, adultos, niños.
- **Cierre Diario**: Cerrar caja contando efectivo.

## Descuentos
- Máximo 10%. Solo si +5 pax o múltiples tours. Nunca por solo pedirlo.

## Venta rápida
- Pregunta qué buscan. Urgencia: "Se llena rápido". Upselling: 2do tour con descuento.
- "Es caro" → desglosa incluido. "Lo vi más barato" → "Incluimos transporte y atención."

## Comisiones
- Más ventas = más ingreso. Descuento innecesario = menos comisión.`;

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
  const operators = operatorsRes.data ?? [];

  if (tours.length === 0) return "\n## DATOS: No hay tours activos en el sistema.";

  const tourMap = new Map(tours.map((t: any) => [t.id, t.title]));
  const opMap = new Map(operators.map((o: any) => [o.id, o.name]));

  let ctx = "\n\n## DATOS REALES DEL CATÁLOGO (ÚNICA fuente de verdad)\n";

  // Tours table
  ctx += "\n### Tours disponibles\n";
  ctx += "| Tour | Operador | Precio MXN (Ad/Men) | Precio USD (Ad) | Días | Incluye | Edad niño |\n";
  ctx += "|---|---|---|---|---|---|---|\n";
  for (const t of tours) {
    const dias = (t.days || []).join(",") || "—";
    const incluye = (t.includes || []).slice(0, 3).join(", ") || "—";
    const op = opMap.get(t.operator_id) || "—";
    ctx += `| ${t.title} | ${op} | $${t.price_mxn}/$${t.suggested_price_mxn} | $${t.public_price_adult_usd} | ${dias} | ${incluye} | ${t.child_age_min}-${t.child_age_max} |\n`;
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

  // Operators table
  if (operators.length > 0) {
    ctx += "\n### Operadores (proveedores)\n";
    ctx += "| Operador | Contacto | Teléfono | Email | Moneda | Pago | Cobro fees | Tags |\n";
    ctx += "|---|---|---|---|---|---|---|---|\n";
    for (const o of operators) {
      const tags = (o.tags || []).join(", ") || "—";
      ctx += `| ${o.name} | ${o.contact_name || "—"} | ${o.phone || "—"} | ${o.email || "—"} | ${o.base_currency} | ${o.payment_rules} | ${o.fee_collection_mode} | ${tags} |\n`;
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
