import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useTheme } from 'next-themes';
import { Palette, Sun, Moon, Monitor } from 'lucide-react';
import { usePreferenciasUsuario } from '@/hooks/usePreferenciasUsuario';
import { cn } from '@/lib/utils';

export function PreferenciasTab() {
  const { theme, setTheme } = useTheme();
  const { preferencias, salvarPreferencias, getTema } = usePreferenciasUsuario();

  const [tema, setTemaLocal] = useState<string>(getTema());
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (preferencias) {
      setTemaLocal(preferencias.tema || 'system');
    }
  }, [preferencias]);

  const handleTemaChange = (novoTema: string) => {
    setTemaLocal(novoTema);
    setTheme(novoTema);
    setHasChanges(true);
  };

  const handleSalvar = () => {
    salvarPreferencias.mutate({
      tema: tema as 'light' | 'dark' | 'system',
    });
    setHasChanges(false);
  };

  const temaOptions = [
    { value: 'light', label: 'Claro', icon: Sun },
    { value: 'dark', label: 'Escuro', icon: Moon },
    { value: 'system', label: 'Sistema', icon: Monitor },
  ];

  return (
    <div className="space-y-6">
      {/* Aparência */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Aparência
          </CardTitle>
          <CardDescription>
            Personalize a aparência do aplicativo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Label>Tema</Label>
            <div className="grid grid-cols-3 gap-3">
              {temaOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => handleTemaChange(option.value)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                      tema === option.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <Icon className={cn(
                      "w-6 h-6",
                      tema === option.value ? "text-primary" : "text-muted-foreground"
                    )} />
                    <span className={cn(
                      "text-sm font-medium",
                      tema === option.value ? "text-primary" : "text-muted-foreground"
                    )}>
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botão Salvar */}
      <Button 
        onClick={handleSalvar} 
        disabled={!hasChanges || salvarPreferencias.isPending}
        className="w-full sm:w-auto"
      >
        {salvarPreferencias.isPending ? 'Salvando...' : 'Salvar Preferências'}
      </Button>
    </div>
  );
}
