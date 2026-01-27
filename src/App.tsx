
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Atendimento from "./pages/Atendimento";
import Solicitacoes from "./pages/Solicitacoes";
import Conteudo from "./pages/Conteudo";
import Campanhas from "./pages/Campanhas";
import Monitoramento from "./pages/Monitoramento";
import Administracao from "./pages/Administracao";
import ReclamacoesDenuncias from "./pages/ReclamacoesDenuncias";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/atendimento" element={<Atendimento />} />
          <Route path="/solicitacoes" element={<Solicitacoes />} />
          <Route path="/conteudo" element={<Conteudo />} />
          <Route path="/campanhas" element={<Campanhas />} />
          <Route path="/monitoramento" element={<Monitoramento />} />
          <Route path="/administracao" element={<Administracao />} />
          <Route path="/reclamacoes-denuncias" element={<ReclamacoesDenuncias />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
