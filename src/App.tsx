import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { OverlayRoot } from "./components/overlays/OverlayRoot";
import { StrategyFullscreenPage } from "./components/pages/StrategyFullscreenPage";
import { TeamsPage } from "./components/pages/TeamsPage";
import { TeamDetailPage } from "./components/pages/TeamDetailPage";
import { CoachDashboard } from "./components/pages/CoachDashboard";
import { RoundPlannerPage } from "./components/pages/RoundPlannerPage";
import { ProtectedRoute } from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/overlay" element={<OverlayRoot />} />
          <Route path="/autostat/play" element={<StrategyFullscreenPage />} />
          
          {/* Team Management Routes */}
          <Route path="/teams" element={
            <ProtectedRoute>
              <TeamsPage />
            </ProtectedRoute>
          } />
          <Route path="/team/:teamId" element={
            <ProtectedRoute>
              <TeamDetailPage />
            </ProtectedRoute>
          } />
          <Route path="/coach/:teamId" element={
            <ProtectedRoute>
              <CoachDashboard />
            </ProtectedRoute>
          } />
          <Route path="/team/:teamId/planner" element={
            <ProtectedRoute>
              <RoundPlannerPage />
            </ProtectedRoute>
          } />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
