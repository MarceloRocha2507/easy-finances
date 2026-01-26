import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { criarCompraCartao, CompraCartaoInput } from "./compras-cartao";
import { supabase } from "@/integrations/supabase/client";
import type { Responsavel } from "./responsaveis";
import { calcularMesFaturaCartaoStr } from "@/lib/dateUtils";

/* ======================================================
   Types
====================================================== */

export interface DuplicataInfo {
  compraId: string;
  descricao: string;
  origemDuplicata: "banco" | "lote";
  parcelaEncontrada?: number;
  mesInicio?: string;
  // Campos de diagnóstico
  motivoDetalhado?: string;
  fingerprintCalculado?: string;
  descricaoBase?: string;
  mesBase?: string;
}

export interface PreviewCompra {
  linha: number;
  dataOriginal: string;
  dataCompra: Date | null;
  descricao: string;
  valor: number;           // Valor da parcela individual
  valorTotal: number;      // Valor total da compra (valor × parcelas)
  responsavelId: string | null;
  responsavelNome: string;
  responsavelInput: string;
  mesFatura: string;
  tipoLancamento: "unica" | "parcelada";
  parcelas: number;
  parcelaInicial: number;
  valido: boolean;
  erro?: string;
  // Campos para verificação de duplicatas
  possivelDuplicata: boolean;
  duplicataInfo?: DuplicataInfo;
  forcarImportacao: boolean;
  // Fingerprint para identificar compra base
  fingerprint?: string;
}

export interface ResultadoImportacao {
  sucesso: number;
  erros: number;
  detalhes: { linha: number; erro?: string }[];
}

export interface OpcaoMesFatura {
  valor: string;
  label: string;
  sugerido: boolean;
}

/* ======================================================
   Helpers
====================================================== */

/**
 * Detectar padrão de parcela na descrição
 * Padrões: "Parcela X/Y", " - X/Y", "(X/Y)"
 */
function detectarParcela(descricao: string): {
  tipoLancamento: "unica" | "parcelada";
  parcelaAtual: number;
  totalParcelas: number;
  descricaoLimpa: string;
} {
  // Padrões: "Parcela 1/2", " - 1/2", "(1/2)", "1/2" no final
  const padroes = [
    /[-–]\s*[Pp]arcela\s+(\d+)\/(\d+)/i,  // - Parcela 1/2
    /[Pp]arcela\s+(\d+)\/(\d+)/i,          // Parcela 1/2
    /[-–]\s*(\d+)\/(\d+)/,                 // - 1/2
    /\((\d+)\/(\d+)\)/,                    // (1/2)
    /\s(\d+)\/(\d+)$/,                     // espaço 1/2 no final
  ];

  for (const padrao of padroes) {
    const match = descricao.match(padrao);
    if (match) {
      const parcelaAtual = parseInt(match[1], 10);
      const totalParcelas = parseInt(match[2], 10);
      
      // Validar se faz sentido
      if (parcelaAtual > 0 && totalParcelas > 0 && parcelaAtual <= totalParcelas) {
        // Remover o padrão de parcela da descrição
        let descricaoLimpa = descricao.replace(padrao, "").trim();
        // Limpar traços ou espaços extras no final
        descricaoLimpa = descricaoLimpa.replace(/[-–]\s*$/, "").trim();
        
        return {
          tipoLancamento: "parcelada",
          parcelaAtual,
          totalParcelas,
          descricaoLimpa,
        };
      }
    }
  }

  return {
    tipoLancamento: "unica",
    parcelaAtual: 1,
    totalParcelas: 1,
    descricaoLimpa: descricao,
  };
}

/**
 * Mapear apelido para responsável cadastrado
 */
function mapearResponsavel(
  apelido: string,
  responsaveis: Responsavel[]
): { id: string; nome: string } | null {
  const apelidoLower = apelido.toLowerCase().trim();
  
  // Busca exata por apelido
  const porApelido = responsaveis.find(
    (r) => r.apelido?.toLowerCase() === apelidoLower
  );
  if (porApelido) {
    return { id: porApelido.id, nome: porApelido.apelido || porApelido.nome };
  }

  // Busca por nome
  const porNome = responsaveis.find(
    (r) => r.nome.toLowerCase() === apelidoLower
  );
  if (porNome) {
    return { id: porNome.id, nome: porNome.apelido || porNome.nome };
  }

  // Mapeamentos especiais
  if (apelidoLower === "eu") {
    const titular = responsaveis.find((r) => r.is_titular);
    if (titular) {
      return { id: titular.id, nome: titular.apelido || titular.nome };
    }
  }

  // Busca parcial para variações (mae/mãe, pai, etc)
  const normalizado = apelidoLower
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // Remove acentos

  const parcial = responsaveis.find((r) => {
    const nomeNorm = r.nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const apelidoNorm = r.apelido?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || "";
    return nomeNorm.includes(normalizado) || apelidoNorm.includes(normalizado);
  });

  if (parcial) {
    return { id: parcial.id, nome: parcial.apelido || parcial.nome };
  }

  return null;
}

/**
 * Parsear valor monetário em diferentes formatos
 * Suporta: 0.16, 0,16, 1.234,56, 1,234.56
 */
function parsearValor(valorStr: string): number | null {
  if (!valorStr || !valorStr.trim()) return null;

  let str = valorStr.trim();

  // Remove R$ e espaços
  str = str.replace(/R\$\s*/gi, "").trim();

  // Detecta formato brasileiro (vírgula como decimal)
  // Se tem ponto antes de vírgula: 1.234,56 -> brasileiro
  // Se tem vírgula antes de ponto: 1,234.56 -> americano
  
  const ultimoPonto = str.lastIndexOf(".");
  const ultimaVirgula = str.lastIndexOf(",");

  if (ultimaVirgula > ultimoPonto) {
    // Formato brasileiro: 1.234,56 ou 0,16
    str = str.replace(/\./g, ""); // Remove pontos de milhar
    str = str.replace(",", "."); // Vírgula -> ponto decimal
  } else if (ultimoPonto > ultimaVirgula) {
    // Formato americano: 1,234.56 ou 0.16
    str = str.replace(/,/g, ""); // Remove vírgulas de milhar
  }

  const valor = parseFloat(str);
  return isNaN(valor) ? null : valor;
}

/**
 * Parsear data em diferentes formatos
 * Suporta: YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY
 */
function parsearData(dataStr: string): Date | null {
  if (!dataStr || !dataStr.trim()) return null;

  const str = dataStr.trim();

  // Formato ISO: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [ano, mes, dia] = str.split("-").map(Number);
    return new Date(ano, mes - 1, dia, 12, 0, 0);
  }

  // Formato BR: DD/MM/YYYY ou DD-MM-YYYY
  if (/^\d{2}[\/\-]\d{2}[\/\-]\d{4}$/.test(str)) {
    const partes = str.split(/[\/\-]/);
    const [dia, mes, ano] = partes.map(Number);
    return new Date(ano, mes - 1, dia, 12, 0, 0);
  }

  return null;
}

/* ======================================================
   Parsing principal
====================================================== */

/**
 * Parsear texto de importação em lote
 * Formato esperado: Data,Descrição,Valor Responsável
 */
export function parseLinhasCompra(
  texto: string,
  responsaveis: Responsavel[],
  diaFechamento: number
): PreviewCompra[] {
  const linhas = texto.split("\n").filter((l) => l.trim());
  const resultado: PreviewCompra[] = [];

  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i].trim();
    if (!linha) continue;

    const preview: PreviewCompra = {
      linha: i + 1,
      dataOriginal: "",
      dataCompra: null,
      descricao: "",
      valor: 0,
      valorTotal: 0,
      responsavelId: null,
      responsavelNome: "",
      responsavelInput: "",
      mesFatura: "",
      tipoLancamento: "unica",
      parcelas: 1,
      parcelaInicial: 1,
      valido: false,
      possivelDuplicata: false,
      forcarImportacao: false,
    };

    try {
      // Estratégia: último item contém "valor responsavel"
      // Data é o primeiro item
      // Descrição é o meio
      
      // Separar por vírgula, mas cuidado com valores tipo "102,25"
      // Abordagem: extrair data no início, responsável no final
      
      // Encontrar a data no início (YYYY-MM-DD ou DD/MM/YYYY)
      const matchData = linha.match(/^(\d{4}-\d{2}-\d{2}|\d{2}[\/\-]\d{2}[\/\-]\d{4})\s*[,;]?\s*/);
      
      if (!matchData) {
        preview.erro = "Data não encontrada no início da linha";
        resultado.push(preview);
        continue;
      }

      preview.dataOriginal = matchData[1];
      preview.dataCompra = parsearData(matchData[1]);

      if (!preview.dataCompra) {
        preview.erro = "Data inválida";
        resultado.push(preview);
        continue;
      }

      // Remover a data do início
      let resto = linha.substring(matchData[0].length).trim();

      // Encontrar responsável no final (última palavra)
      // Formato: "... ,valor responsavel"
      // IMPORTANTE: NÃO consumir o padrão X/Y (parcela) - ele deve ficar na descrição
      
      // Regex principal: exige delimitador (,;) antes do valor para evitar capturar "8,175.00"
      let matchFinal = resto.match(/[,;]\s*([\d.,]+)\s+([^\s]+)\s*$/);
      
      // Fallback: espaço antes do valor (formato sem vírgula)
      if (!matchFinal) {
        matchFinal = resto.match(/\s([\d.,]+)\s+([^\s]+)\s*$/);
      }
      
      if (!matchFinal) {
        preview.erro = "Formato inválido: esperado 'valor responsável' no final";
        resultado.push(preview);
        continue;
      }

      const valorStr = matchFinal[1];
      preview.responsavelInput = matchFinal[2];

      preview.valor = parsearValor(valorStr) || 0;
      if (preview.valor <= 0) {
        preview.erro = `Valor inválido: ${valorStr}`;
        resultado.push(preview);
        continue;
      }

      // Mapear responsável
      const resp = mapearResponsavel(preview.responsavelInput, responsaveis);
      if (resp) {
        preview.responsavelId = resp.id;
        preview.responsavelNome = resp.nome;
      } else {
        preview.responsavelNome = preview.responsavelInput;
        preview.erro = `Responsável não encontrado: "${preview.responsavelInput}"`;
      }

      // Extrair descrição (meio da linha)
      // Usar matchFinal.index para preservar o padrão X/Y na descrição
      const idx = matchFinal.index ?? (resto.length - matchFinal[0].length);
      resto = resto.slice(0, idx).trim();
      // Remover vírgula/ponto-e-vírgula inicial ou final se houver
      resto = resto.replace(/^[,;]\s*/, "").replace(/[,;]\s*$/, "").trim();
      
      preview.descricao = resto;

      if (!preview.descricao) {
        preview.erro = "Descrição não encontrada";
        resultado.push(preview);
        continue;
      }

      // Detectar parcelas na descrição
      const parcela = detectarParcela(preview.descricao);
      preview.tipoLancamento = parcela.tipoLancamento;
      preview.parcelas = parcela.totalParcelas;
      preview.parcelaInicial = parcela.parcelaAtual;
      // Mantemos a descrição original para preservar informação
      // preview.descricao = parcela.descricaoLimpa;

      // Calcular valor total (valor da parcela × total de parcelas)
      preview.valorTotal = preview.tipoLancamento === "parcelada"
        ? preview.valor * preview.parcelas
        : preview.valor;

      // Calcular mês da fatura usando função centralizada
      preview.mesFatura = calcularMesFaturaCartaoStr(preview.dataCompra, diaFechamento);

      // Marcar como válido se tiver responsável
      preview.valido = !!preview.responsavelId;

    } catch (e) {
      preview.erro = "Erro ao processar linha";
    }

    resultado.push(preview);
  }

  return resultado;
}

/* ======================================================
   Importação em lote
====================================================== */

export async function importarComprasEmLote(
  cartaoId: string,
  compras: PreviewCompra[]
): Promise<ResultadoImportacao> {
  const resultado: ResultadoImportacao = {
    sucesso: 0,
    erros: 0,
    detalhes: [],
  };

  for (const compra of compras) {
    if (!compra.valido || !compra.dataCompra || !compra.responsavelId) {
      resultado.erros++;
      resultado.detalhes.push({
        linha: compra.linha,
        erro: compra.erro || "Dados inválidos",
      });
      continue;
    }

    try {
      // Para compras parceladas, o CSV mostra o valor de UMA parcela
      // Precisamos calcular o valor total da compra: valorParcela × totalParcelas
      const valorTotal = compra.tipoLancamento === "parcelada" 
        ? compra.valor * compra.parcelas 
        : compra.valor;

      const input: CompraCartaoInput = {
        cartaoId,
        descricao: compra.descricao,
        valorTotal,
        parcelas: compra.parcelas,
        parcelaInicial: compra.parcelaInicial,
        mesFatura: new Date(compra.mesFatura + "-01T12:00:00"),
        tipoLancamento: compra.tipoLancamento,
        dataCompra: compra.dataCompra,
        responsavelId: compra.responsavelId,
      };

      await criarCompraCartao(input);
      resultado.sucesso++;
      resultado.detalhes.push({ linha: compra.linha });
    } catch (e) {
      resultado.erros++;
      resultado.detalhes.push({
        linha: compra.linha,
        erro: e instanceof Error ? e.message : "Erro ao criar compra",
      });
    }
  }

  return resultado;
}

/* ======================================================
   Verificação de Duplicatas - Sistema de Fingerprint
====================================================== */

/**
 * Normalizar texto para comparação (remove acentos, lowercase, espaços extras)
 */
function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")  // Remove acentos
    .replace(/\s+/g, " ")              // Múltiplos espaços → um
    .trim();
}

/**
 * Extrair descrição base sem sufixo de parcela
 * Ex: "Mp *Aliexpress - Parcela 5/12" → "Mp *Aliexpress"
 */
function extrairDescricaoBase(descricao: string): string {
  // Remove padrões de parcela conhecidos
  const padroes = [
    /[-–]\s*[Pp]arcela\s+\d+\/\d+/i,  // - Parcela 1/2
    /[Pp]arcela\s+\d+\/\d+/i,          // Parcela 1/2
    /[-–]\s*\d+\/\d+/,                 // - 1/2
    /\(\d+\/\d+\)/,                    // (1/2)
    /\s\d+\/\d+$/,                     // espaço 1/2 no final
  ];

  let resultado = descricao;
  for (const padrao of padroes) {
    resultado = resultado.replace(padrao, "");
  }
  
  // Limpar traços ou espaços extras no final
  resultado = resultado.replace(/[-–]\s*$/, "").trim();
  
  return normalizar(resultado);
}

/**
 * Gerar fingerprint único para uma compra NO MÊS ESPECÍFICO
 * Componentes: descrição_base | valor_parcela_arredondado | mes_fatura
 * 
 * Isso permite importar parcelas diferentes do mesmo parcelamento em meses diferentes
 */
function gerarFingerprint(
  descricao: string,
  valorParcela: number,
  mesFatura: string
): string {
  const descBase = extrairDescricaoBase(descricao);
  // Arredondar valor para evitar problemas com centavos
  const valorArredondado = Math.round(valorParcela * 100) / 100;
  
  return `${descBase}|${valorArredondado}|${mesFatura}`;
}

/**
 * Gerar opções de mês/ano para o seletor (6 meses antes e depois do sugerido)
 */
export function gerarOpcoesAnoMes(mesSugerido: string): OpcaoMesFatura[] {
  const [ano, mes] = mesSugerido.split("-").map(Number);
  const base = new Date(ano, mes - 1, 1);
  const opcoes: OpcaoMesFatura[] = [];

  for (let i = -6; i <= 6; i++) {
    const data = new Date(base.getFullYear(), base.getMonth() + i, 1);
    const valor = format(data, "yyyy-MM");
    const label = format(data, "MMM/yy", { locale: ptBR });
    opcoes.push({ valor, label, sugerido: i === 0 });
  }

  return opcoes;
}

/**
 * Detectar duplicatas dentro do próprio lote de importação
 * Marca como duplicata linhas com mesma descrição, mesmo mês e valor similar
 */
function detectarDuplicatasNoLote(compras: PreviewCompra[]): PreviewCompra[] {
  // Agrupar por fingerprint (descrição + valor + mês)
  const grupos = new Map<string, PreviewCompra[]>();
  
  for (const compra of compras) {
    if (!compra.valido || !compra.mesFatura) continue;
    
    const fingerprint = gerarFingerprint(
      compra.descricao,
      compra.valor, // Valor da parcela individual
      compra.mesFatura
    );
    
    compra.fingerprint = fingerprint;
    
    const grupo = grupos.get(fingerprint) || [];
    grupo.push(compra);
    grupos.set(fingerprint, grupo);
  }
  
  // Para cada grupo com mais de um item, marcar duplicatas
  const duplicatasNoLote = new Set<number>();
  const principaisPorFingerprint = new Map<string, PreviewCompra>();
  
  for (const [fingerprint, grupo] of grupos) {
    if (grupo.length > 1) {
      // Manter a primeira ocorrência (menor número de linha)
      grupo.sort((a, b) => a.linha - b.linha);
      const principal = grupo[0];
      principaisPorFingerprint.set(fingerprint, principal);
      
      // Marcar os demais como duplicata
      for (let i = 1; i < grupo.length; i++) {
        duplicatasNoLote.add(grupo[i].linha);
      }
    }
  }
  
  // Atualizar compras com informação de duplicata no lote
  return compras.map(compra => {
    if (duplicatasNoLote.has(compra.linha)) {
      const principal = principaisPorFingerprint.get(compra.fingerprint || "");
      const fp = compra.fingerprint || "";
      const [descBase, valor, mes] = fp.split("|");
      
      return {
        ...compra,
        possivelDuplicata: true,
        duplicataInfo: {
          compraId: `linha-${principal?.linha}`,
          descricao: principal?.descricao || compra.descricao,
          origemDuplicata: "lote" as const,
          parcelaEncontrada: principal?.parcelaInicial,
          mesInicio: mes,
          // Diagnóstico
          fingerprintCalculado: fp,
          descricaoBase: descBase,
          mesBase: mes,
          motivoDetalhado: `Duplicata da linha ${principal?.linha} no mesmo mês: "${descBase}", R$${valor}, ${mes}`,
        },
      };
    }
    return compra;
  });
}

/**
 * Verificar se existem compras duplicadas no cartão (banco de dados)
 * Verifica apenas no MÊS ESPECÍFICO da fatura - não cruza meses diferentes
 */
export async function verificarDuplicatas(
  cartaoId: string,
  compras: PreviewCompra[]
): Promise<PreviewCompra[]> {
  // Primeiro, detectar duplicatas dentro do próprio lote
  let resultado = detectarDuplicatasNoLote(compras);
  
  // Coletar todos os meses únicos das compras sendo importadas
  const mesesUnicos = new Set<string>();
  for (const compra of compras) {
    if (compra.mesFatura) {
      mesesUnicos.add(compra.mesFatura);
    }
  }
  
  if (mesesUnicos.size === 0) {
    return resultado;
  }
  
  // Buscar compras existentes apenas dos meses relevantes
  const mesesArray = Array.from(mesesUnicos);
  const { data: existentes, error } = await supabase
    .from("compras_cartao")
    .select("id, descricao, valor_total, parcela_inicial, mes_inicio, parcelas")
    .eq("cartao_id", cartaoId)
    .eq("ativo", true)
    .or(mesesArray.map(m => `mes_inicio.like.${m}%`).join(","));

  if (error) {
    console.error("Erro ao verificar duplicatas:", error);
    return resultado;
  }

  if (!existentes || existentes.length === 0) {
    return resultado;
  }

  // Indexar compras existentes por mês para busca rápida
  const comprasPorMes = new Map<string, typeof existentes>();
  
  for (const existente of existentes) {
    const mesFatura = existente.mes_inicio.substring(0, 7); // "YYYY-MM"
    const lista = comprasPorMes.get(mesFatura) || [];
    lista.push(existente);
    comprasPorMes.set(mesFatura, lista);
  }

  // Verificar cada compra do preview contra o banco (mesmo mês apenas)
  resultado = resultado.map(compra => {
    // Se já marcada como duplicata do lote, não sobrescrever
    if (compra.possivelDuplicata) {
      return compra;
    }
    
    if (!compra.valido || !compra.mesFatura) {
      return compra;
    }

    const fingerprint = gerarFingerprint(
      compra.descricao,
      compra.valor,
      compra.mesFatura
    );
    
    const descBase = extrairDescricaoBase(compra.descricao);
    
    // Buscar apenas compras do mesmo mês
    const comprasDoMes = comprasPorMes.get(compra.mesFatura) || [];
    
    for (const existente of comprasDoMes) {
      const descBaseExistente = extrairDescricaoBase(existente.descricao);
      const valorParcela = existente.valor_total / existente.parcelas;
      
      const mesmaDescBase = descBase === descBaseExistente;
      const valorSimilar = Math.abs(compra.valor - valorParcela) < 0.10;
      
      if (mesmaDescBase && valorSimilar) {
        return {
          ...compra,
          fingerprint,
          possivelDuplicata: true,
          duplicataInfo: {
            compraId: existente.id,
            descricao: existente.descricao,
            origemDuplicata: "banco" as const,
            parcelaEncontrada: existente.parcela_inicial,
            mesInicio: existente.mes_inicio.substring(0, 7),
            // Diagnóstico
            fingerprintCalculado: fingerprint,
            descricaoBase: descBase,
            mesBase: compra.mesFatura,
            motivoDetalhado: `Duplicata no mês ${compra.mesFatura}: "${descBase}", R$${compra.valor.toFixed(2)}`,
          },
        };
      }
    }
    
    return { ...compra, fingerprint };
  });

  return resultado;
}

/* ======================================================
   Exports auxiliares
====================================================== */

export { calcularMesFaturaCartaoStr as calcularMesFatura, detectarParcela, mapearResponsavel, parsearValor, parsearData, normalizar };
