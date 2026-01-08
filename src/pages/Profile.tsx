import { Layout } from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Settings, BarChart3, Shield } from 'lucide-react';
import { PerfilTab, PreferenciasTab, EstatisticasTab, SegurancaTab } from '@/components/profile';

export default function Profile() {
  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Meu Perfil</h1>
          <p className="text-muted-foreground">Gerencie suas informações e preferências</p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="perfil" className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-auto p-1">
            <TabsTrigger value="perfil" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2">
              <User className="w-4 h-4" />
              <span className="text-xs sm:text-sm">Perfil</span>
            </TabsTrigger>
            <TabsTrigger value="preferencias" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2">
              <Settings className="w-4 h-4" />
              <span className="text-xs sm:text-sm">Preferências</span>
            </TabsTrigger>
            <TabsTrigger value="estatisticas" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2">
              <BarChart3 className="w-4 h-4" />
              <span className="text-xs sm:text-sm">Estatísticas</span>
            </TabsTrigger>
            <TabsTrigger value="seguranca" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2">
              <Shield className="w-4 h-4" />
              <span className="text-xs sm:text-sm">Segurança</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="perfil" className="mt-6">
            <PerfilTab />
          </TabsContent>

          <TabsContent value="preferencias" className="mt-6">
            <PreferenciasTab />
          </TabsContent>

          <TabsContent value="estatisticas" className="mt-6">
            <EstatisticasTab />
          </TabsContent>

          <TabsContent value="seguranca" className="mt-6">
            <SegurancaTab />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
