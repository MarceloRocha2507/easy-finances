import { useState, useCallback } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calculator, Save, FileCheck, RotateCcw } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { FormularioSimulacao } from "@/components/simulador/FormularioSimulacao";
import { GraficoProjecao } from "@/components/simulador/GraficoProjecao";
import { TabelaProjecao } from "@/components/simulador/TabelaProjecao";
import { VeredictFinaIA } from "@/components/simulador/VeredictFinaIA";
import { HistoricoSimulacoes } from "@/components/simulador/HistoricoSimulacoes";
import {
  useSimuladorCompra,
  type DadosSimulacao,
  type ProjecaoMes,
} from "@/hooks/useSimuladorCompra";

export default function SimuladorCompra() {
  const {
    projecao,
    calcularProjecao,
    salvarSimulacao,
    excluirSimulacao,
    lancarComoDespesa,
    simulacoesSalvas,
    saldoAtual,
  } = useSimuladorCompra();

  const [dadosAtuais, setDadosAtuais] = useState<DadosSimulacao | null>(null);
  const [dadosIniciais, setDadosIniciais] = useState<DadosSimulacao | null>(null);
  const [veredictoAtual, setVeredictoAtual] = useState<string>("");
  const [mostrarResultado, setMostrarResultado] = useState(false);

  const handleSimular = useCallback(
    (dados: DadosSimulacao) => {
      setDadosAtuais(dados);
      calcularProjecao(dados);
      setMostrarResultado(true);
      setVeredictoAtual("");
    },
    [calcularProjecao]
  );

  const handleRecarregar = useCallback((dados: DadosSimulacao) => {
    setDadosIniciais({ ...dados });
    setMostrarResultado(false);
    setDadosAtuais(null);
    setVeredictoAtual("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleSimularNovamente = () => {
    setMostrarResultado(false);
    if (dadosAtuais) setDadosIniciais({ ...dadosAtuais });
  };

  return (
    <Layout>
      <div className="page-enter space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Simulador de Compra
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Saldo atual: {formatCurrency(saldoAtual)}
            </p>
          </div>
        </div>

        {/* Histórico de simulações */}
        <HistoricoSimulacoes
          simulacoes={simulacoesSalvas}
          onRecarregar={handleRecarregar}
          onExcluir={(id) => excluirSimulacao.mutate(id)}
        />

        {/* Formulário */}
        {!mostrarResultado && (
          <Card className="border rounded-xl shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">
                Dados da Compra
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FormularioSimulacao
                key={dadosIniciais ? JSON.stringify(dadosIniciais) : "default"}
                onSimular={handleSimular}
                dadosIniciais={dadosIniciais}
              />
            </CardContent>
          </Card>
        )}

        {/* Resultado */}
        {mostrarResultado && projecao && dadosAtuais && (
          <>
            <GraficoProjecao
              projecao={projecao}
              valorSeguranca={dadosAtuais.valorSeguranca}
            />

            <TabelaProjecao
              projecao={projecao}
              valorSeguranca={dadosAtuais.valorSeguranca}
            />

            <VeredictFinaIA
              dados={dadosAtuais}
              projecao={projecao}
              onVeredictChange={setVeredictoAtual}
            />

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() =>
                  lancarComoDespesa.mutate(dadosAtuais)
                }
                disabled={lancarComoDespesa.isPending}
              >
                <FileCheck className="h-4 w-4 mr-2" />
                Confirmar e lançar como despesa futura
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  salvarSimulacao.mutate({
                    ...dadosAtuais,
                    veredicto: veredictoAtual || undefined,
                  })
                }
                disabled={salvarSimulacao.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                Salvar simulação
              </Button>
              <Button variant="ghost" onClick={handleSimularNovamente}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Simular novamente
              </Button>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
