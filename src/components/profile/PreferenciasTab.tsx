import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useTheme } from 'next-themes';
import { Palette, Sun, Moon, Monitor, Wallet, PiggyBank } from 'lucide-react';
import { usePreferenciasUsuario } from '@/hooks/usePreferenciasUsuario';
import { useSaldoInicial } from '@/hooks/useSaldoInicial';
import { cn } from '@/lib/utils';

export function PreferenciasTab() {
  const { theme, setTheme } = useTheme();
  const { preferencias, salvarPreferencias, getTema } = usePreferenciasUsuario();
  const { 
    saldoInicial, 
    saldoInicialGuardado, 
    atualizarSaldo, 
    atualizarSaldoGuardado,
    isUpdating,
    isUpdatingGuardado,
  } = useSaldoInicial();

  const [tema, setTemaLocal] = useState<string>(getTema());
  const [hasChanges, setHasChanges] = useState(false);
  const [saldoInicialInput, setSaldoInicialInput] = useState<string>('');
  const [saldoGuardadoInput, setSaldoGuardadoInput] = useState<string>('');

  useEffect(() => {
    if (preferencias) {
      setTemaLocal(preferencias.tema || 'system');
    }
  }, [preferencias]);

  useEffect(() => {
    setSaldoInicialInput(saldoInicial.toFixed(2));
  }, [saldoInicial]);

  useEffect(() => {
    setSaldoGuardadoInput(saldoInicialGuardado.toFixed(2));
  }, [saldoInicialGuardado]);

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

  const handleSalvarSaldoInicial = () => {
    const valor = parseFloat(saldoInicialInput.replace(',', '.')) || 0;
    atualizarSaldo(valor);
  };

  const handleSalvarSaldoGuardado = () => {
    const valor = parseFloat(saldoGuardadoInput.replace(',', '.')) || 0;
    atualizarSaldoGuardado(valor);
  };

  const temaOptions = [
    { value: 'light', label: 'Claro', icon: Sun },
    { value: 'dark', label: 'Escuro', icon: Moon },
    { value: 'system', label: 'Sistema', icon: Monitor },
  ];

  return (
    <div className="space-y-6">
      {/* Saldos Iniciais */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Saldos Iniciais
          </CardTitle>
          <CardDescription>
            Configure os saldos que você tinha antes de começar a usar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Saldo Inicial */}
          <div className="space-y-2">
            <Label htmlFor="saldo-inicial">Saldo Inicial (em conta)</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  R$
                </span>
                <Input
                  id="saldo-inicial"
                  type="text"
                  inputMode="decimal"
                  value={saldoInicialInput}
                  onChange={(e) => setSaldoInicialInput(e.target.value)}
                  className="pl-10"
                  placeholder="0,00"
                />
              </div>
              <Button 
                onClick={handleSalvarSaldoInicial}
                disabled={isUpdating}
                size="sm"
              >
                {isUpdating ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Valor que você tinha em conta quando começou a usar o sistema
            </p>
          </div>

          {/* Saldo Inicial Guardado */}
          <div className="space-y-2">
            <Label htmlFor="saldo-guardado" className="flex items-center gap-2">
              <PiggyBank className="w-4 h-4 text-primary" />
              Saldo Inicial Guardado (em metas)
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  R$
                </span>
                <Input
                  id="saldo-guardado"
                  type="text"
                  inputMode="decimal"
                  value={saldoGuardadoInput}
                  onChange={(e) => setSaldoGuardadoInput(e.target.value)}
                  className="pl-10"
                  placeholder="0,00"
                />
              </div>
              <Button 
                onClick={handleSalvarSaldoGuardado}
                disabled={isUpdatingGuardado}
                size="sm"
              >
                {isUpdatingGuardado ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Valor que você já tinha guardado em metas <strong>antes</strong> de usar o sistema. 
              Este valor será somado ao patrimônio para que o saldo disponível fique correto.
            </p>
          </div>
        </CardContent>
      </Card>

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

      {/* Botão Salvar Tema */}
      {hasChanges && (
        <Button 
          onClick={handleSalvar} 
          disabled={salvarPreferencias.isPending}
          className="w-full sm:w-auto"
        >
          {salvarPreferencias.isPending ? 'Salvando...' : 'Salvar Preferências de Tema'}
        </Button>
      )}
    </div>
  );
}
