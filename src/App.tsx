// synced
import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { AdminRoute } from "@/components/layout/AdminRoute";
import { Loader2 } from "lucide-react";

// Login is eager — it's the entry point for unauthenticated users
import Login from "./pages/Login";

// All other pages are lazy-loaded to keep the initial bundle small
const CotizacionPDF = lazy(() => import("./pages/CotizacionPDF"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Leads = lazy(() => import("./pages/Leads"));
const Clientes = lazy(() => import("./pages/Clientes"));
const Tours = lazy(() => import("./pages/Tours"));
const Operadores = lazy(() => import("./pages/Operadores"));
const Categorias = lazy(() => import("./pages/Categorias"));
const Destinos = lazy(() => import("./pages/Destinos"));
const Cotizaciones = lazy(() => import("./pages/Cotizaciones"));
const Reservas = lazy(() => import("./pages/Reservas"));
const Calendario = lazy(() => import("./pages/Calendario"));
const POS = lazy(() => import("./pages/POS"));
const CierreDiario = lazy(() => import("./pages/CierreDiario"));
const Comisiones = lazy(() => import("./pages/Comisiones"));
const CuentasPorPagar = lazy(() => import("./pages/CuentasPorPagar"));
const Reportes = lazy(() => import("./pages/Reportes"));
const Configuracion = lazy(() => import("./pages/Configuracion"));
const Gastos = lazy(() => import("./pages/Gastos"));
const PaquetesXcaret = lazy(() => import("./pages/PaquetesXcaret"));
const Promociones = lazy(() => import("./pages/Promociones"));
const ToursTemporadaAlta = lazy(() => import("./pages/ToursTemporadaAlta"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="flex min-h-[60vh] items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/cotizaciones/:id/pdf" element={<CotizacionPDF />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/leads" element={<Leads />} />
                <Route path="/clientes" element={<Clientes />} />
                <Route path="/tours" element={<Tours />} />
                <Route path="/operadores" element={<Operadores />} />
                <Route path="/categorias" element={<Categorias />} />
                <Route path="/destinos" element={<Destinos />} />
                <Route path="/paquetes-xcaret" element={<PaquetesXcaret />} />
                <Route path="/promociones" element={<Promociones />} />
                <Route path="/cotizaciones" element={<Cotizaciones />} />
                <Route path="/reservas" element={<Reservas />} />
                <Route path="/calendario" element={<Calendario />} />
                <Route path="/pos" element={<POS />} />
                <Route path="/cierre-diario" element={<CierreDiario />} />
                <Route path="/comisiones" element={<Comisiones />} />
                <Route element={<AdminRoute />}>
                  <Route path="/tours-temporada-alta" element={<ToursTemporadaAlta />} />
                  <Route path="/cuentas-por-pagar" element={<CuentasPorPagar />} />
                  <Route path="/reportes" element={<Reportes />} />
                  <Route path="/configuracion" element={<Configuracion />} />
                  <Route path="/gastos" element={<Gastos />} />
                </Route>
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
