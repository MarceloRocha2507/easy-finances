import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import { LoadingScreen } from "@/components/ui/loading-screen";

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
import Responsaveis from "./pages/Responsaveis";

// Importar páginas com lazy
import { lazy, Suspense } from "react";
const MetasPage = lazy(() => import("./pages/Metas"));
const InvestimentosPage = lazy(() => import("./pages/Investimentos"));
const FaturasPage = lazy(() => import("./pages/cartoes/Faturas"));
const ParcelamentosPage = lazy(() => import("./pages/cartoes/Parcelamentos"));
const LimitesPage = lazy(() => import("./pages/cartoes/Limites"));
const RelatorioCategorias = lazy(() => import("./pages/reports/RelatorioCategorias"));
const Exportacoes = lazy(() => import("./pages/reports/Exportacoes"));
const PreferenciasPage = lazy(() => import("./pages/profile/Preferencias"));
const SegurancaPage = lazy(() => import("./pages/profile/Seguranca"));
const RecorrentesPage = lazy(() => import("./pages/transactions/Recorrentes"));
const ImportarPage = lazy(() => import("./pages/transactions/Importar"));

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
              path="/transactions/recorrentes"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<LoadingScreen />}>
                    <RecorrentesPage />
                  </Suspense>
                </ProtectedRoute>
              }
            />

            <Route
              path="/transactions/importar"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<LoadingScreen />}>
                    <ImportarPage />
                  </Suspense>
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
              path="/cartoes/faturas"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<LoadingScreen />}>
                    <FaturasPage />
                  </Suspense>
                </ProtectedRoute>
              }
            />

            <Route
              path="/cartoes/parcelamentos"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<LoadingScreen />}>
                    <ParcelamentosPage />
                  </Suspense>
                </ProtectedRoute>
              }
            />

            <Route
              path="/cartoes/responsaveis"
              element={
                <ProtectedRoute>
                  <Responsaveis />
                </ProtectedRoute>
              }
            />

            <Route
              path="/cartoes/limites"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<LoadingScreen />}>
                    <LimitesPage />
                  </Suspense>
                </ProtectedRoute>
              }
            />

            {/* Redirect antigo /responsaveis para novo caminho */}
            <Route path="/responsaveis" element={<Navigate to="/cartoes/responsaveis" replace />} />

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
                  <Suspense fallback={<LoadingScreen />}>
                    <MetasPage />
                  </Suspense>
                </ProtectedRoute>
              }
            />

            <Route
              path="/economia/investimentos"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<LoadingScreen />}>
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
              path="/reports/categorias"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<LoadingScreen />}>
                    <RelatorioCategorias />
                  </Suspense>
                </ProtectedRoute>
              }
            />

            <Route
              path="/reports/exportar"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<LoadingScreen />}>
                    <Exportacoes />
                  </Suspense>
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
              path="/profile/preferencias"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<LoadingScreen />}>
                    <PreferenciasPage />
                  </Suspense>
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile/seguranca"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<LoadingScreen />}>
                    <SegurancaPage />
                  </Suspense>
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