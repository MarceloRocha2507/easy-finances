import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Cartao } from "@/services/cartoes";
import { calcularResumoPorResponsavel, ResumoResponsavel } from "@/services/compras-cartao";
import { registrarPagamento, useAcertosMes } from "@/services/acertos";
import { useResponsaveis } from "@/services/responsaveis";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/formatters";
import {
  Wallet,
  User,
  CheckCircle,
  AlertCircle,
  Clock,
} from "lucide-react";

interface Props {
  cartao: Cartao;
  mesReferencia: Date;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function RegistrarAcertoDialog({
  cartao,
  mesReferencia,
  open,
  onOpenChange,
  onSaved,
}: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: responsaveis = [] } = useResponsaveis();
  const { data: acertosExistentes = [], refetch: refetchAcertos } = useAcertosMes(
    open ? cartao.id : null,
    mesReferencia
  );

  const [resumoPorResponsavel, setResumoPorResponsavel] = useState<ResumoResponsavel[]>([]);
  const [responsavelId, setResponsavelId] = useState<string>("");
  const [valorPago, setValorPago] = useState("");
  const [quitarTotal, setQuitarTotal] = useState(false);
  const [observacao, setObservacao] = useState("");
  const [loading, setLoading] = useState(false);

  // Carregar resumo por responsável
  useEffect(() => {
    if (!open) return;

    async function carregar() {
      try {
        const resumo = await calcularResumoPorResponsavel(cartao.id, mesReferencia);
        setResumoPorResponsavel(resumo);
        
        // Selecionar primeiro responsável não-titular por padrão
        const naoTitular = resumo.find((r) => !r.is_titular);
        if (naoTitular) {
          setResponsavelId(naoTitular.responsavel_id);
        } else if (resumo.length > 0) {
          setResponsavelId(resumo[0].responsavel_id);
        }
      } catch (error) {
        console.error(error);
      }
    }

    carregar();
  }, [open, cartao.id, mesReferencia]);

  // Reset form quando mudar responsável
  useEffect(() => {
    setValorPago("");
    setQuitarTotal(false);
    setObservacao("");
  }, [responsavelId]);

  // Calcular valores
  const dadosResponsavel = useMemo(() => {
    const resumo = resumoPorResponsavel.find((r) => r.responsavel_id === responsavelId);
    const acerto = acertosExistentes.find((a) => a.responsavel_id === responsavelId);

    const valorDevido = resumo?.total || 0;
    const valorJaPago = acerto?.valor_pago || 0;
    const valorRestante = Math.max(valorDevido - valorJaPago, 0);
    const status = acerto?.status || (valorDevido > 0 ? "pendente" : "quitado");

    return {
      valorDevido,
      valorJaPago,
      valorRestante,
      status,
      nome: resumo?.responsavel_apelido || resumo?.responsavel_nome || "",
    };
  }, [responsavelId, resumoPorResponsavel, acertosExistentes]);

  // Atualizar valor quando marcar quitar total
  useEffect(() => {
    if (quitarTotal) {
      setValorPago(dadosResponsavel.valorRestante.toFixed(2).replace(".", ","));
    }
  }, [quitarTotal, dadosResponsavel.valorRestante]);

  const handleSalvar = async () => {
    // Proteção contra cliques duplos
    if (loading) return;
    
    const valor = parseFloat(valorPago.replace(",", "."));
    
    if (isNaN(valor) || valor <= 0) {
      toast({ title: "Informe um valor válido", variant: "destructive" });
      return;
    }

    if (valor > dadosResponsavel.valorRestante) {
      toast({
        title: "Valor maior que o restante",
        description: `O valor máximo é ${formatCurrency(dadosResponsavel.valorRestante)}`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await registrarPagamento({
        cartao_id: cartao.id,
        responsavel_id: responsavelId,
        mes_referencia: mesReferencia,
        valor_pago: valor,
        observacao: observacao || undefined,
      });

      // Criar transação de receita para o acerto recebido
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Buscar ou criar categoria "Acerto de Fatura" tipo income
        let incomeCategoryId: string | null = null;
        const { data: catIncome } = await (supabase as any)
          .from("categories")
          .select("id")
          .eq("user_id", user.id)
          .eq("name", "Acerto de Fatura")
          .eq("type", "income")
          .single();

        if (catIncome) {
          incomeCategoryId = catIncome.id;
        } else {
          const { data: novaCat } = await (supabase as any)
            .from("categories")
            .insert({
              user_id: user.id,
              name: "Acerto de Fatura",
              icon: "handshake",
              color: "#10b981",
              type: "income",
              is_default: true,
            })
            .select("id")
            .single();
          incomeCategoryId = novaCat?.id || null;
        }

        const hoje = new Date().toISOString().split("T")[0];
        await (supabase as any)
          .from("transactions")
          .insert({
            user_id: user.id,
            description: `Acerto ${cartao.nome} - ${dadosResponsavel.nome} - ${nomeMes}`,
            amount: parseFloat(valor.toFixed(2)),
            type: "income",
            status: "completed",
            date: hoje,
            paid_date: hoje,
            category_id: incomeCategoryId,
            tipo_lancamento: "unica",
          });

        // Invalidar queries de transações
        queryClient.invalidateQueries({ queryKey: ["transactions"] });
        queryClient.invalidateQueries({ queryKey: ["transactions-with-balance"] });
        queryClient.invalidateQueries({ queryKey: ["transaction-stats"] });
        queryClient.invalidateQueries({ queryKey: ["complete-stats"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard-completo"] });
        queryClient.invalidateQueries({ queryKey: ["monthly-data"] });
      }

      toast({ title: "Acerto registrado!" });
      refetchAcertos();
      onSaved();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao registrar",
        description: "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const nomeMes = mesReferencia.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  // Filtrar apenas responsáveis com gastos
  const responsaveisComGastos = resumoPorResponsavel.filter((r) => r.total > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0 border-0 overflow-hidden">
        <div className="px-4 sm:px-5 pt-4 pb-4 bg-muted border-b">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-muted-foreground" />
              Registrar Acerto
            </DialogTitle>
            <DialogDescription>
              {cartao.nome} - {nomeMes}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-4 px-4 sm:px-5 pb-4 pt-2 overflow-y-auto">
          {/* Seletor de responsável */}
          <div className="space-y-2">
            <Label>Responsável</Label>
            <Select value={responsavelId} onValueChange={setResponsavelId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar pessoa" />
              </SelectTrigger>
              <SelectContent>
                {responsaveisComGastos.map((r) => {
                  const acerto = acertosExistentes.find(
                    (a) => a.responsavel_id === r.responsavel_id
                  );
                  const status = acerto?.status || "pendente";

                  return (
                    <SelectItem key={r.responsavel_id} value={r.responsavel_id}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>{r.responsavel_apelido || r.responsavel_nome}</span>
                        <span className="text-muted-foreground">
                          ({formatCurrency(r.total)})
                        </span>
                        {status === "quitado" && (
                          <Badge variant="secondary" className="ml-1">
                            Quitado
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Resumo do responsável */}
          {responsavelId && (
            <div className="p-4 rounded-lg bg-muted/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Valor devido</span>
                <span className="font-semibold">
                  {formatCurrency(dadosResponsavel.valorDevido)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Já pago</span>
                <span className="font-semibold text-emerald-600">
                  {formatCurrency(dadosResponsavel.valorJaPago)}
                </span>
              </div>
              <div className="border-t pt-3 flex items-center justify-between">
                <span className="text-sm font-medium">Restante</span>
                <span className="font-bold text-lg">
                  {formatCurrency(dadosResponsavel.valorRestante)}
                </span>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2 pt-2">
                {dadosResponsavel.status === "quitado" ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm text-emerald-600">Quitado</span>
                  </>
                ) : dadosResponsavel.status === "parcial" ? (
                  <>
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    <span className="text-sm text-amber-600">Parcialmente pago</span>
                  </>
                ) : (
                  <>
                    <Clock className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-red-600">Pendente</span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Valor do acerto */}
          {dadosResponsavel.valorRestante > 0 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="valor">Valor recebido (R$)</Label>
                <Input
                  id="valor"
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={valorPago}
                  onChange={(e) => {
                    setValorPago(e.target.value);
                    setQuitarTotal(false);
                  }}
                  disabled={quitarTotal}
                />
              </div>

              {/* Checkbox quitar total */}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="quitar"
                  checked={quitarTotal}
                  onCheckedChange={(checked) => setQuitarTotal(!!checked)}
                />
                <Label htmlFor="quitar" className="text-sm cursor-pointer">
                  Quitar valor total ({formatCurrency(dadosResponsavel.valorRestante)})
                </Label>
              </div>

              {/* Observação */}
              <div className="space-y-2">
                <Label htmlFor="obs">Observação (opcional)</Label>
                <Textarea
                  id="obs"
                  placeholder="Ex: Pix recebido em 10/02"
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  rows={2}
                />
              </div>

              <Button
                className="w-full"
                onClick={handleSalvar}
                disabled={loading || !valorPago}
              >
                {loading ? "Salvando..." : "Registrar acerto"}
              </Button>
            </>
          )}

          {dadosResponsavel.valorRestante === 0 && dadosResponsavel.valorDevido > 0 && (
            <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
              <p className="font-medium text-emerald-700">
                {dadosResponsavel.nome} já quitou a fatura!
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}