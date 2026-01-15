import { useState, useEffect } from "react";
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
import { Investimento, useAtualizarInvestimento, TIPOS_INVESTIMENTO } from "@/hooks/useInvestimentos";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditarInvestimentoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investimento: Investimento | null;
}

export function EditarInvestimentoDialog({
  open,
  onOpenChange,
  investimento,
}: EditarInvestimentoDialogProps) {
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("poupanca");
  const [instituicao, setInstituicao] = useState("");
  const [rentabilidade, setRentabilidade] = useState("");
  const [dataVencimento, setDataVencimento] = useState<Date | undefined>();
  const [observacao, setObservacao] = useState("");

  const atualizarInvestimento = useAtualizarInvestimento();

  useEffect(() => {
    if (investimento && open) {
      setNome(investimento.nome);
      setTipo(investimento.tipo);
      setInstituicao(investimento.instituicao || "");
      setRentabilidade(
        investimento.rentabilidadeAnual?.toString().replace(".", ",") || ""
      );
      setDataVencimento(
        investimento.dataVencimento
          ? parseISO(investimento.dataVencimento)
          : undefined
      );
      setObservacao(investimento.observacao || "");
    }
  }, [investimento, open]);

  const tipoSelecionado = TIPOS_INVESTIMENTO.find((t) => t.value === tipo);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!investimento || !nome.trim()) return;

    await atualizarInvestimento.mutateAsync({
      id: investimento.id,
      nome: nome.trim(),
      tipo,
      instituicao: instituicao.trim() || null,
      rentabilidadeAnual: rentabilidade
        ? parseFloat(rentabilidade.replace(",", "."))
        : null,
      dataVencimento: dataVencimento || null,
      cor: tipoSelecionado?.cor || investimento.cor,
      icone: tipoSelecionado?.icon || investimento.icone,
      observacao: observacao.trim() || null,
    });

    onOpenChange(false);
  };

  if (!investimento) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Investimento</DialogTitle>
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

          {/* Rentabilidade e Vencimento */}
          <div className="grid grid-cols-2 gap-4">
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
              disabled={atualizarInvestimento.isPending}
            >
              {atualizarInvestimento.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar alterações"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
