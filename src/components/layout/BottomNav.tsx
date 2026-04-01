import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  FolderOpen,
  FileText,
  Menu,
  Users,
  Contact,
  Map,
  Building2,
  Tags,
  MapPin,
  BadgePercent,
  Sun,
  CalendarDays,
  ClipboardCheck,
  BarChart3,
  Settings,
  BadgeDollarSign,
  Receipt,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const primaryItems = [
  { title: "Inicio", url: "/dashboard", icon: LayoutDashboard },
  { title: "Tours", url: "/tours", icon: Map },
  { title: "Reservas", url: "/reservas", icon: FolderOpen },
  { title: "Cotizar", url: "/cotizaciones", icon: FileText },
];

const adminMore = [
  { title: "POS", url: "/pos", icon: ShoppingCart },
  { title: "Leads", url: "/leads", icon: Users },
  { title: "Clientes", url: "/clientes", icon: Contact },
  { title: "Operadores", url: "/operadores", icon: Building2 },
  { title: "Categorías", url: "/categorias", icon: Tags },
  { title: "Destinos", url: "/destinos", icon: MapPin },
  { title: "Tours Temp. Alta", url: "/tours-temporada-alta", icon: Sun },
  { title: "Paquetes Xcaret", url: "/paquetes-xcaret", icon: BadgePercent },
  { title: "Promociones", url: "/promociones", icon: Tags },
  { title: "Calendario", url: "/calendario", icon: CalendarDays },
  { title: "Cierre Diario", url: "/cierre-diario", icon: ClipboardCheck },
  { title: "Reportes", url: "/reportes", icon: BarChart3 },
  { title: "Gastos", url: "/gastos", icon: Receipt },
  { title: "Configuración", url: "/configuracion", icon: Settings },
];

const sellerMore = [
  { title: "POS", url: "/pos", icon: ShoppingCart },
  { title: "Leads", url: "/leads", icon: Users },
  { title: "Clientes", url: "/clientes", icon: Contact },
  { title: "Paquetes Xcaret", url: "/paquetes-xcaret", icon: BadgePercent },
  { title: "Promociones", url: "/promociones", icon: Tags },
  { title: "Calendario", url: "/calendario", icon: CalendarDays },
  { title: "Cierre Diario", url: "/cierre-diario", icon: ClipboardCheck },
  { title: "Mis Comisiones", url: "/comisiones", icon: BadgeDollarSign },
];

export function BottomNav() {
  const { role, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sheetOpen, setSheetOpen] = useState(false);

  const moreItems = role === "admin" ? adminMore : sellerMore;

  const isActive = (url: string) =>
    url === "/dashboard"
      ? location.pathname === "/dashboard"
      : location.pathname.startsWith(url);

  const handleNav = (url: string) => {
    navigate(url);
    setSheetOpen(false);
  };

  return (
    <>
      <nav className="fixed bottom-0 inset-x-0 z-50 flex sm:hidden h-16 items-center justify-around border-t border-border bg-card/95 backdrop-blur-sm safe-area-pb">
        {primaryItems.map((item) => {
          const active = isActive(item.url);
          return (
            <button
              key={item.url}
              onClick={() => navigate(item.url)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-muted-foreground transition-colors",
                active && "text-primary"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] leading-tight font-medium">{item.title}</span>
            </button>
          );
        })}
        <button
          onClick={() => setSheetOpen(true)}
          className={cn(
            "flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-muted-foreground transition-colors",
            sheetOpen && "text-primary"
          )}
        >
          <Menu className="h-5 w-5" />
          <span className="text-[10px] leading-tight font-medium">Más</span>
        </button>
      </nav>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="max-h-[70dvh] rounded-t-2xl px-2 pb-6">
          <SheetHeader className="px-4 pb-2">
            <SheetTitle>Menú</SheetTitle>
          </SheetHeader>
          <div className="overflow-y-auto space-y-1 px-2">
            {moreItems.map((item) => {
              const active = isActive(item.url);
              return (
                <button
                  key={item.url}
                  onClick={() => handleNav(item.url)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                    active
                      ? "bg-accent text-accent-foreground font-medium"
                      : "text-foreground hover:bg-accent/50"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span>{item.title}</span>
                </button>
              );
            })}
            <div className="my-2 border-t border-border" />
            <button
              onClick={async () => {
                setSheetOpen(false);
                await logout();
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
