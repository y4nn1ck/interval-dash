import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import ErrorBoundary from "@/components/ErrorBoundary";
import Dashboard from "./pages/Dashboard";
import PowerCompar from "./pages/PowerCompar";
import FitAnalyzer from "./pages/FitAnalyzer";

import TrainingCalendar from "./pages/TrainingCalendar";
import RaceResults from "./pages/RaceResults";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ErrorBoundary>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <SidebarProvider>
              <div className="min-h-screen flex w-full">
                <AppSidebar />
                <SidebarInset>
                  <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4">
                    <SidebarTrigger className="-ml-1" />
                    <ThemeToggle />
                  </header>
                  <main className="flex-1">
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/power-compar" element={<PowerCompar />} />
                      <Route path="/fit-analyzer" element={<FitAnalyzer />} />
                      
                      <Route path="/training-calendar" element={<TrainingCalendar />} />
                      <Route path="/race-results" element={<RaceResults />} />
                      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </main>
                </SidebarInset>
              </div>
            </SidebarProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </QueryClientProvider>
);

export default App;

