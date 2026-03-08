import {
  LayoutDashboard,
  Users,
  Contact,
  Map,
  Building2,
  Tags,
  MapPin,
  FolderOpen,
  FileText,
  CalendarDays,
  ShoppingCart,
  ClipboardCheck,
  BarChart3,
  Settings,
  BadgeDollarSign,
  BadgePercent,
  Receipt,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import walkmeLogo from "@/assets/walkme-logo.png";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const adminNav = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Leads", url: "/leads", icon: Users },
  { title: "Clientes", url: "/clientes", icon: Contact },
  { title: "Tours", url: "/tours", icon: Map },
  { title: "Operadores", url: "/operadores", icon: Building2 },
  { title: "Categorías", url: "/categorias", icon: Tags },
  { title: "Destinos", url: "/destinos", icon: MapPin },
  { title: "Paquetes Xcaret", url: "/paquetes-xcaret", icon: BadgePercent },
  { title: "Promociones", url: "/promociones", icon: Tags },
  { title: "Cotizaciones", url: "/cotizaciones", icon: FileText },
  { title: "Reservas", url: "/reservas", icon: FolderOpen },
  { title: "Calendario", url: "/calendario", icon: CalendarDays },
  { title: "POS", url: "/pos", icon: ShoppingCart },
  { title: "Cierre Diario", url: "/cierre-diario", icon: ClipboardCheck },
  { title: "Reportes", url: "/reportes", icon: BarChart3 },
  { title: "Gastos", url: "/gastos", icon: Receipt },
  { title: "Configuración", url: "/configuracion", icon: Settings },
];

const sellerNav = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Leads", url: "/leads", icon: Users },
  { title: "Clientes", url: "/clientes", icon: Contact },
  { title: "Tours", url: "/tours", icon: Map },
  { title: "Paquetes Xcaret", url: "/paquetes-xcaret", icon: BadgePercent },
  { title: "Promociones", url: "/promociones", icon: Tags },
  { title: "Cotizaciones", url: "/cotizaciones", icon: FileText },
  { title: "Reservas", url: "/reservas", icon: FolderOpen },
  { title: "Calendario", url: "/calendario", icon: CalendarDays },
  { title: "POS", url: "/pos", icon: ShoppingCart },
  { title: "Cierre Diario", url: "/cierre-diario", icon: ClipboardCheck },
  { title: "Mis Comisiones", url: "/comisiones", icon: BadgeDollarSign },
];

export function AppSidebar() {
  const { user, logout, role } = useAuth();
  const handleLogout = async () => { await logout(); };
  const navItems = role === "admin" ? adminNav : sellerNav;

  return (
    <Sidebar collapsible="offcanvas" className="hidden sm:flex">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <img src={walkmeLogo} alt="Walkme Tours" className="h-9 w-9 rounded-lg object-cover" />
          <div className="flex flex-col">
           <span className="text-sm font-accent text-sidebar-primary tracking-wide">
              Walkme Tours
            </span>
            <span className="text-xs text-sidebar-foreground/60">Dashboard</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent className="scrollbar-thin">
        <SidebarGroup>
          <SidebarGroupLabel>Menú</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard"}
                      className="hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-2 rounded-lg p-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs">
                  {user?.full_name?.charAt(0) ?? "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-1 flex-col text-left">
                <span className="text-xs font-medium text-sidebar-accent-foreground">
                  {user?.full_name ?? "Usuario"}
                </span>
                <span className="text-[10px] capitalize text-sidebar-foreground/60">
                  {role}
                </span>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-sidebar-foreground/50" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-48">
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
