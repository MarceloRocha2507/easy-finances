import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import { HideValuesProvider } from "@/hooks/useHideValues";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import { LoadingScreen } from "@/components/ui/loading-screen";

// Aplica o tema salvo imediatamente (antes do primeiro render) para evitar
// flash de tema incorreto caso o script inline do index.html não esteja presente
// (ex: preview do Lovable que usa seu próprio index.html).
if (typeof window !== "undefined") {
  try {
    const stored = localStorage.getItem("theme");
    if (stored === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  } catch (_) {
    // localStorage indisponível (modo privado sem permissão, etc.)
  }
}

import { lazy, Suspense } from "react";

const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Transactions = lazy(() => import("./pages/Transactions"));
const Categories = lazy(() => import("./pages/Categories"));
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
const LimitesPage = lazy(() => import("./pages/cartoes/Limites"));
const AuditoriaPage = lazy(() => import("./pages/cartoes/Auditoria"));
const ImportarComprasPage = lazy(() => import("./pages/cartoes/ImportarCompras"));
const BancosPage = lazy(() => import("./pages/Bancos"));
const PreferenciasPage = lazy(() => import("./pages/profile/Preferencias"));
const SegurancaPage = lazy(() => import("./pages/profile/Seguranca"));




const RecorrentesPage = lazy(() => import("./pages/Recorrentes"));
const SimuladorCompraPage = lazy(() => import("./pages/transactions/SimuladorCompra"));
const CalendarioPage = lazy(() => import("./pages/Calendario"));
const AnotacoesPage = lazy(() => import("./pages/Anotacoes"));
const UtilitariosPage = lazy(() => import("./pages/Utilitarios"));
const RelatoriosPage = lazy(() => import("./pages/Relatorios"));
const IntegracaoMonitorHubPage = lazy(() => import("./pages/admin/IntegracaoMonitorHub"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos de "frescor" por padrão
      gcTime: 1000 * 60 * 60 * 24, // Mantém no cache por 24h
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const persister = createSyncStoragePersister({
  storage: typeof window !== "undefined" ? window.localStorage : undefined,
});

const App = () => (
  <PersistQueryClientProvider 
    client={queryClient} 
    persistOptions={{ persister }}
  >
    <ThemeProvider attribute="class" defaultTheme="light" disableTransitionOnChange>
      <AuthProvider>
        <TooltipProvider>
          <HideValuesProvider>
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
              path="/responsaveis"
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

            {/* Redirect antigo /cartoes/responsaveis para novo caminho */}
            <Route path="/cartoes/responsaveis" element={<Navigate to="/responsaveis" replace />} />

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


            <Route path="/assinaturas" element={<Navigate to="/recorrentes" replace />} />

            <Route
              path="/recorrentes"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<LoadingScreen />}>
                    <RecorrentesPage />
                  </Suspense>
                </ProtectedRoute>
              }
            />

            <Route
              path="/calendario"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<LoadingScreen />}>
                    <CalendarioPage />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/anotacoes"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<LoadingScreen />}>
                    <AnotacoesPage />
                  </Suspense>
                </ProtectedRoute>
              }
            />


            <Route
              path="/utilitarios"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<LoadingScreen />}>
                    <UtilitariosPage />
                  </Suspense>
                </ProtectedRoute>
              }
            />

            <Route
              path="/relatorios"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<LoadingScreen />}>
                    <RelatoriosPage />
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
              path="/admin/integracao-monitorhub"
              element={
                <AdminRoute>
                  <Suspense fallback={<LoadingScreen />}>
                    <IntegracaoMonitorHubPage />
                  </Suspense>
                </AdminRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </BrowserRouter>
          </HideValuesProvider>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </PersistQueryClientProvider>
);

export default App;