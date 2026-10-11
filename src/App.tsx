import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/auth";
import { AppLayout } from "@/components/AppLayout";
import { PageLoader } from "@/components/PageLoader";
import Index from "@/pages/Index";
import Login from "@/pages/Login";
import PasswordRecovery from "@/pages/PasswordRecovery";
import Dashboard from "@/pages/Dashboard";
import Tickets from "@/pages/Tickets";
import NewTicket from "@/pages/NewTicket";
import TicketDetail from "@/pages/TicketDetail";
import Profile from "@/pages/Profile";
import AdminAddresses from "@/pages/admin/Addresses";
import AdminMembers from "@/pages/admin/Members";
import AdminSettings from "@/pages/admin/Settings";
import NotFound from "@/pages/NotFound";
import Setup from "@/pages/Setup";
import { isSupabaseConfigured } from "@/integrations/supabase/client";

const queryClient = new QueryClient();

function CenteredLoader() {
  return (
    <div className="grid min-h-screen place-items-center bg-background">
      <PageLoader />
    </div>
  );
}

function RequireAuth() {
  const { session, loading, recoveryPending } = useAuth();
  if (loading) return <CenteredLoader />;
  if (!session) return <Navigate to="/login" replace />;
  if (recoveryPending) return <Navigate to="/nouveau-mot-de-passe" replace />;
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}

function RequireAdmin({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  if (!profile || profile.role !== "admin") {
    return <Navigate to="/tableau-de-bord" replace />;
  }
  return <>{children}</>;
}

const App = () => !isSupabaseConfigured ? <Setup /> : (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner position="top-center" richColors />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/mot-de-passe-oublie" element={<PasswordRecovery key="request" />} />
            <Route path="/nouveau-mot-de-passe" element={<PasswordRecovery key="reset" reset />} />
            <Route element={<RequireAuth />}>
              <Route path="/tableau-de-bord" element={<Dashboard />} />
              <Route path="/billets" element={<Tickets />} />
              <Route path="/billets/nouveau" element={<NewTicket />} />
              <Route path="/billets/:id" element={<TicketDetail />} />
              <Route path="/profil" element={<Profile />} />
              <Route
                path="/admin/adresses"
                element={
                  <RequireAdmin>
                    <AdminAddresses />
                  </RequireAdmin>
                }
              />
              <Route
                path="/admin/membres"
                element={
                  <RequireAdmin>
                    <AdminMembers />
                  </RequireAdmin>
                }
              />
              <Route
                path="/admin/parametres"
                element={
                  <RequireAdmin>
                    <AdminSettings />
                  </RequireAdmin>
                }
              />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
