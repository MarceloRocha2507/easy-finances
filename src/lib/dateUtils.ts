import { format, addMonths, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

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
