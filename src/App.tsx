import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import Login from "./pages/Login";
import CotizacionPDF from "./pages/CotizacionPDF";
import Dashboard from "./pages/Dashboard";
import Leads from "./pages/Leads";
import Clientes from "./pages/Clientes";
import Tours from "./pages/Tours";
import Operadores from "./pages/Operadores";
import Categorias from "./pages/Categorias";
import Destinos from "./pages/Destinos";
import Cotizaciones from "./pages/Cotizaciones";
import Reservas from "./pages/Reservas";
import Calendario from "./pages/Calendario";
import POS from "./pages/POS";
import CierreDiario from "./pages/CierreDiario";
import Comisiones from "./pages/Comisiones";
import Reportes from "./pages/Reportes";
import Configuracion from "./pages/Configuracion";
import Gastos from "./pages/Gastos";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
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
              <Route path="/cotizaciones" element={<Cotizaciones />} />
              <Route path="/reservas" element={<Reservas />} />
              <Route path="/calendario" element={<Calendario />} />
              <Route path="/pos" element={<POS />} />
              <Route path="/cierre-diario" element={<CierreDiario />} />
              <Route path="/comisiones" element={<Comisiones />} />
              <Route path="/reportes" element={<Reportes />} />
              <Route path="/configuracion" element={<Configuracion />} />
              <Route path="/gastos" element={<Gastos />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
