

# Buscar tours también por nombre de operador

## Cambio

**Archivo:** `src/pages/Tours.tsx` — línea 440

Actualmente el filtro de búsqueda solo compara contra `t.title`. Se ampliará para que también busque en el nombre del operador (`t.operators?.name`).

Cambiar:
```ts
if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
```

Por:
```ts
const q = search.toLowerCase();
if (search && !t.title.toLowerCase().includes(q) && !(t as any).operators?.name?.toLowerCase().includes(q)) return false;
```

También actualizar el placeholder del input de `"Buscar tour..."` a `"Buscar tour u operador..."` para que sea claro.

Un solo archivo, dos líneas modificadas.

