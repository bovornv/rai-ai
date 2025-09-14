import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import About from "./pages/About";
import Prices from "./pages/Prices";
import Outbreak from "./pages/Outbreak";
import Support from "./pages/Support";
import NotFound from "./pages/NotFound";
import Index from "./pages/Index";
import CounterPage from "./pages/CounterPage";
import TicketPrintPage from "./pages/TicketPrintPage";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="about" element={<About />} />
                <Route path="prices" element={<Prices />} />
                <Route path="outbreak" element={<Outbreak />} />
                <Route path="support" element={<Support />} />
                <Route path="*" element={<NotFound />} />
              </Route>
              <Route path="/rai-ai" element={<Index />} />
              <Route path="/counter" element={<CounterPage />} />
              <Route path="/tickets/:id/print" element={<TicketPrintPage />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
};

export default App;
