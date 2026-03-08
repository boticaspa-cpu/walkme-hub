

# Plan: Ajustar system prompt del Asesor IA para respuestas cortas y claras

## Cambio único

**`supabase/functions/sales-advisor/index.ts`** — Modificar el `SYSTEM_PROMPT` para instruir al modelo a:

- Responder **corto y directo** (máximo 3-5 líneas por punto)
- Usar **bullets** y **tablas comparativas** cuando aplique
- **Hacer preguntas de seguimiento** cuando la consulta sea ambigua (ej: "¿Te refieres a margen o a volumen?")
- Evitar párrafos largos y repetición

Se agrega al final del prompt una sección de formato obligatorio:

```
## Formato de Respuesta OBLIGATORIO
- Máximo 150 palabras por respuesta
- Usa bullets (•) para listar puntos clave
- Usa tablas markdown para comparaciones
- Si la pregunta es ambigua, HAZ una pregunta antes de responder
- NO repitas información. Sé directo.
- Termina con una pregunta o acción sugerida cuando sea útil
```

| Archivo | Cambio |
|---|---|
| `supabase/functions/sales-advisor/index.ts` | Actualizar SYSTEM_PROMPT con reglas de formato corto |

