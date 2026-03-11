import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, addMonths, startOfMonth } from 'date-fns';
import { clampDiaNoMes, calcularDataVencimentoCartao } from '@/lib/dateUtils';

export interface FaturaVirtual {
  id: string;
  type: 'expense';
  amount: number;
  description: string;
  date: string;
  status: 'pending';
  due_date: string;
  created_at: string;
  isFaturaCartao: true;
  cartaoNome: string;
  cartaoCor: string;
  cartaoId: string;
  statusFatura: 'aberta' | 'fechada' | 'pendente' | 'paga';
  mesReferencia: string;
  paga: boolean;
  dataPagamento?: string | null;
}

export function useFaturasNaListagem(mesReferencia?: Date) {
  const { user } = useAuth();
  const mesRefKey = mesReferencia ? format(startOfMonth(mesReferencia), 'yyyy-MM') : 'current';

  return useQuery({
    queryKey: ['faturas-na-listagem', user?.id, mesRefKey],
    queryFn: async (): Promise<FaturaVirtual[]> => {
      if (!user) return [];

      // 1. Buscar cartões do usuário
      const { data: cartoes, error: cartoesError } = await supabase
        .from('cartoes')
        .select('id, nome, cor, dia_fechamento, dia_vencimento')
        .eq('user_id', user.id);

      if (cartoesError || !cartoes?.length) return [];

      // 2. Calcular range de meses centralizado no mês de referência
      const base = mesReferencia ? startOfMonth(mesReferencia) : startOfMonth(new Date());
      const mesesRange: Date[] = [];
      for (let i = -1; i <= 3; i++) {
        mesesRange.push(addMonths(base, i));
      }

      const mesInicioStr = format(mesesRange[0], 'yyyy-MM-dd');
      const mesFimStr = format(mesesRange[mesesRange.length - 1], 'yyyy-MM-dd');

      // 3. Buscar parcelas (pagas e não pagas)
      const { data: parcelas, error: parcelasError } = await supabase
        .from('parcelas_cartao')
        .select('valor, mes_referencia, compra_id, paga, updated_at, compras_cartao!inner(cartao_id, responsavel:responsaveis(is_titular))')
        .eq('ativo', true)
        .gte('mes_referencia', mesInicioStr)
        .lte('mes_referencia', mesFimStr);

      if (parcelasError || !parcelas?.length) return [];

      // 4. Agrupar por cartao_id + mes_referencia
      const grupos = new Map<string, { cartaoId: string; mesRef: string; total: number; temPendente: boolean; ultimaDataPagamento: string | null }>();

      for (const p of parcelas) {
        const compra = p.compras_cartao as any;
        const cartaoId = compra?.cartao_id;
        if (!cartaoId) continue;

        // Filtrar apenas parcelas do titular (null = sem responsável = titular)
        const responsavel = compra?.responsavel;
        const isTitular = responsavel === null || responsavel === undefined || responsavel?.is_titular === true;
        if (!isTitular) continue;

        const mesRef = p.mes_referencia;
        const key = `${cartaoId}-${mesRef}`;
        
        if (!grupos.has(key)) {
          grupos.set(key, { cartaoId, mesRef, total: 0, temPendente: false });
        }
        const grupo = grupos.get(key)!;
        grupo.total += Number(p.valor);
        if (!p.paga) {
          grupo.temPendente = true;
        }
      }

      // 5. Converter em FaturaVirtual
      const cartaoMap = new Map(cartoes.map(c => [c.id, c]));
      const faturas: FaturaVirtual[] = [];

      for (const [key, grupo] of grupos) {
        if (grupo.total <= 0) continue;
        const cartao = cartaoMap.get(grupo.cartaoId);
        if (!cartao) continue;

        const mesRefDate = new Date(grupo.mesRef + 'T00:00:00');
        
        // Calcular data de fechamento deste mês
        const diaFech = clampDiaNoMes(mesRefDate.getFullYear(), mesRefDate.getMonth(), cartao.dia_fechamento);
        const dataFechamento = new Date(mesRefDate.getFullYear(), mesRefDate.getMonth(), diaFech);

        // Calcular data de vencimento
        const dataVencimento = calcularDataVencimentoCartao(dataFechamento, cartao.dia_fechamento, cartao.dia_vencimento);
        const dataVencStr = format(dataVencimento, 'yyyy-MM-dd');

        // Determinar status
        const paga = !grupo.temPendente || grupo.total <= 0;
        let statusFatura: FaturaVirtual['statusFatura'];

        if (paga) {
          statusFatura = 'paga';
        } else {
          const mesRefMonth = mesRefDate.getMonth();
          const mesRefYear = mesRefDate.getFullYear();
          const hoje = new Date();
          const hojeMonth = hoje.getMonth();
          const hojeYear = hoje.getFullYear();

          if (mesRefYear === hojeYear && mesRefMonth === hojeMonth) {
            statusFatura = hoje.getDate() >= cartao.dia_fechamento ? 'fechada' : 'aberta';
          } else if (mesRefDate > startOfMonth(hoje)) {
            statusFatura = 'pendente';
          } else {
            statusFatura = 'fechada';
          }
        }

        faturas.push({
          id: `fatura-${grupo.cartaoId}-${grupo.mesRef}`,
          type: 'expense',
          amount: grupo.total,
          description: `Fatura ${cartao.nome}`,
          date: dataVencStr,
          status: 'pending',
          due_date: dataVencStr,
          created_at: new Date().toISOString(),
          isFaturaCartao: true,
          cartaoNome: cartao.nome,
          cartaoCor: cartao.cor,
          cartaoId: cartao.id,
          statusFatura,
          mesReferencia: grupo.mesRef,
          paga,
        });
      }

      // Ordenar: não pagas primeiro, depois por data
      faturas.sort((a, b) => {
        const aPaga = a.statusFatura === 'paga';
        const bPaga = b.statusFatura === 'paga';
        if (aPaga !== bPaga) return aPaga ? 1 : -1;
        return a.date.localeCompare(b.date);
      });

      return faturas;
    },
    enabled: !!user,
  });
}
