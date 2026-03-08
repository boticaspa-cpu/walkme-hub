

# Bottom Navigation: Reemplazar sidebar lateral por barra inferior en móvil

## Estrategia

En móvil: ocultar el sidebar completamente y mostrar una **barra de navegación inferior fija** con 5 iconos principales + botón "Más" que abre un drawer con el resto de opciones. En desktop (≥768px): mantener el sidebar lateral tal como está.

## Items principales en bottom bar (móvil)

5 accesos directos visibles:
1. **Dashboard** (LayoutDashboard)
2. **POS** (ShoppingCart)
3. **Reservas** (FolderOpen)
4. **Cotizaciones** (FileText)
5. **Más** (Menu) → abre drawer con todos los demás enlaces + logout

## Archivos a crear/modificar

### 1. `src/components/layout/BottomNav.tsx` (nuevo)
- Barra fija en `bottom-0` con `z-50`, visible solo en `sm:hidden`
- 5 botones con icono + label pequeño, highlight en ruta activa
- Botón "Más" abre un `Sheet` (bottom drawer) con el resto de nav items en lista scrollable + opción cerrar sesión
- Usa `useAuth()` para role-aware nav items
- Usa `useLocation` para highlight activo

### 2. `src/components/layout/AppLayout.tsx`
- Importar `BottomNav`
- Agregar `<BottomNav />` dentro del layout
- Agregar `pb-16 sm:pb-0` al main para dejar espacio al bottom nav en móvil

### 3. `src/components/layout/AppSidebar.tsx`
- Cambiar de `collapsible="offcanvas"` a `collapsible="icon"` o agregar clase `hidden sm:flex` al `<Sidebar>` para ocultarlo en móvil
- Dado que el sidebar de shadcn usa offcanvas (overlay en móvil), lo más limpio es: en el Sidebar wrapper agregar `className="hidden md:flex"` para que no aparezca en móvil

### 4. `src/components/layout/Topbar.tsx`
- Ocultar el `SidebarTrigger` en móvil (`hidden sm:block`) ya que la navegación será por bottom bar
- Mostrar logo o título de la app en su lugar en móvil

### 5. `src/components/chat/FloatingChatWidget.tsx`
- Ajustar posición del botón flotante: en móvil subirlo por encima del bottom nav (`bottom-20 sm:bottom-6`)

```text
Mobile:                          Desktop:
┌──────────────────────┐        ┌────────┬─────────────────┐
│ Topbar (no hamburger)│        │Sidebar │ Topbar          │
├──────────────────────┤        │        ├─────────────────┤
│                      │        │        │                 │
│   Content Area       │        │  Nav   │  Content Area   │
│                      │        │  items │                 │
│                      │        │        │                 │
├──────────────────────┤        │        │                 │
│ 🏠  🛒  📁  📄  ⋯  │        │        │                 │
└──────────────────────┘        └────────┴─────────────────┘
```

