import { format, addMonths, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

/* ======================================================
   CÁLCULO DE MÊS DE FATURA DE CARTÃO DE CRÉDITO
====================================================== */

/**
 * Calcular o mês da fatura baseado na data da compra e dia de fechamento.
 * 
 * Regra unificada (usada em toda a aplicação):
 * - Compras feitas ANTES do dia de fechamento entram na fatura do MÊS ATUAL
 * - Compras feitas NO DIA ou APÓS o fechamento vão para a fatura do MÊS SEGUINTE
 * 
 * Exemplo com fechamento dia 5:
 * - Compra em 04/fev → fatura de fevereiro (fecha dia 5/fev, vence em março)
 * - Compra em 05/fev → fatura de março (fecha dia 5/mar, vence em abril)
 * - Compra em 20/jan → fatura de fevereiro (fecha dia 5/fev, vence em março)
 * 
 * @param dataCompra - Data em que a compra foi realizada
 * @param diaFechamento - Dia do mês em que o cartão fecha a fatura
 * @returns Date representando o primeiro dia do mês da fatura
 */
export function calcularMesFaturaCartao(
  dataCompra: Date,
  diaFechamento: number
): Date {
  const diaCompra = dataCompra.getDate();
  const mesCompra = dataCompra.getMonth();
  const anoCompra = dataCompra.getFullYear();

  if (diaCompra < diaFechamento) {
    // Compra antes do fechamento: vai para a fatura do mês atual
    return new Date(anoCompra, mesCompra, 1);
  } else {
    // Compra no dia ou após o fechamento: vai para a fatura do próximo mês
    return new Date(anoCompra, mesCompra + 1, 1);
  }
}

/**
 * Versão que retorna string no formato "yyyy-MM" para uso em selects e comparações
 */
export function calcularMesFaturaCartaoStr(
  dataCompra: Date,
  diaFechamento: number
): string {
  const mesFatura = calcularMesFaturaCartao(dataCompra, diaFechamento);
  return format(mesFatura, "yyyy-MM");
}

/* ======================================================
   UTILITÁRIOS GERAIS DE DATA
====================================================== */

/**
 * Gera lista de meses disponíveis para seleção de fatura
 * @param quantidade - Número de meses futuros a gerar (default: 12)
 * @returns Array de objetos com value (Date) e label (string formatado)
 */
export function gerarMesesDisponiveis(quantidade: number = 12) {
  const hoje = new Date();
  const meses: { value: Date; label: string }[] = [];

  for (let i = 0; i < quantidade; i++) {
    const mes = startOfMonth(addMonths(hoje, i));
    meses.push({
      value: mes,
      label: format(mes, "MMMM/yyyy", { locale: ptBR }),
    });
  }

  return meses;
}

/**
 * Formata uma data para exibição no formato "Janeiro/2026"
 */
export function formatarMesAno(data: Date): string {
  return format(data, "MMMM/yyyy", { locale: ptBR });
}

/**
 * Calcula o mês de referência para uma parcela específica
 * @param mesInicio - Mês inicial da compra
 * @param numeroParcela - Número da parcela (1-indexed)
 * @param parcelaInicial - A partir de qual parcela começa (default: 1)
 */
export function calcularMesReferenciaParcela(
  mesInicio: Date,
  numeroParcela: number,
  parcelaInicial: number = 1
): Date {
  // Se parcela inicial é 3 e estamos na parcela 3, offset é 0
  // Se parcela inicial é 3 e estamos na parcela 4, offset é 1
  const offset = numeroParcela - parcelaInicial;
  return startOfMonth(addMonths(mesInicio, offset));
}

/**
 * Formata data para formato ISO (YYYY-MM-DD) usado pelo Supabase
 */
export function formatarDataISO(data: Date): string {
  return format(data, "yyyy-MM-dd");
}

/**
 * Retorna o primeiro dia do mês atual
 */
export function getMesAtual(): Date {
  return startOfMonth(new Date());
}
