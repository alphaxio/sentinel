import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { store } from "@/store/store";
import { MainLayout } from "@/components/layout/MainLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Dashboard from "@/pages/Dashboard";
import Assets from "@/pages/Assets";
import AssetDetail from "@/pages/AssetDetail";
import Threats from "@/pages/Threats";
import ThreatDetail from "@/pages/ThreatDetail";
import Findings from "@/pages/Findings";
import FindingDetail from "@/pages/FindingDetail";
import Policies from "@/pages/Policies";
import Compliance from "@/pages/Compliance";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import Login from "@/pages/Login";
import RiskAcceptances from "@/pages/RiskAcceptances";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<Login />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/assets" element={<Assets />} />
                <Route path="/assets/:id" element={<AssetDetail />} />
                <Route path="/threats" element={<Threats />} />
                <Route path="/threats/:id" element={<ThreatDetail />} />
                <Route path="/findings" element={<Findings />} />
                <Route path="/findings/:id" element={<FindingDetail />} />
                <Route path="/policies" element={<Policies />} />
                <Route path="/compliance" element={<Compliance />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/risk-acceptances" element={<RiskAcceptances />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </Provider>
);

export default App;
