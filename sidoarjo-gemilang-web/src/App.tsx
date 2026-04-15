import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/i18n";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import './App.css'

const queryClient = new QueryClient();

const App = () => {
  const [showLoader, setShowLoader] = useState(true);
  const [loaderClosing, setLoaderClosing] = useState(false);

  useEffect(() => {
    const startCloseTimer = window.setTimeout(() => {
      setLoaderClosing(true);
    }, 1800);

    const hideTimer = window.setTimeout(() => {
      setShowLoader(false);
    }, 2400);

    return () => {
      window.clearTimeout(startCloseTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  return (
    <LanguageProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>

          {showLoader && (
            <div className={`sidoarjo-loader ${loaderClosing ? "is-closing" : ""}`} role="status" aria-live="polite">
              <div className="sidoarjo-loader__backdrop" />
              <div className="sidoarjo-loader__content">
                <img src="/images/sidoarjo-logo.png" alt="Logo Kabupaten Sidoarjo" className="sidoarjo-loader__logo" />
                <p className="sidoarjo-loader__title">Portal Kabupaten Sidoarjo</p>
                <p className="sidoarjo-loader__subtitle">Memuat...</p>
                <div className="sidoarjo-loader__progress" aria-hidden="true">
                  <span className="sidoarjo-loader__progress-bar" />
                </div>
              </div>
            </div>
          )}
        </TooltipProvider>
      </QueryClientProvider>
    </LanguageProvider>
  );
};

export default App;
