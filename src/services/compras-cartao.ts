import { supabase } from "@/integrations/supabase/client";

/* ======================================================
   TIPOS
====================================================== */

export type ParcelaFatura = {
  id: string;
  compra_id: string;
  numero_parcela: number;
  total_parcelas: number;
  valor: number;
  mes_referencia: string;
  paga: boolean;
  descricao: string;
  data_compra: string;
  // Campos do responsável
  responsavel_id?: string;
  responsavel_nome?: string;
  responsavel_apelido?: string;
  // Campos de categoria
  categoria_id?: string;
  categoria_nome?: string;
  categoria_cor?: string;
  categoria_icone?: string;
};

export type CompraCartaoInput = {
  cartaoId: string;
  descricao: string;
  valorTotal: number;
  parcelas: number;
  parcelaInicial: number;
  mesFatura: Date;
  tipoLancamento: "unica" | "parcelada" | "fixa";
  dataCompra: Date;
  categoriaId?: string;
  responsavelId: string;
};

export type ResumoResponsavel = {
  responsavel_id: string;
  responsavel_nome: string;
  responsavel_apelido: string | null;
  is_titular: boolean;
  total: number;
  qtd_compras: number;
  percentual: number;
};

/* ======================================================
   CRIAR COMPRA COM PARCELAS
====================================================== */

export async function criarCompraCartao(input: CompraCartaoInput): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");

  // 1. Criar a compra
  const { data: compra, error: compraError } = await (supabase as any)
    .from("compras_cartao")
    .insert({
      user_id: user.id,
      cartao_id: input.cartaoId,
      descricao: input.descricao,
      valor_total: input.valorTotal,
      parcelas: input.parcelas,
      parcela_inicial: input.parcelaInicial,
      tipo_lancamento: input.tipoLancamento,
      mes_inicio: input.mesFatura.toISOString().split("T")[0],
      data_compra: input.dataCompra.toISOString().split("T")[0],
      categoria_id: input.categoriaId || null,
      responsavel_id: input.responsavelId,
    })
    .select()
    .single();

  if (compraError) throw compraError;

  // 2. Criar as parcelas
  // Calcular quantas parcelas vão ser criadas (do parcelaInicial até o total)
  const numParcelasACriar = input.parcelas - input.parcelaInicial + 1;
  const valorParcela = input.valorTotal / input.parcelas;
  const parcelasData = [];

  for (let i = 0; i < numParcelasACriar; i++) {
    const numeroParcela = input.parcelaInicial + i;
    // Usar mesFatura como base e adicionar i meses
    const mesReferencia = new Date(
      input.mesFatura.getFullYear(),
      input.mesFatura.getMonth() + i,
      1
    );

    parcelasData.push({
      compra_id: compra.id,
      numero_parcela: numeroParcela,
      total_parcelas: input.parcelas,
      valor: valorParcela,
      mes_referencia: mesReferencia.toISOString().split("T")[0],
      paga: false,
      tipo_recorrencia: input.tipoLancamento === "fixa" ? "fixa" : "normal",
    });
  }

  const { error: parcelasError } = await (supabase as any)
    .from("parcelas_cartao")
    .insert(parcelasData);

  if (parcelasError) throw parcelasError;
}

/* ======================================================
   LISTAR PARCELAS DA FATURA (com responsável)
====================================================== */

export async function listarParcelasDaFatura(
  cartaoId: string,
  mesReferencia: Date
): Promise<ParcelaFatura[]> {
  // Buscar pelo range do mês inteiro (primeiro ao último dia real do mês)
  const ano = mesReferencia.getFullYear();
  const mes = mesReferencia.getMonth();
  const primeiroDia = new Date(ano, mes, 1).toISOString().split("T")[0];
  // Último dia do mês: dia 0 do próximo mês = último dia do mês atual
  const ultimoDia = new Date(ano, mes + 1, 0).toISOString().split("T")[0];

  // Buscar parcelas do mês
  const { data: parcelas, error: parcelasError } = await (supabase as any)
    .from("parcelas_cartao")
    .select(`
      id,
      compra_id,
      numero_parcela,
      valor,
      mes_referencia,
      paga,
      compra:compras_cartao(
        id,
        descricao,
        parcelas,
        data_compra,
        categoria_id,
        responsavel_id,
        categoria:categories(id, name, color, icon),
        responsavel:responsaveis(id, nome, apelido, is_titular)
      )
    `)
    .gte("mes_referencia", primeiroDia)
    .lte("mes_referencia", ultimoDia);

  if (parcelasError) throw parcelasError;
  if (!parcelas) return [];

  // Filtrar apenas parcelas do cartão
  const { data: comprasCartao } = await (supabase as any)
    .from("compras_cartao")
    .select("id")
    .eq("cartao_id", cartaoId);

  const compraIds = new Set((comprasCartao || []).map((c: any) => c.id));

  return parcelas
    .filter((p: any) => compraIds.has(p.compra_id))
    .map((p: any) => ({
      id: p.id,
      compra_id: p.compra_id,
      numero_parcela: p.numero_parcela,
      total_parcelas: p.compra?.parcelas || 1,
      valor: p.valor,
      mes_referencia: p.mes_referencia,
      paga: p.paga,
      descricao: p.compra?.descricao || "",
      data_compra: p.compra?.data_compra || "",
      // Responsável
      responsavel_id: p.compra?.responsavel?.id || null,
      responsavel_nome: p.compra?.responsavel?.nome || null,
      responsavel_apelido: p.compra?.responsavel?.apelido || null,
      // Categoria
      categoria_id: p.compra?.categoria?.id || null,
      categoria_nome: p.compra?.categoria?.name || null,
      categoria_cor: p.compra?.categoria?.color || null,
      categoria_icone: p.compra?.categoria?.icon || null,
    }));
}

/* ======================================================
   RESUMO POR RESPONSÁVEL
====================================================== */

export async function calcularResumoPorResponsavel(
  cartaoId: string,
  mesReferencia: Date
): Promise<ResumoResponsavel[]> {
  const parcelas = await listarParcelasDaFatura(cartaoId, mesReferencia);

  // Agrupar por responsável
  const porResponsavel: Record<string, ResumoResponsavel> = {};
  let totalGeral = 0;

  parcelas.forEach((p) => {
    const valor = Math.abs(p.valor);
    totalGeral += valor;

    const respId = p.responsavel_id || "sem-responsavel";
    
    if (!porResponsavel[respId]) {
      porResponsavel[respId] = {
        responsavel_id: respId,
        responsavel_nome: p.responsavel_nome || "Sem responsável",
        responsavel_apelido: p.responsavel_apelido || null,
        is_titular: false,
        total: 0,
        qtd_compras: 0,
        percentual: 0,
      };
    }

    porResponsavel[respId].total += valor;
    porResponsavel[respId].qtd_compras += 1;
  });

  // Calcular percentuais
  return Object.values(porResponsavel)
    .map((r) => ({
      ...r,
      percentual: totalGeral > 0 ? (r.total / totalGeral) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

/* ======================================================
   MARCAR PARCELA COMO PAGA
====================================================== */

export async function marcarParcelaComoPaga(
  parcelaId: string,
  paga: boolean
): Promise<void> {
  const { error } = await (supabase as any)
    .from("parcelas_cartao")
    .update({ paga })
    .eq("id", parcelaId);

  if (error) throw error;
}

/* ======================================================
   PAGAR FATURA DO MÊS
====================================================== */

export async function pagarFaturaDoMes(
  cartaoId: string,
  mesReferencia: Date
): Promise<void> {
  const parcelas = await listarParcelasDaFatura(cartaoId, mesReferencia);
  const parcelaIds = parcelas.filter((p) => !p.paga).map((p) => p.id);

  if (parcelaIds.length === 0) return;

  const { error } = await (supabase as any)
    .from("parcelas_cartao")
    .update({ paga: true })
    .in("id", parcelaIds);

  if (error) throw error;
}

/* ======================================================
   GERAR MENSAGEM DA FATURA
====================================================== */

export type FormatoMensagem = "detalhado" | "resumido" | "todos";

export async function gerarMensagemFatura(
  cartaoId: string,
  mesReferencia: Date,
  responsavelId: string | null,
  formato: FormatoMensagem = "detalhado"
): Promise<string> {
  const parcelas = await listarParcelasDaFatura(cartaoId, mesReferencia);

  // Buscar info do cartão
  const { data: cartao } = await (supabase as any)
    .from("cartoes")
    .select("nome, dia_vencimento")
    .eq("id", cartaoId)
    .single();

  const nomeCartao = cartao?.nome || "Cartão";
  const diaVencimento = cartao?.dia_vencimento || 10;

  // Data de vencimento
  const mesVencimento = new Date(mesReferencia.getFullYear(), mesReferencia.getMonth() + 1, diaVencimento);
  const vencimentoStr = mesVencimento.toLocaleDateString("pt-BR");

  // Nome do mês
  const nomeMes = mesReferencia.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  // Filtrar por responsável se especificado
  let parcelasFiltradas = parcelas;
  if (responsavelId) {
    parcelasFiltradas = parcelas.filter((p) => p.responsavel_id === responsavelId);
  }

  // Formato: TODOS (resumo por responsável)
  if (formato === "todos") {
    const resumo = await calcularResumoPorResponsavel(cartaoId, mesReferencia);
    const totalGeral = resumo.reduce((sum, r) => sum + r.total, 0);

    let msg = `📋 Fatura ${nomeMes} - ${nomeCartao}\n\n`;

    resumo.forEach((r) => {
      const icone = r.is_titular ? "👤" : "👥";
      msg += `${icone} ${r.responsavel_apelido || r.responsavel_nome}: R$ ${r.total.toFixed(2).replace(".", ",")}\n`;
    });

    msg += `\n────────────────────────────\n`;
    msg += `Total geral: R$ ${totalGeral.toFixed(2).replace(".", ",")}\n`;
    msg += `Vencimento: ${vencimentoStr}`;

    return msg;
  }

  // Calcular total
  const total = parcelasFiltradas.reduce((sum, p) => sum + Math.abs(p.valor), 0);

  // Nome do responsável
  const nomeResponsavel = responsavelId
    ? parcelasFiltradas[0]?.responsavel_apelido || parcelasFiltradas[0]?.responsavel_nome || ""
    : "";

  // Formato: RESUMIDO
  if (formato === "resumido") {
    let msg = `📋 Fatura ${nomeMes}`;
    if (nomeResponsavel) msg += ` - ${nomeResponsavel}`;
    msg += `\n\n`;
    msg += `Cartão: ${nomeCartao}\n`;
    msg += `Total: R$ ${total.toFixed(2).replace(".", ",")}\n`;
    msg += `Vencimento: ${vencimentoStr}`;
    return msg;
  }

  // Formato: DETALHADO (padrão)
  let msg = `📋 Compras do mês ${nomeMes}`;
  if (nomeResponsavel) msg += ` - ${nomeResponsavel}`;
  msg += `\n\n`;
  msg += `Cartão: ${nomeCartao}\n\n`;

  // Listar compras
  parcelasFiltradas
    .sort((a, b) => new Date(a.data_compra).getTime() - new Date(b.data_compra).getTime())
    .forEach((p) => {
      const data = new Date(p.data_compra).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      });
      const valor = `R$ ${Math.abs(p.valor).toFixed(2).replace(".", ",")}`;
      const parcela = p.total_parcelas > 1 ? ` (${p.numero_parcela}/${p.total_parcelas})` : "";
      
      msg += `• ${data} ${p.descricao} — ${valor}${parcela}\n`;
    });

  msg += `\n────────────────────────────\n`;
  msg += `Total: R$ ${total.toFixed(2).replace(".", ",")}\n`;
  msg += `Vencimento da fatura: ${vencimentoStr}`;

  return msg;
}

/* ======================================================
   EDITAR COMPRA
====================================================== */

export async function editarCompra(
  compraId: string,
  dados: {
    descricao?: string;
    valorTotal?: number;
    categoriaId?: string;
    responsavelId?: string;
    mesFatura?: Date;
    parcelaInicial?: number;
  }
): Promise<void> {
  const updateData: any = {};
  
  if (dados.descricao !== undefined) updateData.descricao = dados.descricao;
  if (dados.categoriaId !== undefined) updateData.categoria_id = dados.categoriaId || null;
  if (dados.responsavelId !== undefined) updateData.responsavel_id = dados.responsavelId;

  // Atualizar compra principal
  if (Object.keys(updateData).length > 0) {
    const { error } = await (supabase as any)
      .from("compras_cartao")
      .update(updateData)
      .eq("id", compraId);

    if (error) throw error;
  }

  // Se mudou valor total, recalcular parcelas
  if (dados.valorTotal !== undefined) {
    const { data: compraAtual } = await (supabase as any)
      .from("compras_cartao")
      .select("valor_total, parcelas")
      .eq("id", compraId)
      .single();

    if (compraAtual && compraAtual.valor_total !== dados.valorTotal) {
      const numParcelas = compraAtual.parcelas || 1;
      const novoValorParcela = Number((dados.valorTotal / numParcelas).toFixed(2));

      // Atualizar valor_total na compra
      await (supabase as any)
        .from("compras_cartao")
        .update({ valor_total: dados.valorTotal })
        .eq("id", compraId);

      // Atualizar parcelas não pagas
      await (supabase as any)
        .from("parcelas_cartao")
        .update({ valor: novoValorParcela })
        .eq("compra_id", compraId)
        .eq("paga", false);
    }
  }

  // Se mudou mês da fatura ou parcela inicial, recalcular meses das parcelas
  if (dados.mesFatura !== undefined || dados.parcelaInicial !== undefined) {
    // Buscar dados atuais da compra
    const { data: compra } = await (supabase as any)
      .from("compras_cartao")
      .select("parcelas, parcela_inicial, mes_inicio, valor_total")
      .eq("id", compraId)
      .single();

    if (!compra) throw new Error("Compra não encontrada");

    const novoMesFatura = dados.mesFatura || new Date(compra.mes_inicio);
    const novaParcelaInicial = dados.parcelaInicial ?? compra.parcela_inicial;
    const totalParcelas = compra.parcelas;

    // Atualizar compra com novos valores
    await (supabase as any)
      .from("compras_cartao")
      .update({
        mes_inicio: novoMesFatura.toISOString().split("T")[0],
        parcela_inicial: novaParcelaInicial,
      })
      .eq("id", compraId);

    // Deletar parcelas antigas não pagas
    await (supabase as any)
      .from("parcelas_cartao")
      .delete()
      .eq("compra_id", compraId)
      .eq("paga", false);

    // Buscar parcelas já pagas
    const { data: parcelasPagas } = await (supabase as any)
      .from("parcelas_cartao")
      .select("numero_parcela")
      .eq("compra_id", compraId)
      .eq("paga", true);

    const numerosJaPagos = new Set((parcelasPagas || []).map((p: any) => p.numero_parcela));

    // Recriar parcelas não pagas com novos meses
    const numParcelasTotal = totalParcelas - novaParcelaInicial + 1;
    const valorParcela = compra.valor_total / totalParcelas;
    const novasParcelas = [];

    for (let i = 0; i < numParcelasTotal; i++) {
      const numeroParcela = novaParcelaInicial + i;
      
      // Pular se já está paga
      if (numerosJaPagos.has(numeroParcela)) continue;

      const mesReferencia = new Date(
        novoMesFatura.getFullYear(),
        novoMesFatura.getMonth() + i,
        1
      );

      novasParcelas.push({
        compra_id: compraId,
        numero_parcela: numeroParcela,
        total_parcelas: totalParcelas,
        valor: valorParcela,
        mes_referencia: mesReferencia.toISOString().split("T")[0],
        paga: false,
        tipo_recorrencia: "normal",
      });
    }

    if (novasParcelas.length > 0) {
      const { error: insertError } = await (supabase as any)
        .from("parcelas_cartao")
        .insert(novasParcelas);

      if (insertError) throw insertError;
    }
  }
}

/* ======================================================
   EXCLUIR COMPRA (e parcelas)
====================================================== */

export async function excluirCompra(compraId: string): Promise<void> {
  // Excluir parcelas primeiro
  await (supabase as any)
    .from("parcelas_cartao")
    .delete()
    .eq("compra_id", compraId);

  // Excluir compra
  const { error } = await (supabase as any)
    .from("compras_cartao")
    .delete()
    .eq("id", compraId);

  if (error) throw error;
}