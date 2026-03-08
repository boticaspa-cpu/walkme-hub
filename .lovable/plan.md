
Objetivo: que el Asesor IA responda claro, corto y fácil de leer (sin “párrafo continuo”), especialmente en móvil.

Diagnóstico (rápido):
- En `sales-advisor` el prompt exige tablas markdown y bullets con `•`.
- En `FloatingChatWidget` se usa `ReactMarkdown` sin plugins de tablas/saltos suaves, por eso las tablas salen como texto plano y la lectura se vuelve confusa.
- El prompt actual también mezcla demasiada guía general, y el modelo se extiende de más.

Plan de implementación:

1) Rediseñar formato obligatorio de respuesta (backend)
- Archivo: `supabase/functions/sales-advisor/index.ts`
- Cambiar reglas de salida para imponer una plantilla fija:
  - `Respuesta directa:` (1 línea)
  - `Opciones recomendadas:` (máx 3 bullets con `-`)
  - `Siguiente paso:` (1 línea)
- Prohibir explícitamente tablas markdown y párrafos largos.
- Exigir “solo lo que preguntó el usuario” (sin relleno).
- Limitar longitud (ej. 80–120 palabras) y máximo de bullets.

2) Endurecer parámetros del modelo para consistencia
- Archivo: `supabase/functions/sales-advisor/index.ts`
- Ajustar llamada al modelo con menor variabilidad (ej. `temperature` baja) y límite de tokens.
- Añadir regla de “no copiar bloques completos del catálogo”.

3) Mejorar render del chat para legibilidad móvil
- Archivo: `src/components/chat/FloatingChatWidget.tsx`
- Cambiar render del mensaje asistente a formato que preserve saltos de línea (`whitespace-pre-wrap`) o adaptar markdown para listas claras.
- Ajustar tipografía del bubble (line-height y tamaño) para evitar “bloque corrido”.

4) Normalización mínima de salida (failsafe)
- Archivo: `src/components/chat/FloatingChatWidget.tsx` (o helper local)
- Antes de pintar, normalizar texto:
  - convertir `•` a `-`
  - compactar espacios duplicados
  - asegurar salto entre secciones clave
- Esto protege UX aunque el modelo falle parcialmente en formato.

5) Validación funcional
- Probar con preguntas reales como:
  - “qué tour me da mejor comisión”
  - “qué operador maneja x tour”
  - “cómo cierro una venta en POS”
- Criterio de éxito:
  - respuesta en bloques, sin párrafo continuo
  - máximo 3 opciones
  - acción siguiente clara y breve

Archivos a tocar:
- `supabase/functions/sales-advisor/index.ts`
- `src/components/chat/FloatingChatWidget.tsx`
