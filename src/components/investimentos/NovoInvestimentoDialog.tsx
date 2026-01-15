import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useCriarInvestimento, TIPOS_INVESTIMENTO } from "@/hooks/useInvestimentos";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface NovoInvestimentoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NovoInvestimentoDialog({
  open,
  onOpenChange,
}: NovoInvestimentoDialogProps) {
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("poupanca");
  const [instituicao, setInstituicao] = useState("");
  const [valorInicial, setValorInicial] = useState("");
  const [rentabilidade, setRentabilidade] = useState("");
  const [dataInicio, setDataInicio] = useState<Date>(new Date());
  const [dataVencimento, setDataVencimento] = useState<Date | undefined>();
  const [observacao, setObservacao] = useState("");

  const criarInvestimento = useCriarInvestimento();

  const tipoSelecionado = TIPOS_INVESTIMENTO.find((t) => t.value === tipo);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome.trim() || !valorInicial) return;

    await criarInvestimento.mutateAsync({
      nome: nome.trim(),
      tipo,
      instituicao: instituicao.trim() || undefined,
      valorInicial: parseFloat(valorInicial.replace(",", ".")),
      rentabilidadeAnual: rentabilidade
        ? parseFloat(rentabilidade.replace(",", "."))
        : undefined,
      dataInicio,
      dataVencimento,
      cor: tipoSelecionado?.cor || "#22c55e",
      icone: tipoSelecionado?.icon || "piggy-bank",
      observacao: observacao.trim() || undefined,
    });

    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setNome("");
    setTipo("poupanca");
    setInstituicao("");
    setValorInicial("");
    setRentabilidade("");
    setDataInicio(new Date());
    setDataVencimento(undefined);
    setObservacao("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Investimento</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do investimento *</Label>
            <Input
              id="nome"
              placeholder="Ex: CDB Banco Inter"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>

          {/* Tipo e Instituição */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo *</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_INVESTIMENTO.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: t.cor }}
                        />
                        {t.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="instituicao">Instituição</Label>
              <Input
                id="instituicao"
                placeholder="Ex: Banco Inter"
                value={instituicao}
                onChange={(e) => setInstituicao(e.target.value)}
              />
            </div>
          </div>

          {/* Valor inicial e Rentabilidade */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valorInicial">Valor inicial *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  R$
                </span>
                <Input
                  id="valorInicial"
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={valorInicial}
                  onChange={(e) => setValorInicial(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rentabilidade">Rentabilidade anual (%)</Label>
              <div className="relative">
                <Input
                  id="rentabilidade"
                  type="text"
                  inputMode="decimal"
                  placeholder="Ex: 12,5"
                  value={rentabilidade}
                  onChange={(e) => setRentabilidade(e.target.value)}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  % a.a.
                </span>
              </div>
            </div>
          </div>

          {/* Datas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data de início *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dataInicio && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataInicio
                      ? format(dataInicio, "dd/MM/yyyy", { locale: ptBR })
                      : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dataInicio}
                    onSelect={(date) => date && setDataInicio(date)}
                    locale={ptBR}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Data de vencimento</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dataVencimento && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataVencimento
                      ? format(dataVencimento, "dd/MM/yyyy", { locale: ptBR })
                      : "Opcional"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dataVencimento}
                    onSelect={setDataVencimento}
                    locale={ptBR}
                    initialFocus
                    disabled={(date) => date < dataInicio}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Observação */}
          <div className="space-y-2">
            <Label htmlFor="observacao">Observação</Label>
            <Textarea
              id="observacao"
              placeholder="Notas adicionais sobre o investimento..."
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              rows={2}
            />
          </div>

          {/* Botões */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={criarInvestimento.isPending}
            >
              {criarInvestimento.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar investimento"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
