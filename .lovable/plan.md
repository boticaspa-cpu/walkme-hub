

# Intercambiar POS y Tours en la barra inferior

Cambiar el orden en `src/components/layout/BottomNav.tsx`: donde está "POS" poner "Tours" y viceversa (Tours pasa a la barra principal, POS va al drawer "Más").

### Cambio en `primaryItems`
```ts
const primaryItems = [
  { title: "Inicio", url: "/dashboard", icon: LayoutDashboard },
  { title: "Tours", url: "/tours", icon: Map },
  { title: "Reservas", url: "/reservas", icon: FolderOpen },
  { title: "Cotizar", url: "/cotizaciones", icon: FileText },
];
```

### Cambio en `adminMore` y `sellerMore`
- Quitar "Tours" de ambas listas
- Agregar "POS" (`{ title: "POS", url: "/pos", icon: ShoppingCart }`) al inicio de ambas listas

**Archivo:** `src/components/layout/BottomNav.tsx`

