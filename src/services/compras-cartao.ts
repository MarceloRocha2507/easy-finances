import { supabase } from "@/integrations/supabase/client";
import { 
  calcularMesReferenciaParcela, 
  formatarDataISO 
} from "@/lib/dateUtils";

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
  tipo_lancamento?: string;
  updated_at?: string; // Hora da última alteração
  // Campos do responsável
  responsavel_id?: string;
  responsavel_nome?: string;
  responsavel_apelido?: string;
  is_titular?: boolean;
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

  if (parcelasError && parcelasError.code !== "23505") throw parcelasError;
}

/* ======================================================
   LISTAR PARCELAS DA FATURA (com responsável)
====================================================== */

export async function listarParcelasDaFatura(
  cartaoId: string,
  mesReferencia: Date
): Promise<ParcelaFatura[]> {
  // Calcular range do mês
  const ano = mesReferencia.getFullYear();
  const mes = mesReferencia.getMonth();
  const primeiroDia = `${ano}-${String(mes + 1).padStart(2, "0")}-01`;
  const proximoMes = new Date(ano, mes + 1, 1);
  const fimMes = `${proximoMes.getFullYear()}-${String(proximoMes.getMonth() + 1).padStart(2, "0")}-01`;

  // UMA ÚNICA QUERY otimizada com JOIN e filtro direto no cartão
  const { data: parcelas, error: parcelasError } = await (supabase as any)
    .from("parcelas_cartao")
    .select(`
      id,
      compra_id,
      numero_parcela,
      valor,
      mes_referencia,
      paga,
      created_at,
      updated_at,
      ativo,
      compra:compras_cartao!inner(
        id,
        descricao,
        parcelas,
        data_compra,
        tipo_lancamento,
        categoria_id,
        responsavel_id,
        cartao_id,
        created_at,
        updated_at,
        categoria:categories(id, name, color, icon),
        responsavel:responsaveis(id, nome, apelido, is_titular)
      )
    `)
    .eq("compra.cartao_id", cartaoId)
    .gte("mes_referencia", primeiroDia)
    .lt("mes_referencia", fimMes)
    .eq("ativo", true)
    .order("created_at", { ascending: true });

  if (parcelasError) throw parcelasError;
  if (!parcelas) return [];

  return parcelas.map((p: any) => ({
    id: p.id,
    compra_id: p.compra_id,
    numero_parcela: p.numero_parcela,
    total_parcelas: p.compra?.parcelas || 1,
    valor: p.valor,
    mes_referencia: p.mes_referencia,
    paga: p.paga,
    descricao: p.compra?.descricao || "",
    data_compra: p.compra?.data_compra || "",
    updated_at: p.updated_at || p.compra?.updated_at || p.created_at,
    responsavel_id: p.compra?.responsavel?.id || null,
    responsavel_nome: p.compra?.responsavel?.nome || null,
    responsavel_apelido: p.compra?.responsavel?.apelido || null,
    is_titular: p.compra?.responsavel?.is_titular || false,
    categoria_id: p.compra?.categoria?.id || null,
    categoria_nome: p.compra?.categoria?.name || null,
    categoria_cor: p.compra?.categoria?.color || null,
    categoria_icone: p.compra?.categoria?.icon || null,
    tipo_lancamento: p.compra?.tipo_lancamento || null,
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
    // Usar valor real (positivo ou negativo) para que estornos subtraiam
    const valor = p.valor;
    totalGeral += valor;

    const respId = p.responsavel_id || "sem-responsavel";
    
    if (!porResponsavel[respId]) {
      porResponsavel[respId] = {
        responsavel_id: respId,
        responsavel_nome: p.responsavel_nome || "Sem responsável",
        responsavel_apelido: p.responsavel_apelido || null,
        is_titular: p.is_titular || false,
        total: 0,
        qtd_compras: 0,
        percentual: 0,
      };
    }

    porResponsavel[respId].total += valor;
    porResponsavel[respId].qtd_compras += 1;
  });

  // Calcular percentuais usando valor absoluto do total para evitar divisão negativa
  const totalAbsoluto = Math.abs(totalGeral);
  return Object.values(porResponsavel)
    .map((r) => ({
      ...r,
      percentual: totalAbsoluto > 0 ? (r.total / totalAbsoluto) * 100 : 0,
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

// Helper para formatar moeda
function formatarMoeda(valor: number): string {
  return `R$ ${Math.abs(valor).toFixed(2).replace(".", ",")}`;
}

// Helper para capitalizar primeira letra
function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

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

  // Se não há parcelas, retornar vazio para indicar "sem despesas"
  if (parcelasFiltradas.length === 0) return "";

  // Formato: TODOS (resumo por responsável)
  if (formato === "todos") {
    const resumo = await calcularResumoPorResponsavel(cartaoId, mesReferencia);
    if (resumo.length === 0) return "";
    const totalGeral = resumo.reduce((sum, r) => sum + r.total, 0);
    if (totalGeral === 0) return "";

    let msg = `*${nomeCartao} - ${capitalizar(nomeMes)}*\n\n`;
    msg += `*Resumo por pessoa:*\n`;

    resumo.forEach((r) => {
      const nome = r.responsavel_apelido || r.responsavel_nome;
      msg += `• ${nome}: ${formatarMoeda(r.total)}\n`;
    });

    msg += `\n*Total: ${formatarMoeda(totalGeral)}*\n`;
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
    let msg = `*${nomeCartao} - ${capitalizar(nomeMes)}*\n\n`;
    
    if (nomeResponsavel) {
      msg += `Responsável: ${nomeResponsavel}\n`;
    }
    msg += `${parcelasFiltradas.length} compras\n\n`;
    msg += `*Total: ${formatarMoeda(total)}*\n`;
    msg += `Vencimento: ${vencimentoStr}`;

    return msg;
  }

  // Formato: DETALHADO (padrão)
  let msg = `*${nomeCartao} - ${capitalizar(nomeMes)}*\n`;
  
  if (nomeResponsavel) {
    msg += `Responsável: ${nomeResponsavel}\n`;
  }
  msg += `\n`;

  // Listar compras ordenadas por data
  parcelasFiltradas
    .sort((a, b) => new Date(a.data_compra).getTime() - new Date(b.data_compra).getTime())
    .forEach((p) => {
      const valor = formatarMoeda(p.valor);
      const parcela = p.total_parcelas > 1 ? ` (${p.numero_parcela}/${p.total_parcelas})` : "";
      msg += `• ${p.descricao}: ${valor}${parcela}\n`;
    });

  msg += `\n*Total: ${formatarMoeda(total)}*\n`;
  msg += `Vencimento: ${vencimentoStr}`;

  return msg;
}

/* ======================================================
   GERAR MENSAGEM EM LOTE (FORMATO COMPACTO)
====================================================== */

function abreviarNome(nome: string, max: number = 20): string {
  if (nome.length <= max) return nome;
  return nome.slice(0, max - 3).trimEnd() + "...";
}

export async function gerarMensagemLote(
  cartaoIds: string[],
  mesReferencia: Date,
  responsavelId: string | null
): Promise<string> {
  if (cartaoIds.length === 0) return "";

  // Buscar info de todos os cartões
  const { data: cartoes } = await (supabase as any)
    .from("cartoes")
    .select("id, nome, dia_vencimento")
    .in("id", cartaoIds);

  if (!cartoes || cartoes.length === 0) return "";

  // Buscar parcelas de cada cartão em paralelo
  const resultados = await Promise.all(
    cartaoIds.map(async (cartaoId) => {
      const parcelas = await listarParcelasDaFatura(cartaoId, mesReferencia);
      const cartao = cartoes.find((c: any) => c.id === cartaoId);
      return { cartaoId, cartao, parcelas };
    })
  );

  // Filtrar por responsável e remover cartões sem despesas
  let nomeResponsavel = "";
  const cartoesComDespesas = resultados
    .map(({ cartao, parcelas }) => {
      let filtradas = parcelas;
      if (responsavelId) {
        filtradas = parcelas.filter((p) => p.responsavel_id === responsavelId);
      }
      if (filtradas.length > 0 && responsavelId && !nomeResponsavel) {
        nomeResponsavel = filtradas[0].responsavel_apelido || filtradas[0].responsavel_nome || "";
      }
      return { cartao, parcelas: filtradas };
    })
    .filter(({ parcelas }) => parcelas.length > 0);

  if (cartoesComDespesas.length === 0) return "";

  // Cabeçalho
  const meses = [
    "JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO",
    "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO",
  ];
  const nomeMes = meses[mesReferencia.getMonth()];
  const ano = mesReferencia.getFullYear();
  let msg = `📊 FATURAS - ${nomeMes}/${ano}\n`;

  let totalGeral = 0;

  for (const { cartao, parcelas } of cartoesComDespesas) {
    const totalCartao = parcelas.reduce((sum, p) => sum + Math.abs(p.valor), 0);
    totalGeral += totalCartao;

    // Data vencimento DD/MM
    const diaVenc = cartao?.dia_vencimento || 10;
    const mesVenc = new Date(mesReferencia.getFullYear(), mesReferencia.getMonth() + 1, diaVenc);
    const ddmm = `${String(mesVenc.getDate()).padStart(2, "0")}/${String(mesVenc.getMonth() + 1).padStart(2, "0")}`;

    msg += `\n💳 ${cartao?.nome || "Cartão"} [${ddmm}]: ${formatarMoeda(totalCartao)}\n`;

    // Agrupar compras em pares de 2 por linha
    const comprasOrdenadas = [...parcelas].sort(
      (a, b) => new Date(a.data_compra).getTime() - new Date(b.data_compra).getTime()
    );

    for (let i = 0; i < comprasOrdenadas.length; i += 2) {
      const c1 = comprasOrdenadas[i];
      const item1 = `${abreviarNome(c1.descricao)}: ${formatarMoeda(c1.valor)}`;

      if (i + 1 < comprasOrdenadas.length) {
        const c2 = comprasOrdenadas[i + 1];
        const item2 = `${abreviarNome(c2.descricao)}: ${formatarMoeda(c2.valor)}`;
        msg += `   • ${item1} | ${item2}\n`;
      } else {
        msg += `   • ${item1}\n`;
      }
    }
  }

  // Rodapé
  msg += `\n`;
  if (responsavelId && nomeResponsavel) {
    msg += `Responsável: ${nomeResponsavel} | Total: ${formatarMoeda(totalGeral)}`;
  } else {
    msg += `Total: ${formatarMoeda(totalGeral)}`;
  }

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

      if (insertError && insertError.code !== "23505") throw insertError;
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

/* ======================================================
   EXCLUIR PARCELAS (seletivo)
   - parcela: apenas uma parcela específica
   - restantes: esta e todas as futuras
   - todas: excluir compra inteira
====================================================== */

export type EscopoExclusao = "parcela" | "restantes" | "todas";

export interface ExcluirParcelasInput {
  compraId: string;
  parcelaId: string;
  numeroParcela: number;
  escopo: EscopoExclusao;
}

export async function excluirParcelas(input: ExcluirParcelasInput): Promise<number> {
  const { compraId, parcelaId, numeroParcela, escopo } = input;

  if (escopo === "todas") {
    // Comportamento atual: excluir compra inteira
    const { data: parcelas } = await (supabase as any)
      .from("parcelas_cartao")
      .select("id")
      .eq("compra_id", compraId);
    
    await excluirCompra(compraId);
    return parcelas?.length || 0;
  }

  if (escopo === "parcela") {
    // Excluir apenas uma parcela específica
    await (supabase as any)
      .from("parcelas_cartao")
      .delete()
      .eq("id", parcelaId);
    
    // Atualizar total de parcelas na compra
    await atualizarTotalParcelasCompra(compraId);
    return 1;
  }

  if (escopo === "restantes") {
    // Excluir esta parcela e todas as futuras
    const { data: parcelasExcluidas } = await (supabase as any)
      .from("parcelas_cartao")
      .select("id")
      .eq("compra_id", compraId)
      .gte("numero_parcela", numeroParcela);
    
    await (supabase as any)
      .from("parcelas_cartao")
      .delete()
      .eq("compra_id", compraId)
      .gte("numero_parcela", numeroParcela);
    
    // Atualizar total de parcelas na compra
    await atualizarTotalParcelasCompra(compraId);
    return parcelasExcluidas?.length || 0;
  }

  return 0;
}

/* ======================================================
   EXCLUIR FATURA DO MÊS
   - Exclui todas as compras que possuem parcelas no mês especificado
   - Remove a compra inteira (incluindo parcelas em outros meses)
====================================================== */

export interface ResultadoExclusaoFatura {
  comprasExcluidas: number;
  parcelasExcluidas: number;
}

export async function excluirFaturaDoMes(
  cartaoId: string,
  mesReferencia: Date
): Promise<ResultadoExclusaoFatura> {
  // Buscar parcelas do mês
  const ano = mesReferencia.getFullYear();
  const mes = mesReferencia.getMonth();
  const primeiroDia = new Date(ano, mes, 1).toISOString().split("T")[0];
  const ultimoDia = new Date(ano, mes + 1, 0).toISOString().split("T")[0];

  // Buscar parcelas do mês para este cartão
  const { data: parcelas } = await (supabase as any)
    .from("parcelas_cartao")
    .select(`
      id,
      compra_id,
      compra:compras_cartao(id, cartao_id)
    `)
    .gte("mes_referencia", primeiroDia)
    .lte("mes_referencia", ultimoDia);

  if (!parcelas || parcelas.length === 0) {
    return { comprasExcluidas: 0, parcelasExcluidas: 0 };
  }

  // Filtrar apenas parcelas do cartão especificado
  const parcelasDoCartao = parcelas.filter(
    (p: any) => p.compra?.cartao_id === cartaoId
  );

  if (parcelasDoCartao.length === 0) {
    return { comprasExcluidas: 0, parcelasExcluidas: 0 };
  }

  // Obter IDs únicos das compras
  const compraIds = [...new Set(parcelasDoCartao.map((p: any) => p.compra_id))];

  // Contar total de parcelas que serão excluídas (de todas as compras, não só deste mês)
  const { count: totalParcelas } = await (supabase as any)
    .from("parcelas_cartao")
    .select("id", { count: "exact" })
    .in("compra_id", compraIds);

  // Excluir parcelas primeiro (por causa do cascade/trigger)
  await (supabase as any)
    .from("parcelas_cartao")
    .delete()
    .in("compra_id", compraIds);

  // Excluir as compras
  await (supabase as any)
    .from("compras_cartao")
    .delete()
    .in("id", compraIds);

  return {
    comprasExcluidas: compraIds.length,
    parcelasExcluidas: totalParcelas || parcelasDoCartao.length,
  };
}


async function atualizarTotalParcelasCompra(compraId: string): Promise<void> {
  // Contar parcelas restantes
  const { data: parcelasRestantes, count } = await (supabase as any)
    .from("parcelas_cartao")
    .select("valor", { count: "exact" })
    .eq("compra_id", compraId);
  
  if (!count || count === 0) {
    // Se não sobrou nenhuma parcela, excluir a compra
    await (supabase as any)
      .from("compras_cartao")
      .delete()
      .eq("id", compraId);
  } else {
    // Atualizar o valor_total e parcelas na compra
    const novoTotal = parcelasRestantes?.reduce((sum: number, p: { valor: number }) => sum + p.valor, 0) || 0;
    
    await (supabase as any)
      .from("compras_cartao")
      .update({ 
        valor_total: novoTotal,
        parcelas: count 
      })
      .eq("id", compraId);
  }
}

/* ======================================================
   PAGAR FATURA COM TRANSAÇÃO
   - Marca todas as parcelas como pagas
   - Cria uma transação de despesa no saldo real
   - Registra acertos para os responsáveis que pagaram
====================================================== */

export type PagarFaturaInput = {
  cartaoId: string;
  nomeCartao: string;
  mesReferencia: Date;
  valorTotal: number;
  acertosRecebidos: Array<{
    responsavel_id: string;
    valor: number;
  }>;
};

export async function pagarFaturaComTransacao(input: PagarFaturaInput): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");

  // 1. Marcar todas as parcelas como pagas
  await pagarFaturaDoMes(input.cartaoId, input.mesReferencia);

  // 2. Criar transação de despesa (valor que EU paguei ao banco)
  if (input.valorTotal > 0) {
    const mesLabel = input.mesReferencia.toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    });

    // Buscar ou criar categoria "Fatura de Cartão"
    let categoryId: string | null = null;
    
    const { data: categoriaExistente } = await (supabase as any)
      .from("categories")
      .select("id")
      .eq("user_id", user.id)
      .eq("name", "Fatura de Cartão")
      .eq("type", "expense")
      .single();

    if (categoriaExistente) {
      categoryId = categoriaExistente.id;
    } else {
      // Criar categoria automaticamente
      const { data: novaCategoria } = await (supabase as any)
        .from("categories")
        .insert({
          user_id: user.id,
          name: "Fatura de Cartão",
          icon: "credit-card",
          color: "#8B5CF6",
          type: "expense",
          is_default: true,
        })
        .select("id")
        .single();
      
      categoryId = novaCategoria?.id || null;
    }

    const { error: transactionError } = await (supabase as any)
      .from("transactions")
      .insert({
        user_id: user.id,
        description: `Fatura ${input.nomeCartao} - ${mesLabel}`,
        amount: input.valorTotal,
        type: "expense",
        status: "completed",
        date: new Date().toISOString().split("T")[0],
        paid_date: new Date().toISOString().split("T")[0],
        category_id: categoryId,
        tipo_lancamento: "unica",
      });

    if (transactionError) throw transactionError;
  }

  // 3. Registrar acertos para quem pagou sua parte
  const mesStr = `${input.mesReferencia.getFullYear()}-${String(input.mesReferencia.getMonth() + 1).padStart(2, "0")}-01`;

  for (const acerto of input.acertosRecebidos) {
    // Buscar ou criar acerto
    const { data: acertoExistente } = await (supabase as any)
      .from("acertos_fatura")
      .select("*")
      .eq("cartao_id", input.cartaoId)
      .eq("responsavel_id", acerto.responsavel_id)
      .eq("mes_referencia", mesStr)
      .single();

    if (acertoExistente) {
      // Atualizar como quitado
      await (supabase as any)
        .from("acertos_fatura")
        .update({
          valor_pago: acerto.valor,
          data_acerto: new Date().toISOString(),
          status: "quitado",
        })
        .eq("id", acertoExistente.id);
    } else {
      // Criar novo acerto já quitado
      await (supabase as any)
        .from("acertos_fatura")
        .insert({
          user_id: user.id,
          cartao_id: input.cartaoId,
          responsavel_id: acerto.responsavel_id,
          mes_referencia: mesStr,
          valor_devido: acerto.valor,
          valor_pago: acerto.valor,
          data_acerto: new Date().toISOString(),
          status: "quitado",
        });
    }
  }
}

/* ======================================================
   ENCERRAR DESPESA FIXA
   - Marca a compra como inativa
   - Desativa parcelas futuras não pagas
====================================================== */

export async function encerrarDespesaFixa(compraId: string): Promise<void> {
  // Marca a compra como inativa
  const { error: compraError } = await (supabase as any)
    .from("compras_cartao")
    .update({ ativo: false })
    .eq("id", compraId);

  if (compraError) {
    throw new Error("Não foi possível encerrar a despesa fixa");
  }

  // Remove parcelas futuras não pagas
  const hoje = formatarDataISO(new Date());
  const { error: parcelasError } = await (supabase as any)
    .from("parcelas_cartao")
    .update({ ativo: false })
    .eq("compra_id", compraId)
    .eq("paga", false)
    .gte("mes_referencia", hoje);

  if (parcelasError) {
    console.error("Erro ao desativar parcelas:", parcelasError);
  }
}

/* ======================================================
   GERAR PRÓXIMAS PARCELAS FIXAS
   - Expande o horizonte de planejamento para despesas fixas
====================================================== */

export async function gerarProximasParcelasFixas(
  compraId: string,
  mesesAdicionais: number = 6
): Promise<void> {
  // Busca a compra
  const { data: compra, error: compraError } = await (supabase as any)
    .from("compras_cartao")
    .select("*")
    .eq("id", compraId)
    .eq("tipo_lancamento", "fixa")
    .eq("ativo", true)
    .single();

  if (compraError || !compra) {
    throw new Error("Compra fixa não encontrada");
  }

  // Busca a última parcela
  const { data: ultimaParcela, error: parcelaError } = await (supabase as any)
    .from("parcelas_cartao")
    .select("numero_parcela, mes_referencia")
    .eq("compra_id", compraId)
    .eq("ativo", true)
    .order("numero_parcela", { ascending: false })
    .limit(1)
    .single();

  if (parcelaError) {
    throw new Error("Erro ao buscar parcelas");
  }

  const ultimoNumero = ultimaParcela?.numero_parcela || 0;
  const ultimoMes = ultimaParcela?.mes_referencia 
    ? new Date(ultimaParcela.mes_referencia) 
    : new Date(compra.mes_inicio);

  // Gera novas parcelas
  const novasParcelas: Array<{
    compra_id: string;
    numero_parcela: number;
    total_parcelas: number;
    valor: number;
    mes_referencia: string;
    paga: boolean;
    tipo_recorrencia: string;
    ativo: boolean;
  }> = [];

  for (let i = 1; i <= mesesAdicionais; i++) {
    const mesReferencia = calcularMesReferenciaParcela(ultimoMes, i + 1, 1);
    novasParcelas.push({
      compra_id: compraId,
      numero_parcela: ultimoNumero + i,
      total_parcelas: ultimoNumero + mesesAdicionais,
      valor: Number(compra.valor_total),
      mes_referencia: formatarDataISO(mesReferencia),
      paga: false,
      tipo_recorrencia: "fixa",
      ativo: true,
    });
  }

  const { error: insertError } = await (supabase as any)
    .from("parcelas_cartao")
    .insert(novasParcelas);

  if (insertError && insertError.code !== "23505") {
    throw new Error("Erro ao gerar novas parcelas");
  }

  // Atualiza total de parcelas na compra
  await (supabase as any)
    .from("compras_cartao")
    .update({ parcelas: ultimoNumero + mesesAdicionais })
    .eq("id", compraId);
}

/* ======================================================
   CRIAR AJUSTE DE FATURA
   - Cria uma transação de ajuste (crédito ou débito)
   - Crédito: reduz o valor da fatura (estorno, cashback)
   - Débito: aumenta o valor da fatura (taxa, juros)
====================================================== */

export type AjusteFaturaInput = {
  cartao_id: string;
  valor: number;
  tipo: "credito" | "debito";
  descricao: string;
  mes_referencia: Date;
  categoria_id?: string;
  responsavel_id?: string;
  observacao?: string;
};

export async function criarAjusteFatura(input: AjusteFaturaInput): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");

  // Para ajustes:
  // - Crédito (reduz fatura): valor negativo na parcela
  // - Débito (aumenta fatura): valor positivo na parcela
  const valorParcela = input.tipo === "credito" ? -input.valor : input.valor;
  const mesRef = new Date(
    input.mes_referencia.getFullYear(),
    input.mes_referencia.getMonth(),
    1
  );

  // 1. Criar a compra de ajuste
  const { data: compra, error: compraError } = await (supabase as any)
    .from("compras_cartao")
    .insert({
      user_id: user.id,
      cartao_id: input.cartao_id,
      descricao: input.descricao,
      valor_total: input.valor,
      parcelas: 1,
      parcela_inicial: 1,
      tipo_lancamento: "ajuste",
      mes_inicio: mesRef.toISOString().split("T")[0],
      data_compra: new Date().toISOString().split("T")[0],
      categoria_id: input.categoria_id || null,
      responsavel_id: input.responsavel_id || null,
    })
    .select()
    .single();

  if (compraError) throw compraError;

  // 2. Criar a parcela de ajuste
  const { error: parcelaError } = await (supabase as any)
    .from("parcelas_cartao")
    .insert({
      compra_id: compra.id,
      numero_parcela: 1,
      total_parcelas: 1,
      valor: valorParcela,
      mes_referencia: mesRef.toISOString().split("T")[0],
      paga: false,
      tipo_recorrencia: "normal",
    });

  if (parcelaError && parcelaError.code !== "23505") throw parcelaError;
}

/* ======================================================
   ESTORNAR COMPRA
   - Cria uma compra de estorno vinculada à original
   - Registra parcela(s) com valor negativo
====================================================== */

export type EstornoInput = {
  parcelaId: string;
  compraId: string;
  valor: number;
  motivo: string;
  escopoEstorno: "parcela" | "todas";
  observacao?: string;
};

export async function estornarCompra(input: EstornoInput): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");

  // 1. Buscar dados da parcela e compra original
  const { data: parcelaOriginal, error: parcelaError } = await (supabase as any)
    .from("parcelas_cartao")
    .select(`
      id,
      valor,
      numero_parcela,
      total_parcelas,
      mes_referencia,
      compra:compras_cartao(
        id,
        cartao_id,
        descricao,
        valor_total,
        parcelas,
        responsavel_id,
        categoria_id
      )
    `)
    .eq("id", input.parcelaId)
    .single();

  if (parcelaError || !parcelaOriginal) {
    throw new Error("Parcela não encontrada");
  }

  const compraOriginal = parcelaOriginal.compra;
  if (!compraOriginal) {
    throw new Error("Compra não encontrada");
  }

  // 2. Calcular valores e parcelas do estorno
  let valorEstorno = input.valor;
  let numParcelas = 1;
  let mesReferencia = new Date(parcelaOriginal.mes_referencia);

  if (input.escopoEstorno === "todas") {
    // Estornar todas as parcelas restantes
    const parcelasRestantes = parcelaOriginal.total_parcelas - parcelaOriginal.numero_parcela + 1;
    numParcelas = parcelasRestantes;
    // O valor informado já é o valor por parcela, não precisa dividir
  }

  // 3. Descrição do estorno
  const motivoLabel = {
    cancelamento: "Cancelamento",
    devolucao: "Devolução",
    cobranca_indevida: "Cobrança indevida",
    garantia: "Garantia",
    outro: "Estorno",
  }[input.motivo] || "Estorno";

  const descricaoEstorno = `${motivoLabel}: ${compraOriginal.descricao}`;

  // 4. Criar compra de estorno vinculada à original
  const { data: compraEstorno, error: compraError } = await (supabase as any)
    .from("compras_cartao")
    .insert({
      user_id: user.id,
      cartao_id: compraOriginal.cartao_id,
      descricao: descricaoEstorno,
      valor_total: input.escopoEstorno === "todas" ? input.valor * numParcelas : input.valor,
      parcelas: numParcelas,
      parcela_inicial: parcelaOriginal.numero_parcela,
      tipo_lancamento: "estorno",
      mes_inicio: mesReferencia.toISOString().split("T")[0],
      data_compra: new Date().toISOString().split("T")[0],
      categoria_id: compraOriginal.categoria_id,
      responsavel_id: compraOriginal.responsavel_id,
      compra_estornada_id: compraOriginal.id,
    })
    .select()
    .single();

  if (compraError) throw compraError;

  // 5. Criar parcela(s) com valor negativo
  const parcelasData = [];

  for (let i = 0; i < numParcelas; i++) {
    const mesParcela = new Date(
      mesReferencia.getFullYear(),
      mesReferencia.getMonth() + i,
      1
    );

    parcelasData.push({
      compra_id: compraEstorno.id,
      numero_parcela: parcelaOriginal.numero_parcela + i,
      total_parcelas: parcelaOriginal.total_parcelas,
      valor: -Math.abs(valorEstorno), // Valor negativo para crédito
      mes_referencia: mesParcela.toISOString().split("T")[0],
      paga: false,
      tipo_recorrencia: "normal",
    });
  }

  const { error: insertError } = await (supabase as any)
    .from("parcelas_cartao")
    .insert(parcelasData);

  if (insertError && insertError.code !== "23505") throw insertError;
}

/* ======================================================
   REGENERAR PARCELAS FALTANTES
====================================================== */

export type ResultadoRegeneracao = {
  comprasVerificadas: number;
  parcelasRegeneradas: number;
  erros: string[];
};

export async function regenerarParcelasFaltantes(): Promise<ResultadoRegeneracao> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");

  const resultado: ResultadoRegeneracao = {
    comprasVerificadas: 0,
    parcelasRegeneradas: 0,
    erros: [],
  };

  // 1. Buscar todas as compras ativas do usuário
  const { data: compras, error: comprasError } = await supabase
    .from("compras_cartao")
    .select("id, descricao, valor_total, parcelas, parcela_inicial, mes_inicio, tipo_lancamento")
    .eq("user_id", user.id)
    .eq("ativo", true);

  if (comprasError) throw comprasError;
  if (!compras || compras.length === 0) return resultado;

  resultado.comprasVerificadas = compras.length;

  for (const compra of compras) {
    try {
      // 2. Verificar quantas parcelas existem para esta compra
      const { count, error: countError } = await supabase
        .from("parcelas_cartao")
        .select("*", { count: "exact", head: true })
        .eq("compra_id", compra.id);

      if (countError) {
        resultado.erros.push(`Erro ao verificar ${compra.descricao}: ${countError.message}`);
        continue;
      }

      // Calcular quantas parcelas deveriam existir
      const numParcelasEsperadas = compra.parcelas - compra.parcela_inicial + 1;
      const parcelasExistentes = count || 0;

      // 3. Se faltam parcelas, regenerar
      if (parcelasExistentes < numParcelasEsperadas) {
        // Buscar parcelas existentes para saber quais números já existem
        const { data: parcelasAtuais } = await supabase
          .from("parcelas_cartao")
          .select("numero_parcela")
          .eq("compra_id", compra.id);

        const numerosExistentes = new Set((parcelasAtuais || []).map(p => p.numero_parcela));
        
        // Criar parcelas faltantes
        const valorParcela = compra.valor_total / compra.parcelas;
        const mesInicio = new Date(compra.mes_inicio + "T00:00:00");
        const novasParcelas = [];

        for (let i = 0; i < numParcelasEsperadas; i++) {
          const numeroParcela = compra.parcela_inicial + i;
          
          // VALIDAÇÃO CRÍTICA: nunca criar parcela maior que o total
          if (numeroParcela > compra.parcelas) continue;
          
          // Pular se já existe
          if (numerosExistentes.has(numeroParcela)) continue;

          const mesParcela = new Date(mesInicio);
          mesParcela.setMonth(mesParcela.getMonth() + i);

          // Determinar se a parcela deveria estar paga baseado no mês
          const hoje = new Date();
          const mesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
          const parcelaPaga = mesParcela < mesAtual; // Meses anteriores = pagos

          novasParcelas.push({
            compra_id: compra.id,
            numero_parcela: numeroParcela,
            total_parcelas: compra.parcelas,
            valor: valorParcela,
            mes_referencia: mesParcela.toISOString().split("T")[0],
            paga: parcelaPaga,
            ativo: true,
            tipo_recorrencia: compra.tipo_lancamento === "fixa" ? "fixa" : "normal",
          });
        }

        if (novasParcelas.length > 0) {
          const { error: insertError } = await (supabase as any)
            .from("parcelas_cartao")
            .insert(novasParcelas);

          if (insertError) {
            // Ignorar erro de duplicata (código 23505)
            if (insertError.code !== "23505") {
              resultado.erros.push(`Erro ao criar parcelas de ${compra.descricao}: ${insertError.message}`);
            }
          } else {
            resultado.parcelasRegeneradas += novasParcelas.length;
          }
        }
      }
    } catch (err: any) {
      resultado.erros.push(`Erro em ${compra.descricao}: ${err.message}`);
    }
  }

  return resultado;
}

/* ======================================================
   ADIANTAR FATURA (PAGAMENTO PARCIAL)
   - Cria um crédito na fatura (linha negativa) para reduzir o saldo
   - NÃO marca parcelas como pagas automaticamente (por padrão)
   - Cria transação de despesa no saldo real
   - Retorna IDs criados para permitir desfazer
====================================================== */

export type AdiantarFaturaInput = {
  cartaoId: string;
  nomeCartao: string;
  mesReferencia: Date;
  valorAdiantamento: number;
  observacao?: string;
  marcarParcelasComoPagas?: boolean; // Opção avançada (desligado por padrão)
};

export type AdiantarFaturaResult = {
  compraId: string;
  parcelaId: string;
  transactionId: string;
  parcelasMarcardasPagas: string[];
};

export async function adiantarFatura(input: AdiantarFaturaInput): Promise<AdiantarFaturaResult> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");

  const mesRef = new Date(
    input.mesReferencia.getFullYear(),
    input.mesReferencia.getMonth(),
    1
  );

  const mesLabel = input.mesReferencia.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  const descricaoAdiantamento = input.observacao
    ? `Adiantamento ${input.nomeCartao} - ${mesLabel} (${input.observacao})`
    : `Adiantamento ${input.nomeCartao} - ${mesLabel}`;

  // 1. Criar a compra de adiantamento como ajuste/crédito
  const { data: compra, error: compraError } = await (supabase as any)
    .from("compras_cartao")
    .insert({
      user_id: user.id,
      cartao_id: input.cartaoId,
      descricao: descricaoAdiantamento,
      valor_total: input.valorAdiantamento,
      parcelas: 1,
      parcela_inicial: 1,
      tipo_lancamento: "ajuste",
      mes_inicio: mesRef.toISOString().split("T")[0],
      data_compra: new Date().toISOString().split("T")[0],
      categoria_id: null,
      responsavel_id: null,
    })
    .select()
    .single();

  if (compraError) throw compraError;

  // 2. Criar a parcela com valor NEGATIVO (reduz o saldo da fatura)
  const { data: parcela, error: parcelaError } = await (supabase as any)
    .from("parcelas_cartao")
    .insert({
      compra_id: compra.id,
      numero_parcela: 1,
      total_parcelas: 1,
      valor: -input.valorAdiantamento, // NEGATIVO para reduzir a fatura
      mes_referencia: mesRef.toISOString().split("T")[0],
      paga: true, // Já está "pago" pois é um crédito aplicado
      tipo_recorrencia: "normal",
      ativo: true,
    })
    .select()
    .single();

  if (parcelaError) throw parcelaError;

  // 3. Buscar ou criar categoria "Fatura de Cartão"
  let categoryId: string | null = null;

  const { data: categoriaExistente } = await (supabase as any)
    .from("categories")
    .select("id")
    .eq("user_id", user.id)
    .eq("name", "Fatura de Cartão")
    .eq("type", "expense")
    .single();

  if (categoriaExistente) {
    categoryId = categoriaExistente.id;
  } else {
    const { data: novaCategoria } = await (supabase as any)
      .from("categories")
      .insert({
        user_id: user.id,
        name: "Fatura de Cartão",
        icon: "credit-card",
        color: "#8B5CF6",
        type: "expense",
        is_default: true,
      })
      .select("id")
      .single();

    categoryId = novaCategoria?.id || null;
  }

  // 4. Criar transação de despesa no saldo real
  const { data: transaction, error: transactionError } = await (supabase as any)
    .from("transactions")
    .insert({
      user_id: user.id,
      description: descricaoAdiantamento,
      amount: input.valorAdiantamento,
      type: "expense",
      status: "completed",
      date: new Date().toISOString().split("T")[0],
      paid_date: new Date().toISOString().split("T")[0],
      category_id: categoryId,
      tipo_lancamento: "unica",
    })
    .select()
    .single();

  if (transactionError) throw transactionError;

  // 5. Opcionalmente, marcar parcelas como pagas (modo avançado)
  let parcelasMarcardasPagas: string[] = [];

  if (input.marcarParcelasComoPagas) {
    const parcelas = await listarParcelasDaFatura(input.cartaoId, input.mesReferencia);
    const parcelasPendentes = parcelas
      .filter((p) => !p.paga && p.valor > 0)
      .sort((a, b) => {
        const dataA = a.data_compra ? new Date(a.data_compra).getTime() : 0;
        const dataB = b.data_compra ? new Date(b.data_compra).getTime() : 0;
        return dataA - dataB;
      });

    let valorRestante = input.valorAdiantamento;

    for (const parcela of parcelasPendentes) {
      if (valorRestante <= 0) break;
      const valorParcela = Math.abs(parcela.valor);
      if (valorParcela <= valorRestante) {
        parcelasMarcardasPagas.push(parcela.id);
        valorRestante -= valorParcela;
      }
    }

    if (parcelasMarcardasPagas.length > 0) {
      await (supabase as any)
        .from("parcelas_cartao")
        .update({ paga: true })
        .in("id", parcelasMarcardasPagas);
    }
  }

  return {
    compraId: compra.id,
    parcelaId: parcela.id,
    transactionId: transaction.id,
    parcelasMarcardasPagas,
  };
}

/* ======================================================
   DESFAZER ADIANTAMENTO
   - Remove a compra/parcela de ajuste e a transação correspondente
====================================================== */

export async function desfazerAdiantamento(result: AdiantarFaturaResult): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");

  // 1. Desmarcar parcelas que foram marcadas como pagas
  if (result.parcelasMarcardasPagas.length > 0) {
    await (supabase as any)
      .from("parcelas_cartao")
      .update({ paga: false })
      .in("id", result.parcelasMarcardasPagas);
  }

  // 2. Deletar a parcela de ajuste
  await (supabase as any)
    .from("parcelas_cartao")
    .delete()
    .eq("id", result.parcelaId);

  // 3. Deletar a compra de ajuste
  await (supabase as any)
    .from("compras_cartao")
    .delete()
    .eq("id", result.compraId);

  // 4. Deletar a transação de despesa
  await (supabase as any)
    .from("transactions")
    .delete()
    .eq("id", result.transactionId);
}