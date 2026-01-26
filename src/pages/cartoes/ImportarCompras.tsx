import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useResponsaveis } from "@/services/responsaveis";
import {
  parseLinhasCompra,
  importarComprasEmLote,
  verificarDuplicatas,
  gerarOpcoesAnoMes,
  PreviewCompra,
} from "@/services/importar-compras-cartao";
import { Cartao } from "@/services/cartoes";

import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/formatters";

import {
  ArrowLeft,
  Upload,
  FileText,
  Check,
  X,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Info,
  AlertTriangle,
  Calendar,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Status = "idle" | "preview" | "checking" | "importing" | "success";
type ModoMesFatura = "automatico" | "fixo";

export default function ImportarCompras() {
  const { id: cartaoId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  // States
  const [cartao, setCartao] = useState<Cartao | null>(null);
  const [loading, setLoading] = useState(true);
  const [textoInput, setTextoInput] = useState("");
  const [previewData, setPreviewData] = useState<PreviewCompra[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [importando, setImportando] = useState(false);
  const [resultado, setResultado] = useState<{ sucesso: number; erros: number } | null>(null);
  
  // Seletor global de mês
  const [modoMesFatura, setModoMesFatura] = useState<ModoMesFatura>("automatico");
  const [mesFaturaGlobal, setMesFaturaGlobal] = useState<string>("");

  // Responsáveis
  const { data: responsaveis = [] } = useResponsaveis();

  // Carregar cartão
  useEffect(() => {
    async function carregarCartao() {
      if (!cartaoId || !user) return;

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("cartoes")
          .select("*")
          .eq("id", cartaoId)
          .eq("user_id", user.id)
          .single();

        if (error) throw error;
        setCartao(data as Cartao);
      } catch (e) {
        console.error(e);
        toast({
          title: "Erro",
          description: "Não foi possível carregar o cartão.",
          variant: "destructive",
        });
        navigate("/cartoes");
      } finally {
        setLoading(false);
      }
    }

    carregarCartao();
  }, [cartaoId, user]);

  // Gerar opções de mês (6 meses anteriores + próximos 12 meses)
  const opcoesMesFaturaGlobal = useMemo(() => {
    const hoje = new Date();
    const meses = [];
    for (let i = -6; i < 12; i++) {
      const mes = addMonths(hoje, i);
      meses.push({
        value: format(mes, "yyyy-MM"),
        label: format(mes, "MMMM/yyyy", { locale: ptBR }),
      });
    }
    return meses;
  }, []);

  // Inicializar mês global quando mudar para modo fixo
  useEffect(() => {
    if (modoMesFatura === "fixo" && !mesFaturaGlobal) {
      const mesAtual = format(new Date(), "yyyy-MM");
      setMesFaturaGlobal(mesAtual);
    }
  }, [modoMesFatura]);

  // Aplicar mês global a todas as linhas quando mudar
  useEffect(() => {
    if (modoMesFatura === "fixo" && mesFaturaGlobal && previewData.length > 0) {
      setPreviewData(prev => prev.map(p => ({
        ...p,
        mesFatura: mesFaturaGlobal
      })));
    }
  }, [modoMesFatura, mesFaturaGlobal]);

  // Estatísticas do preview
  const stats = useMemo(() => {
    const validas = previewData.filter((p) => p.valido);
    const invalidas = previewData.filter((p) => !p.valido);
    const duplicatas = previewData.filter((p) => p.possivelDuplicata && !p.forcarImportacao);
    const aImportar = validas.filter((p) => !p.possivelDuplicata || p.forcarImportacao);
    const totalParcelas = aImportar.reduce((sum, p) => sum + p.valor, 0);
    const totalCompras = aImportar.reduce((sum, p) => sum + p.valorTotal, 0);

    return { 
      validas: validas.length, 
      invalidas: invalidas.length, 
      duplicatas: duplicatas.length,
      aImportar: aImportar.length,
      totalParcelas, 
      totalCompras 
    };
  }, [previewData]);

  // Resumo por mês
  const resumoPorMes = useMemo(() => {
    const grupos = new Map<string, { qtd: number; total: number }>();
    previewData.filter(p => p.valido && (!p.possivelDuplicata || p.forcarImportacao)).forEach(p => {
      const mes = p.mesFatura;
      const atual = grupos.get(mes) || { qtd: 0, total: 0 };
      grupos.set(mes, { 
        qtd: atual.qtd + 1, 
        total: atual.total + p.valorTotal 
      });
    });
    // Ordenar por mês
    return Array.from(grupos.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([mes, dados]) => ({
        mes,
        label: format(new Date(mes + "-01"), "MMM/yy", { locale: ptBR }),
        ...dados
      }));
  }, [previewData]);

  // Processar texto
  async function handleProcessar() {
    if (!textoInput.trim() || !cartao || !cartaoId) return;

    setStatus("checking");

    const parsed = parseLinhasCompra(
      textoInput,
      responsaveis,
      cartao.dia_fechamento
    );

    // Verificar duplicatas
    const comDuplicatas = await verificarDuplicatas(cartaoId, parsed);

    setPreviewData(comDuplicatas);
    setStatus("preview");
  }

  // Limpar
  function handleLimpar() {
    setTextoInput("");
    setPreviewData([]);
    setStatus("idle");
    setResultado(null);
  }

  // Importar
  async function handleImportar() {
    if (!cartaoId) return;

    setImportando(true);
    try {
      // CHECKPOINT FINAL: Re-verificar duplicatas antes de importar
      const verificacaoFinal = await verificarDuplicatas(cartaoId, previewData);
      setPreviewData(verificacaoFinal);
      
      // Separar compras para importar (válidas E não-duplicata OU forçada)
      const comprasParaImportar = verificacaoFinal.filter(
        (p) => p.valido && (!p.possivelDuplicata || p.forcarImportacao)
      );
      
      // Contar duplicatas ignoradas (válidas E duplicata E não-forçada)
      const duplicatasIgnoradas = verificacaoFinal.filter(
        (p) => p.valido && p.possivelDuplicata && !p.forcarImportacao
      );

      // Se não há nada para importar, apenas avisar
      if (comprasParaImportar.length === 0) {
        toast({
          title: "Nada para importar",
          description: "Todas as compras são duplicatas ou inválidas.",
        });
        setImportando(false);
        return;
      }

      // Importar as compras válidas (ignorando duplicatas não-forçadas)
      const result = await importarComprasEmLote(cartaoId, comprasParaImportar);

      setResultado({ sucesso: result.sucesso, erros: result.erros });
      setStatus("success");

      // Toast de sucesso com info sobre duplicatas ignoradas
      const descParts = [`${result.sucesso} compras importadas com sucesso.`];
      if (duplicatasIgnoradas.length > 0) {
        descParts.push(`${duplicatasIgnoradas.length} duplicata(s) ignorada(s).`);
      }
      
      toast({
        title: "Importação concluída",
        description: descParts.join(" "),
      });
    } catch (e) {
      console.error(e);
      toast({
        title: "Erro na importação",
        description: "Ocorreu um erro ao importar as compras.",
        variant: "destructive",
      });
    } finally {
      setImportando(false);
    }
  }

  // Upload de arquivo
  function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const texto = e.target?.result as string;
      setTextoInput(texto);
    };
    reader.readAsText(file);
  }

  // Atualizar responsável de uma linha
  function handleAtualizarResponsavel(linha: number, responsavelId: string) {
    setPreviewData((prev) =>
      prev.map((p) => {
        if (p.linha === linha) {
          const resp = responsaveis.find((r) => r.id === responsavelId);
          return {
            ...p,
            responsavelId,
            responsavelNome: resp?.apelido || resp?.nome || "",
            valido: true,
            erro: undefined,
          };
        }
        return p;
      })
    );
  }

  // Atualizar mês da fatura de uma linha e re-verificar duplicatas
  async function handleAtualizarMesFatura(linha: number, mesFatura: string) {
    // Primeiro atualiza o mês
    const updatedPreview = previewData.map((p) => {
      if (p.linha === linha) {
        return { ...p, mesFatura };
      }
      return p;
    });

    // Depois re-verifica duplicatas para todas as compras
    if (cartaoId) {
      const comDuplicatas = await verificarDuplicatas(cartaoId, updatedPreview);
      setPreviewData(comDuplicatas);
    } else {
      setPreviewData(updatedPreview);
    }
  }

  // Marcar/desmarcar para forçar importação de duplicata
  function handleToggleForcarImportacao(linha: number, checked: boolean) {
    setPreviewData((prev) =>
      prev.map((p) => {
        if (p.linha === linha) {
          return {
            ...p,
            forcarImportacao: checked,
          };
        }
        return p;
      })
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  if (!cartao) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Cartão não encontrado.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/cartoes/${cartao.id}/despesas`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Importar Compras</h1>
            <p className="text-muted-foreground">
              {cartao.nome} · Fechamento dia {cartao.dia_fechamento}
            </p>
          </div>
        </div>

        {/* Estado: Sucesso */}
        {status === "success" && resultado && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Importação concluída!</h2>
                  <p className="text-muted-foreground mt-1">
                    {resultado.sucesso} compras importadas com sucesso.
                    {resultado.erros > 0 && ` ${resultado.erros} com erro.`}
                  </p>
                </div>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" onClick={handleLimpar}>
                    Importar mais
                  </Button>
                  <Button onClick={() => navigate(`/cartoes/${cartao.id}/despesas`)}>
                    Ver despesas
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Estado: Idle ou Preview */}
        {status !== "success" && (
          <>
            {/* Área de entrada */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Dados para importação
                </CardTitle>
                <CardDescription>
                  Cole os dados das compras ou carregue um arquivo CSV/TXT
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder={`Formato: Data,Descrição,Valor Responsável

Exemplo:
2026-01-22,IOF de compra internacional,0.16 eu
2026-01-20,Comercial Peixoto - Parcela 1/2,41.21 mae
2026-01-05,Nortmotos - Parcela 3/4,72.98 eu`}
                  className="min-h-[200px] font-mono text-sm"
                  value={textoInput}
                  onChange={(e) => setTextoInput(e.target.value)}
                />

                <div className="flex items-center gap-2">
                  <Button onClick={handleProcessar} disabled={!textoInput.trim() || status === "checking"}>
                    {status === "checking" ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Verificando...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Processar dados
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={handleLimpar}>
                    Limpar
                  </Button>
                  <div className="flex-1" />
                  <label htmlFor="file-upload">
                    <input
                      id="file-upload"
                      type="file"
                      accept=".csv,.txt"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    <Button variant="outline" asChild>
                      <span className="cursor-pointer">
                        <Upload className="h-4 w-4 mr-2" />
                        Carregar arquivo
                      </span>
                    </Button>
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Instruções */}
            {status === "idle" && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Formato esperado</AlertTitle>
                <AlertDescription className="mt-2 space-y-2">
                  <p>Cada linha deve conter: <code className="bg-muted px-1 rounded">Data,Descrição,Valor Responsável</code></p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    <li>Data: YYYY-MM-DD ou DD/MM/YYYY</li>
                    <li>Responsável: apelido cadastrado (eu, mae, pai, etc.)</li>
                    <li>Parcelas são detectadas automaticamente (ex: "Parcela 1/2" ou "- 2/3")</li>
                    <li>O mês da fatura é calculado baseado na data e dia de fechamento</li>
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Preview */}
            {status === "preview" && previewData.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Prévia da importação</CardTitle>
                    <div className="flex items-center gap-3">
                      {stats.aImportar > 0 && (
                        <Badge variant="default" className="gap-1">
                          <Check className="h-3 w-3" />
                          {stats.aImportar} a importar
                        </Badge>
                      )}
                      {stats.duplicatas > 0 && (
                        <Badge variant="secondary" className="gap-1 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20">
                          <AlertTriangle className="h-3 w-3" />
                          {stats.duplicatas} duplicatas
                        </Badge>
                      )}
                      {stats.invalidas > 0 && (
                        <Badge variant="destructive" className="gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {stats.invalidas} inválidas
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardDescription>
                    Total a importar: {formatCurrency(stats.totalCompras)}
                    {stats.totalParcelas !== stats.totalCompras && (
                      <span className="text-muted-foreground ml-2">
                        (parcelas deste mês: {formatCurrency(stats.totalParcelas)})
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                
                {/* Seletor global de mês de fatura */}
                <div className="px-6 pb-3">
                  <div className="p-4 rounded-lg border bg-muted/30 space-y-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Mês da fatura para importação</span>
                    </div>
                    
                    <RadioGroup
                      value={modoMesFatura}
                      onValueChange={(v) => setModoMesFatura(v as ModoMesFatura)}
                      className="flex flex-col gap-3"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="automatico" id="modo-auto" />
                        <Label htmlFor="modo-auto" className="text-sm cursor-pointer">
                          Automático (baseado na data da compra e fechamento dia {cartao.dia_fechamento})
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="fixo" id="modo-fixo" />
                        <Label htmlFor="modo-fixo" className="text-sm cursor-pointer">
                          Fixar todas as compras em:
                        </Label>
                        {modoMesFatura === "fixo" && (
                          <Select
                            value={mesFaturaGlobal}
                            onValueChange={setMesFaturaGlobal}
                          >
                            <SelectTrigger className="w-[160px] h-8">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              {opcoesMesFaturaGlobal.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </RadioGroup>

                    {/* Resumo por mês */}
                    {resumoPorMes.length > 0 && (
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground mb-2">Distribuição por fatura:</p>
                        <div className="flex flex-wrap gap-2">
                          {resumoPorMes.map(({ mes, label, qtd, total }) => (
                            <Badge key={mes} variant="outline" className="gap-1">
                              <span className="font-medium">{label}</span>
                              <span className="text-muted-foreground">
                                {qtd} · {formatCurrency(total)}
                              </span>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Alerta de duplicatas */}
                {stats.duplicatas > 0 && (
                  <div className="px-6 pb-3">
                    <Alert variant="default" className="border-amber-500/50 bg-amber-500/5">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      <AlertTitle className="text-amber-600">Duplicatas detectadas</AlertTitle>
                      <AlertDescription className="text-sm">
                        {stats.duplicatas} compra(s) serão <strong>ignoradas</strong> por padrão para evitar parcelas repetidas. 
                        Se for um falso positivo, marque "Forçar" na linha para importar mesmo assim.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
                
                <CardContent className="p-0">
                  <ScrollArea className="h-[400px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-10">#</TableHead>
                          <TableHead className="w-10">Status</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead className="text-right">Parcela</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead>Responsável</TableHead>
                          <TableHead>Fatura</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead className="w-28">
                            {stats.duplicatas > 0 && (
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  id="forcar-todos"
                                  checked={previewData.filter(p => p.possivelDuplicata).every(p => p.forcarImportacao)}
                                  onCheckedChange={(checked) => {
                                    setPreviewData(prev => prev.map(p => 
                                      p.possivelDuplicata ? { ...p, forcarImportacao: checked === true } : p
                                    ));
                                  }}
                                />
                                <label htmlFor="forcar-todos" className="text-xs cursor-pointer font-normal">
                                  Forçar todos
                                </label>
                              </div>
                            )}
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewData.map((p) => (
                          <TableRow
                            key={p.linha}
                            className={
                              !p.valido 
                                ? "bg-destructive/5" 
                                : p.possivelDuplicata && !p.forcarImportacao
                                  ? "bg-amber-500/5"
                                  : undefined
                            }
                          >
                            <TableCell className="text-muted-foreground text-xs">
                              {p.linha}
                            </TableCell>
                            <TableCell>
                              {!p.valido ? (
                                <X className="h-4 w-4 text-destructive" />
                              ) : p.possivelDuplicata && !p.forcarImportacao ? (
                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                              ) : (
                                <Check className="h-4 w-4 text-emerald-500" />
                              )}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              {p.dataCompra
                                ? format(p.dataCompra, "dd/MM/yyyy")
                                : p.dataOriginal}
                            </TableCell>
                            <TableCell className="max-w-[200px]">
                              <div className="truncate" title={p.descricao}>
                                {p.descricao}
                              </div>
                              {p.erro && (
                                <p className="text-xs text-destructive mt-0.5 truncate">
                                  {p.erro}
                                </p>
                              )}
                              {p.possivelDuplicata && (
                                <p className="text-xs text-amber-600 mt-0.5">
                                  {p.duplicataInfo?.origemDuplicata === "lote" 
                                    ? `Duplicata no lote (linha ${p.duplicataInfo.compraId.replace("linha-", "")})`
                                    : `Duplicata no banco (${p.duplicataInfo?.parcelaEncontrada}/${p.parcelas})`
                                  }
                                </p>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(p.valor)}
                            </TableCell>
                            <TableCell className="text-right text-sm">
                              {p.tipoLancamento === "parcelada" ? (
                                <span className="text-muted-foreground">{formatCurrency(p.valorTotal)}</span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {!p.valido && p.responsavelInput ? (
                                <Select
                                  value={p.responsavelId || ""}
                                  onValueChange={(value) =>
                                    handleAtualizarResponsavel(p.linha, value)
                                  }
                                >
                                  <SelectTrigger className="h-8 w-[120px]">
                                    <SelectValue placeholder={p.responsavelInput} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {responsaveis.map((r) => (
                                      <SelectItem key={r.id} value={r.id}>
                                        {r.apelido || r.nome}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <span>{p.responsavelNome}</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {p.mesFatura && (
                                <Select
                                  value={p.mesFatura}
                                  onValueChange={(value) =>
                                    handleAtualizarMesFatura(p.linha, value)
                                  }
                                >
                                  <SelectTrigger className="h-8 w-[100px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {gerarOpcoesAnoMes(p.mesFatura).map((opcao) => (
                                      <SelectItem key={opcao.valor} value={opcao.valor}>
                                        {opcao.label}
                                        {opcao.sugerido && " ✓"}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            </TableCell>
                            <TableCell>
                              {p.tipoLancamento === "parcelada" ? (
                                <Badge variant="outline" className="text-xs">
                                  {p.parcelaInicial}/{p.parcelas}
                                </Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  Única
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              {p.possivelDuplicata && (
                                <div className="flex items-center gap-2">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <AlertTriangle className="h-4 w-4 text-amber-500 cursor-help" />
                                      </TooltipTrigger>
                                      <TooltipContent side="left" className="max-w-[350px]">
                                        <p className="font-medium">
                                          {p.duplicataInfo?.origemDuplicata === "lote" 
                                            ? "Duplicata no lote de importação"
                                            : "Compra similar já existe no banco"
                                          }
                                        </p>
                                        
                                        {/* Motivo detalhado */}
                                        {p.duplicataInfo?.motivoDetalhado && (
                                          <p className="text-xs mt-1 text-amber-600">
                                            {p.duplicataInfo.motivoDetalhado}
                                          </p>
                                        )}
                                        
                                        {/* Info original */}
                                        <p className="text-xs text-muted-foreground mt-1">
                                          Descrição: "{p.duplicataInfo?.descricao || "N/A"}"
                                        </p>
                                        
                                        {p.duplicataInfo?.origemDuplicata === "banco" && (
                                          <p className="text-xs text-muted-foreground">
                                            Parcela {p.duplicataInfo.parcelaEncontrada}/{p.parcelas} · 
                                            Fatura {p.duplicataInfo.mesInicio}
                                          </p>
                                        )}
                                        
                                        {/* Debug: fingerprint */}
                                        {p.duplicataInfo?.fingerprintCalculado && (
                                          <div className="mt-2 pt-2 border-t border-border/50">
                                            <p className="text-[10px] text-muted-foreground font-mono break-all">
                                              FP: {p.duplicataInfo.fingerprintCalculado}
                                            </p>
                                          </div>
                                        )}
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                  <Checkbox
                                    id={`forcar-${p.linha}`}
                                    checked={p.forcarImportacao}
                                    onCheckedChange={(checked) =>
                                      handleToggleForcarImportacao(p.linha, checked === true)
                                    }
                                  />
                                  <label
                                    htmlFor={`forcar-${p.linha}`}
                                    className="text-xs cursor-pointer"
                                  >
                                    Forçar
                                  </label>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>

                {/* Ações de importação */}
                <div className="flex items-center justify-between p-4 border-t">
                  <Button variant="outline" onClick={handleLimpar}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleImportar}
                    disabled={stats.aImportar === 0 || importando}
                  >
                    {importando ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Importando...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Importar {stats.aImportar} compras
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
