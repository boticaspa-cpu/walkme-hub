

# Plan: Agregar selector de idioma en SendQuoteDialog

## Cambio

### `src/components/cotizaciones/SendQuoteDialog.tsx`
- Agregar estado `lang` (`"es" | "en"`, default `"es"`)
- Agregar el mismo toggle de idioma (🇲🇽 Español / 🇺🇸 English) que ya existe en `SendConfirmationDialog`
- Adaptar `buildMessage()` para que genere el texto en inglés cuando `lang === "en"`
- Actualizar `handleEmail` para usar subject localizado

| Archivo | Cambio |
|---|---|
| `src/components/cotizaciones/SendQuoteDialog.tsx` | Toggle idioma + mensaje bilingüe |

