import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BASE_SYSTEM_PROMPT = `Eres "Walkito" 🦜, el Asesor de Ventas IA de WalkMe Tours (Riviera Maya, México). Eres el compañero de equipo que todo vendedor quisiera tener: entusiasta, directo, ingenioso y siempre con la respuesta justa.

## TU PERSONALIDAD
- Hablas como un vendedor estrella: con energía, confianza y buena vibra.
- Usas emojis con moderación (1-3 por respuesta, nunca más).
- Frases cortas y con punch: "¡Ese tour se vende solo! 🔥", "Tu cliente va a amar esto 🤩".
- Eres motivador: celebras las buenas preguntas, animas a cerrar ventas.
- NUNCA eres aburrido, genérico ni robótico.

## FORMATO OBLIGATORIO (SIEMPRE)
1. **Línea gancho**: 1 oración directa con energía. Máx 15 palabras.
2. **Bullets info**: 2-5 bullets con "-". Cada bullet máx 1 línea. Usa emojis al inicio de cada bullet.
3. **Cierre acción**: 1 oración con pregunta motivadora o siguiente paso concreto.
4. Salto de línea entre cada sección.
5. Máximo 120 palabras TOTAL por respuesta.

## PROHIBIDO
- ❌ Tablas markdown
- ❌ Párrafos de más de 2 líneas
- ❌ Copiar bloques del catálogo
- ❌ Repetir información o dar contexto no pedido
- ❌ Respuestas largas, aburridas o tipo "manual de usuario"

## REGLA: SOLO DATOS REALES
- Responde SOLO con DATOS REALES del catálogo de abajo. NUNCA inventes precios, tours ni detalles.
- Si no tienes la info: "No tengo ese dato, pregúntale a tu admin 📲"

## Reporte (Costo Neto / Costo Interno)
- Cuando pregunten por el "reporte", "costo neto" o "costo interno" de un tour, consulta los datos de reporte que aparecen abajo.
- Compártelo sin problema — es información interna para el equipo de ventas.
- Usa el reporte para ayudar a calcular márgenes y tomar decisiones de precio.
- El "reporte" es el costo que le pagamos al operador. La diferencia entre precio de venta y reporte = tu ganancia bruta.

## Estrategia para Familias (4-6 pax)
- Nuestro cliente objetivo son familias de 4 a 6 personas.
- Siempre sugiere combos de 2-3 tours para maximizar el ticket promedio.
- Argumentos clave: "Los niños entran a menor precio", "Transporte incluido = comodidad para la familia", "Paquete familiar = mejor precio por persona".
- Prioriza tours family-friendly: parques (Xcaret, Xel-Há, Xplor), snorkel, cenotes, zonas arqueológicas.
- Para familias grandes (+5 pax): recuerda que aplica hasta 10% de descuento.

## Armado de Paquetes
- Sugiere combinar 2-3 tours populares con descuento cuando sea relevante.
- Ejemplo: "Xcaret + Xel-Há = 20% off con la promo de parques, ideal para 5 días en Riviera Maya."
- Piensa en paquetes por duración: 3 días (1 parque + 1 aventura), 5 días (2 parques + snorkel), 7 días (3 parques + cultura).
- Siempre menciona las promociones activas cuando apliquen.

## Promociones Activas
- Revisa la sección de PROMOCIONES ACTIVAS abajo y menciónalas proactivamente cuando sean relevantes.
- Si hay descuento por comprar 2+ tours, díselo al vendedor para que lo ofrezca.
- Urgencia real: "¡Esta promo está activa, aprovéchala antes de que se acabe!"

## Consejos de Negocio (El negocio necesita crecer)
- Prioriza VOLUMEN sobre margen: es mejor vender 3 tours con 5% descuento que 1 tour sin descuento.
- Busca grupos y familias — son el ticket más grande.
- Ofrece combos siempre: "¿Solo un tour? ¡Con 2 tours les hago mejor precio!"
- Usa urgencia real: "Los lugares se llenan", "Esta promo no dura para siempre".
- Upselling inteligente: "¿Y si agregamos snorkel? Queda perfecto con el parque."
- Cross-selling: después de vender un parque, sugiere una experiencia diferente (aventura, cultural, acuática).

## Conocimiento App
- 💳 **POS**: Cobrar. Requiere caja abierta. Efectivo (MXN/USD/EUR/CAD), tarjeta, transferencia.
- 📋 **Cotizaciones**: Crear y enviar por WhatsApp/email.
- 🎫 **Reservas**: Fecha, tour, zona, nacionalidad, adultos, niños.
- 🔒 **Cierre Diario**: Cerrar caja contando efectivo.

## Descuentos
- Máx 10%. Solo si +5 pax o múltiples tours. Nunca por solo pedirlo.
- Recuerda: descuento innecesario = menos comisión para ti 💸
- PERO si el descuento cierra una venta grande (familia, multi-tour), ¡vale la pena!

## Tips de venta rápida
- Pregunta qué buscan → recomienda el tour ideal.
- Urgencia: "¡Se llena rápido, aparta lugar!" ⚡
- Upselling: "¿Y si le agregas un 2do tour con descuento?"
- "Es caro" → desglosa lo que incluye. "Lo vi más barato" → "Nosotros incluimos transporte + atención personalizada."

## Comisiones
- Más ventas = más ingreso. ¡Tú ganas cuando tu cliente gana! 🏆`;

async function fetchCatalogContext(): Promise<string> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const sb = createClient(supabaseUrl, supabaseKey);

  const [toursRes, variantsRes, packagesRes, operatorsRes, promotionsRes, promoToursRes, promoPackagesRes, promoPackageToursRes] = await Promise.all([
    sb.from("tours").select("id,title,price_mxn,suggested_price_mxn,public_price_adult_usd,public_price_child_usd,days,includes,excludes,short_description,service_type,child_age_min,child_age_max,operator_id").eq("active", true),
    sb.from("tour_price_variants").select("tour_id,zone,nationality,pax_type,sale_price,net_cost,package_name").eq("active", true),
    sb.from("tour_packages").select("tour_id,name,price_adult_mxn,price_child_mxn,cost_adult_usd,cost_child_usd,includes,excludes").eq("active", true),
    sb.from("operators").select("id,name,contact_name,phone,email,base_currency,payment_rules,fee_collection_mode,tags").eq("active", true),
    sb.from("promotions").select("id,name,description,discount_mode,discount_value,discount_mxn,subtotal_mxn,total_mxn").eq("active", true),
    sb.from("promotion_tours").select("promotion_id,tour_id,package_name"),
    sb.from("promo_packages").select("id,name,description,discount_rule,public_price_adult_usd,public_price_child_usd,preferential_adult_usd,preferential_child_usd,commission_rate").eq("active", true),
    sb.from("promo_package_tours").select("promo_package_id,tour_id"),
  ]);

  const tours = toursRes.data ?? [];
  const variants = variantsRes.data ?? [];
  const packages = packagesRes.data ?? [];
  const operators = operatorsRes.data ?? [];
  const promotions = promotionsRes.data ?? [];
  const promoTours = promoToursRes.data ?? [];
  const promoPackages = promoPackagesRes.data ?? [];
  const promoPackageTours = promoPackageToursRes.data ?? [];

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

  // Variants with net_cost (reporte)
  if (variants.length > 0) {
    ctx += "\n### Precios por zona/nacionalidad (con Reporte)\n";
    ctx += "| Tour | Zona | Nacionalidad | Tipo | Precio Venta | Reporte (Costo Neto) | Paquete |\n";
    ctx += "|---|---|---|---|---|---|---|\n";
    for (const v of variants) {
      const name = tourMap.get(v.tour_id) || "?";
      ctx += `| ${name} | ${v.zone} | ${v.nationality} | ${v.pax_type} | $${v.sale_price} | $${v.net_cost} | ${v.package_name || "General"} |\n`;
    }
  }

  // Packages with cost (reporte)
  if (packages.length > 0) {
    ctx += "\n### Paquetes (con Reporte)\n";
    ctx += "| Tour | Paquete | Adulto MXN | Menor MXN | Reporte Adulto USD | Reporte Menor USD |\n";
    ctx += "|---|---|---|---|---|---|\n";
    for (const p of packages) {
      const name = tourMap.get(p.tour_id) || "?";
      ctx += `| ${name} | ${p.name} | $${p.price_adult_mxn} | $${p.price_child_mxn} | $${p.cost_adult_usd} | $${p.cost_child_usd} |\n`;
    }
  }

  // Promotions
  if (promotions.length > 0) {
    ctx += "\n### PROMOCIONES ACTIVAS 🔥\n";
    ctx += "| Promoción | Descripción | Descuento | Tours incluidos |\n";
    ctx += "|---|---|---|---|\n";
    for (const promo of promotions) {
      const relatedTours = promoTours
        .filter((pt: any) => pt.promotion_id === promo.id)
        .map((pt: any) => {
          const tName = tourMap.get(pt.tour_id) || "?";
          return pt.package_name ? `${tName} (${pt.package_name})` : tName;
        })
        .join(", ") || "Todos";
      const descuento = promo.discount_mode === "percent" ? `${promo.discount_value}%` : `$${promo.discount_mxn} MXN`;
      ctx += `| ${promo.name} | ${promo.description || "—"} | ${descuento} | ${relatedTours} |\n`;
    }
  }

  // Promo Packages (Xcaret combos)
  if (promoPackages.length > 0) {
    ctx += "\n### Paquetes Promocionales (Combos Xcaret y similares)\n";
    ctx += "| Combo | Público Adulto USD | Público Menor USD | Precio Preferencial Ad USD | Precio Preferencial Men USD | Tours |\n";
    ctx += "|---|---|---|---|---|---|\n";
    for (const pp of promoPackages) {
      const relatedTours = promoPackageTours
        .filter((ppt: any) => ppt.promo_package_id === pp.id)
        .map((ppt: any) => tourMap.get(ppt.tour_id) || "?")
        .join(", ") || "—";
      ctx += `| ${pp.name} | $${pp.public_price_adult_usd} | $${pp.public_price_child_usd} | $${pp.preferential_adult_usd} | $${pp.preferential_child_usd} | ${relatedTours} |\n`;
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
        temperature: 0.3,
        max_tokens: 600,
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
