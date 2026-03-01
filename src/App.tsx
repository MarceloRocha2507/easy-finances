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

import { lazy, Suspense } from "react";

const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Transactions = lazy(() => import("./pages/Transactions"));
const Categories = lazy(() => import("./pages/Categories"));
const Reports = lazy(() => import("./pages/Reports"));
const Profile = lazy(() => import("./pages/Profile"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Cartoes = lazy(() => import("./pages/Cartoes"));
const Economia = lazy(() => import("./pages/Economia"));
const DespesasCartao = lazy(() => import("./pages/DespesasCartao"));
const Admin = lazy(() => import("./pages/Admin"));
const Notificacoes = lazy(() => import("./pages/Notificacoes"));
const ConfiguracoesNotificacoes = lazy(() => import("./pages/ConfiguracoesNotificacoes"));
const Responsaveis = lazy(() => import("./pages/Responsaveis"));
const MetasPage = lazy(() => import("./pages/Metas"));
const InvestimentosPage = lazy(() => import("./pages/Investimentos"));
const FaturasPage = lazy(() => import("./pages/cartoes/Faturas"));
const ParcelamentosPage = lazy(() => import("./pages/cartoes/Parcelamentos"));
const LimitesPage = lazy(() => import("./pages/cartoes/Limites"));
const AuditoriaPage = lazy(() => import("./pages/cartoes/Auditoria"));
const ImportarComprasPage = lazy(() => import("./pages/cartoes/ImportarCompras"));
const BancosPage = lazy(() => import("./pages/Bancos"));
const RelatorioCategorias = lazy(() => import("./pages/reports/RelatorioCategorias"));
const Exportacoes = lazy(() => import("./pages/reports/Exportacoes"));
const PreferenciasPage = lazy(() => import("./pages/profile/Preferencias"));
const SegurancaPage = lazy(() => import("./pages/profile/Seguranca"));
const ImportarPage = lazy(() => import("./pages/transactions/Importar"));
const DespesasFuturasPage = lazy(() => import("./pages/DespesasFuturas"));
const InstalarPage = lazy(() => import("./pages/Instalar"));
const AssistentePage = lazy(() => import("./pages/Assistente"));
const ChangelogPage = lazy(() => import("./pages/Changelog"));
const AssinaturasPage = lazy(() => import("./pages/Assinaturas"));
const SimuladorCompraPage = lazy(() => import("./pages/transactions/SimuladorCompra"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
        <BrowserRouter>
          <Suspense fallback={<LoadingScreen />}>
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
              path="/transactions/futuras"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<LoadingScreen />}>
                    <DespesasFuturasPage />
                  </Suspense>
                </ProtectedRoute>
              }
            />

            <Route
              path="/transactions/simulador"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<LoadingScreen />}>
                    <SimuladorCompraPage />
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
              path="/cartoes/bancos"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<LoadingScreen />}>
                    <BancosPage />
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

            <Route
              path="/cartoes/auditoria"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<LoadingScreen />}>
                    <AuditoriaPage />
                  </Suspense>
                </ProtectedRoute>
              }
            />

            <Route
              path="/cartoes/:id/importar"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<LoadingScreen />}>
                    <ImportarComprasPage />
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
              path="/assistente"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<LoadingScreen />}>
                    <AssistentePage />
                  </Suspense>
                </ProtectedRoute>
              }
            />

            <Route
              path="/assinaturas"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<LoadingScreen />}>
                    <AssinaturasPage />
                  </Suspense>
                </ProtectedRoute>
              }
            />

            <Route
              path="/changelog"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<LoadingScreen />}>
                    <ChangelogPage />
                  </Suspense>
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

            <Route
              path="/instalar"
              element={
                <Suspense fallback={<LoadingScreen />}>
                  <InstalarPage />
                </Suspense>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;