import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTheme } from 'next-themes';
import { Palette, DollarSign, Sun, Moon, Monitor } from 'lucide-react';
import { 
  usePreferenciasUsuario, 
  MOEDAS_DISPONIVEIS, 
  FORMATOS_DATA, 
  DIAS_SEMANA 
} from '@/hooks/usePreferenciasUsuario';
import { cn } from '@/lib/utils';

export function PreferenciasTab() {
  const { theme, setTheme } = useTheme();
  const { 
    preferencias, 
    salvarPreferencias, 
    getTema, 
    getMoeda, 
    getFormatoData, 
    getPrimeiroDiaSemana 
  } = usePreferenciasUsuario();

  const [tema, setTemaLocal] = useState<string>(getTema());
  const [moeda, setMoeda] = useState<string>(getMoeda());
  const [formatoData, setFormatoData] = useState<string>(getFormatoData());
  const [primeiroDiaSemana, setPrimeiroDiaSemana] = useState<number>(getPrimeiroDiaSemana());
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (preferencias) {
      setTemaLocal(preferencias.tema || 'system');
      setMoeda(preferencias.moeda || 'BRL');
      setFormatoData(preferencias.formato_data || 'DD/MM/YYYY');
      setPrimeiroDiaSemana(preferencias.primeiro_dia_semana ?? 0);
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
      moeda,
      formato_data: formatoData,
      primeiro_dia_semana: primeiroDiaSemana,
    });
    setHasChanges(false);
  };

  const formatarExemploMoeda = (codigo: string) => {
    const moedaInfo = MOEDAS_DISPONIVEIS.find(m => m.codigo === codigo);
    if (!moedaInfo) return 'R$ 1.234,56';
    
    return new Intl.NumberFormat(moedaInfo.locale, {
      style: 'currency',
      currency: moedaInfo.codigo,
    }).format(1234.56);
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

      {/* Moeda e Formatos */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Moeda e Formatos
          </CardTitle>
          <CardDescription>
            Configure a moeda e formatos de data preferidos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Moeda */}
          <div className="space-y-2">
            <Label>Moeda</Label>
            <Select 
              value={moeda} 
              onValueChange={(v) => { setMoeda(v); setHasChanges(true); }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MOEDAS_DISPONIVEIS.map((m) => (
                  <SelectItem key={m.codigo} value={m.codigo}>
                    {m.simbolo} {m.nome} ({m.codigo})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Formato de Data */}
          <div className="space-y-2">
            <Label>Formato de Data</Label>
            <Select 
              value={formatoData} 
              onValueChange={(v) => { setFormatoData(v); setHasChanges(true); }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FORMATOS_DATA.map((f) => (
                  <SelectItem key={f.valor} value={f.valor}>
                    {f.valor} (ex: {f.exemplo})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Primeiro Dia da Semana */}
          <div className="space-y-2">
            <Label>Primeiro dia da semana</Label>
            <Select 
              value={String(primeiroDiaSemana)} 
              onValueChange={(v) => { setPrimeiroDiaSemana(Number(v)); setHasChanges(true); }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DIAS_SEMANA.map((d) => (
                  <SelectItem key={d.valor} value={String(d.valor)}>
                    {d.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preview */}
          <div className="p-4 rounded-lg bg-muted">
            <p className="text-sm text-muted-foreground mb-1">Prévia:</p>
            <p className="font-medium">
              {formatarExemploMoeda(moeda)} | {FORMATOS_DATA.find(f => f.valor === formatoData)?.exemplo || '08/01/2026'}
            </p>
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
