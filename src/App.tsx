import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";

import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Categories from "./pages/Categories";
import Reports from "./pages/Reports";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import Cartoes from "./pages/Cartoes";
import Economia from "./pages/Economia";
import DespesasCartao from "./pages/DespesasCartao";
import Admin from "./pages/Admin";
import Notificacoes from "./pages/Notificacoes";
import ConfiguracoesNotificacoes from "./pages/ConfiguracoesNotificacoes";

// Importar Metas como lazy para evitar conflito de case
import { lazy, Suspense } from "react";
const MetasPage = lazy(() => import("./pages/Metas"));
const InvestimentosPage = lazy(() => import("./pages/Investimentos"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/auth" element={<Auth />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/transactions"
              element={
                <ProtectedRoute>
                  <Transactions />
                </ProtectedRoute>
              }
            />

            <Route
              path="/categories"
              element={
                <ProtectedRoute>
                  <Categories />
                </ProtectedRoute>
              }
            />

            <Route
              path="/cartoes"
              element={
                <ProtectedRoute>
                  <Cartoes />
                </ProtectedRoute>
              }
            />

            <Route
              path="/cartoes/:id/despesas"
              element={
                <ProtectedRoute>
                  <DespesasCartao />
                </ProtectedRoute>
              }
            />

            <Route
              path="/economia"
              element={
                <ProtectedRoute>
                  <Economia />
                </ProtectedRoute>
              }
            />

            <Route
              path="/economia/metas"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<div>Carregando...</div>}>
                    <MetasPage />
                  </Suspense>
                </ProtectedRoute>
              }
            />

            <Route
              path="/economia/investimentos"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<div>Carregando...</div>}>
                    <InvestimentosPage />
                  </Suspense>
                </ProtectedRoute>
              }
            />

            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <Reports />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/notificacoes"
            element={
              <ProtectedRoute>
                <Notificacoes />
              </ProtectedRoute>
            }
          />

          <Route
            path="/configuracoes/notificacoes"
            element={
              <ProtectedRoute>
                <ConfiguracoesNotificacoes />
              </ProtectedRoute>
            }
          />

            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <Admin />
                </AdminRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;