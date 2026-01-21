import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import { usePreferenciasUsuario } from '@/hooks/usePreferenciasUsuario';
import { Sun, Moon, Monitor, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

type ThemeType = 'light' | 'dark' | 'system';

export default function Preferencias() {
  const { theme, setTheme } = useTheme();
  const { preferencias, salvarPreferencias } = usePreferenciasUsuario();
  const [tema, setTema] = useState<ThemeType>((preferencias?.tema as ThemeType) || (theme as ThemeType) || 'system');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (preferencias?.tema) {
      setTema(preferencias.tema as ThemeType);
    }
  }, [preferencias]);

  const handleTemaChange = (novoTema: 'light' | 'dark' | 'system') => {
    setTema(novoTema);
    setTheme(novoTema);
    setHasChanges(true);
  };

  const handleSalvar = () => {
    salvarPreferencias.mutate(
      { tema },
      {
        onSuccess: () => {
          setHasChanges(false);
        },
      }
    );
  };

  const temas: { value: ThemeType; label: string; icon: typeof Sun; description: string }[] = [
    { value: 'light', label: 'Claro', icon: Sun, description: 'Tema claro para uso diurno' },
    { value: 'dark', label: 'Escuro', icon: Moon, description: 'Tema escuro para uso noturno' },
    { value: 'system', label: 'Sistema', icon: Monitor, description: 'Segue as configurações do dispositivo' },
  ];

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Preferências</h1>
          <p className="text-muted-foreground">Personalize sua experiência no aplicativo</p>
        </div>

        {/* Theme Selection */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Aparência</CardTitle>
            <CardDescription>Escolha o tema visual do aplicativo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {temas.map((t) => (
                <div
                  key={t.value}
                  onClick={() => handleTemaChange(t.value)}
                  className={cn(
                    "flex flex-col items-center gap-3 p-6 rounded-xl cursor-pointer transition-all border-2",
                    tema === t.value
                      ? "border-primary bg-primary/5 shadow-md"
                      : "border-transparent bg-secondary/50 hover:bg-secondary"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center",
                    tema === t.value ? "bg-primary text-primary-foreground" : "bg-muted"
                  )}>
                    <t.icon className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium">{t.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Regional Settings */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Configurações Regionais</CardTitle>
            <CardDescription>Personalize formatos de data e moeda</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-secondary/50">
                <p className="text-sm text-muted-foreground mb-1">Moeda</p>
                <p className="font-medium">Real Brasileiro (R$)</p>
              </div>
              <div className="p-4 rounded-lg bg-secondary/50">
                <p className="text-sm text-muted-foreground mb-1">Formato de Data</p>
                <p className="font-medium">DD/MM/AAAA</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Mais opções de configuração regional estarão disponíveis em breve.
            </p>
          </CardContent>
        </Card>

        {/* Save Button */}
        {hasChanges && (
          <div className="flex justify-end">
            <Button 
              onClick={handleSalvar}
              disabled={salvarPreferencias.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              {salvarPreferencias.isPending ? 'Salvando...' : 'Salvar Preferências'}
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
