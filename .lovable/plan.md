

# Filtrar tours por categoría Xcaret

## Cambio

En `src/pages/PaquetesXcaret.tsx`, modificar la query de tours para:

1. Primero obtener el ID de la categoría cuyo nombre contiene "xcaret" (case-insensitive via `ilike`)
2. Filtrar tours por ese `category_id`

```typescript
// 1. Fetch Xcaret category
const { data: xcaretCategories = [] } = useQuery({
  queryKey: ["xcaret-categories"],
  queryFn: async () => {
    const { data } = await supabase
      .from("categories")
      .select("id")
      .ilike("name", "%xcaret%");
    return data ?? [];
  },
});

// 2. Filter tours by category IDs
const xcaretCatIds = xcaretCategories.map(c => c.id);

const { data: tours = [] } = useQuery({
  queryKey: ["tours-for-promos", xcaretCatIds],
  queryFn: async () => {
    const { data } = await supabase
      .from("tours")
      .select("id, title, public_price_adult_usd, active")
      .eq("active", true)
      .in("category_id", xcaretCatIds)
      .order("title");
    return data ?? [];
  },
  enabled: xcaretCatIds.length > 0,
});
```

## Archivo
- `src/pages/PaquetesXcaret.tsx` — reemplazar la query de tours (líneas 71-82) con las dos queries anteriores

