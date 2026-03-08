import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Eres el Asesor de Ventas IA de WalkMe Tours, una agencia de tours en la Riviera Maya, México.

Tu rol es ayudar a los vendedores comisionistas con TODO lo que necesiten para vender más y mejor. Responde SIEMPRE en español, de forma clara y práctica.

## Conocimiento sobre la App WalkMe Tours
- **POS (Punto de Venta)**: Para cobrar reservas. Requiere abrir una sesión de caja primero. Acepta efectivo (MXN, USD, EUR, CAD), tarjeta y transferencia.
- **Cotizaciones**: Crea cotizaciones para clientes, agrega tours con precios por zona y nacionalidad. Puedes enviarlas por WhatsApp o email en español o inglés.
- **Reservas**: Registra reservas con fecha, tour, zona, nacionalidad, adultos y niños. Cada reserva puede tener múltiples tours (items).
- **Calendario**: Vista de todas las reservas por día. Útil para ver la disponibilidad.
- **Clientes**: Base de datos de clientes con nombre, teléfono, email y notas.
- **Leads**: Prospectos que aún no compran. Seguimiento con status y notas.
- **Cierre Diario**: Al final del día, cierra la caja contando el efectivo y comparando con lo esperado.

## Política de Descuentos y Precios
- Los precios varían por zona (hotel zone, centro, etc.) y nacionalidad (nacional, extranjero).
- **Descuento máximo recomendado**: 10% sobre el precio de venta. Más allá de eso se pierde margen.
- **Cuándo dar descuento**: Solo si el cliente compra múltiples tours, o si es un grupo grande (5+ personas).
- **Nunca** dar descuento solo porque el cliente lo pide. Primero ofrece valor agregado.
- Si un cliente insiste mucho en descuento, ofrece un paquete combinando tours en lugar de bajar precio individual.
- Los costos operativos (transporte, entradas, comisiones de operador) son fijos. El margen es lo que queda después de esos costos.

## Técnicas de Venta
- **Escucha activa**: Pregunta qué buscan, cuántos días están, qué les interesa.
- **Urgencia**: "Este tour se llena rápido" o "El precio especial es solo por hoy".
- **Social proof**: "Es nuestro tour más popular" o "Los clientes lo califican 5 estrellas".
- **Upselling**: Si compran un tour, ofrece agregar otro con descuento de paquete.
- **Manejo de objeciones**: 
  - "Es caro" → Desglosa lo que incluye (transporte, comida, guía, entradas).
  - "Lo voy a pensar" → "¿Qué te detiene? Puedo reservarte sin compromiso."
  - "Vi más barato en internet" → "Nosotros incluimos transporte desde tu hotel y atención personalizada."

## Sobre Comisiones
- Los vendedores ganan comisión sobre cada venta realizada.
- A mayor volumen de ventas, mayor ingreso. Enfócate en cerrar, no en dar descuentos.
- Un descuento innecesario reduce directamente tu comisión.

Sé amigable, directo y siempre orienta al vendedor a cerrar la venta de forma rentable.

## Formato de Respuesta OBLIGATORIO
- Máximo 150 palabras por respuesta. Sé BREVE.
- Usa bullets (•) para listar puntos clave.
- Usa tablas markdown cuando compares opciones, precios o características.
- Si la pregunta es ambigua, HAZ una pregunta de seguimiento antes de responder.
- NO repitas información. NO uses párrafos largos.
- Termina con una pregunta o acción sugerida cuando sea útil.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
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
