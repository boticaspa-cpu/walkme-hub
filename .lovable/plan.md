

# Mejorar personalidad del Asesor de Ventas IA

## Qué se hará
Actualizar el system prompt del edge function `sales-advisor` para que el agente sea más creativo, simpático y use un formato ultra claro con bullets.

## Cambios

### Archivo: `supabase/functions/sales-advisor/index.ts`
Reescribir `BASE_SYSTEM_PROMPT` con estas mejoras:

1. **Personalidad**: Agregar instrucciones de tono — amigable, entusiasta, usa emojis con moderación, habla como un compañero de equipo motivador.
2. **Formato bullet obligatorio**: Reforzar que SIEMPRE use bullets (`-` o `•`), nunca párrafos largos. Máximo 2-3 líneas por bullet.
3. **Narrativa creativa**: Instrucciones para usar frases ingeniosas, analogías rápidas y lenguaje de vendedor carismático (ej: "¡Ese tour se vende solo! 🔥").
4. **Estructura fija por respuesta**:
   - Línea gancho (1 oración directa, con energía)
   - Bullets con la info clave (máx 3-4)
   - Cierre con acción o pregunta motivadora
5. **Prohibiciones claras**: Sin muros de texto, sin tablas, sin respuestas genéricas aburridas.

### Ejemplo del nuevo tono:
```
¡Xcaret es de los que más se venden! 🏝️

- 💰 Adulto: $2,800 MXN / Menor: $1,400 MXN
- ✅ Incluye: transporte + buffet + snorkel
- 📅 Sale: lunes, miércoles y viernes

👉 ¿Quieres que te arme una cotización rápida?
```

### Sin cambios en lógica
Solo se modifica el texto del prompt. No hay cambios en fetch de catálogo, streaming ni componente del chat.

