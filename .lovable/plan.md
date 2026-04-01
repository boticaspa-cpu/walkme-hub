

# Edición completa en Tours Temporada Alta

## Problema
La página ToursTemporadaAlta solo muestra tarjetas pero no tiene diálogo de edición. Al hacer click intenta navegar a `/tours?edit=...` que filtra por `season = 'regular'` y no encuentra el tour.

## Solución
La página de Tours.tsx tiene ~1700 líneas con toda la lógica de edición (formulario, paquetes, matriz de precios, imágenes, importación de sheets, etc.). En lugar de duplicar todo ese código, la solución es:

**Modificar `Tours.tsx` para que acepte un parámetro `season`** y pueda manejar ambos catálogos. La página de `ToursTemporadaAlta.tsx` simplemente renderizará `<Tours season="alta" />` o redirigirá a Tours con el contexto correcto.

### Enfoque concreto

1. **Refactorizar `Tours.tsx`** para recibir una prop opcional `season` (default `"regular"`):
   - El query filtra por la season recibida
   - El `handleSave` guarda con la season correcta
   - Se invalidan las queries correspondientes (`tours` o `tours-alta`)
   - Se oculta el botón "Duplicar para Temp. Alta" cuando `season === "alta"`
   - Se muestra badge "TEMP. ALTA" cuando aplica

2. **Simplificar `ToursTemporadaAlta.tsx`** a un wrapper:
   ```tsx
   import Tours from "./Tours";
   export default function ToursTemporadaAlta() {
     return <Tours season="alta" />;
   }
   ```

3. **Ajustes visuales**: Cuando `season="alta"`, el header muestra el icono Sol y título "Tours Temporada Alta", y no muestra el botón de crear tour nuevo ni duplicar.

### Resultado
- Edición completa: formulario, paquetes, matriz de precios, imágenes, importación — todo funciona igual
- Sin duplicación de código
- Los tours de temporada alta se pueden reservar y cotizar normalmente desde POS/Cotizaciones (ya son entidades independientes en la tabla)

### Archivos a modificar
- `src/pages/Tours.tsx` — agregar prop `season`, condicionar header/queries/save
- `src/pages/ToursTemporadaAlta.tsx` — reemplazar por wrapper simple

