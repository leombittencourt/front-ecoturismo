import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useConfiguracoes } from "@/hooks/useConfiguracoes";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import Index from "@/pages/Index";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Atrativos from "@/pages/Atrativos";
import AtrativoDetalhe from "@/pages/AtrativoDetalhe";
import AtrativosPublicos from "@/pages/AtrativosPublicos";
import AtrativoDestino from "@/pages/AtrativoDestino";
import Reservar from "@/pages/Reservar";
import TicketPublico from "@/pages/TicketPublico";
import Analytics from "@/pages/Analytics";
import Relatorios from "@/pages/Relatorios";
import Balneario from "@/pages/Balneario";
import Admin from "@/pages/Admin";
import Quiosques from "@/pages/Quiosques";
import Parametros from "@/pages/Parametros";
import Install from "@/pages/Install";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ThemeColorApplier() {
  const { configs, loading } = useConfiguracoes();
  useEffect(() => {
    if (loading) return;
    document.documentElement.style.setProperty('--primary', configs.cor_primaria);
    document.documentElement.style.setProperty('--secondary', configs.cor_secundaria);
    document.documentElement.style.setProperty('--accent', configs.cor_accent);
    document.documentElement.style.setProperty('--sidebar-background', configs.cor_sidebar_bg);
    document.documentElement.style.setProperty('--success', configs.cor_sucesso);
    document.documentElement.style.setProperty('--warning', configs.cor_warning);
  }, [configs.cor_primaria, configs.cor_secundaria, configs.cor_accent, configs.cor_sidebar_bg, configs.cor_sucesso, configs.cor_warning, loading]);
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <ThemeColorApplier />
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/atrativos" element={<AtrativosPublicos />} />
              <Route path="/atrativos/:slug" element={<AtrativoDestino />} />
              <Route path="/reservar" element={<Reservar />} />
              <Route path="/ticket/:token" element={<TicketPublico />} />
              <Route path="/login" element={<Login />} />
              <Route path="/install" element={<Install />} />

              {/* Protected routes */}
              <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/gestao/atrativos" element={<Atrativos />} />
                <Route path="/gestao/atrativos/:id" element={<AtrativoDetalhe />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/relatorios" element={<Relatorios />} />
                <Route path="/quiosques" element={<Quiosques />} />
                <Route path="/balneario" element={<ProtectedRoute roles={['balneario', 'admin']}><Balneario /></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute roles={['admin']}><Admin /></ProtectedRoute>} />
                <Route path="/parametros" element={<ProtectedRoute roles={['admin', 'prefeitura']}><Parametros /></ProtectedRoute>} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
