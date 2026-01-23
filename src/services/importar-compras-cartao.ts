import { format } from "date-fns";
import { criarCompraCartao, CompraCartaoInput } from "./compras-cartao";
import type { Responsavel } from "./responsaveis";

/* ======================================================
   Types
====================================================== */

export interface PreviewCompra {
  linha: number;
  dataOriginal: string;
  dataCompra: Date | null;
  descricao: string;
  valor: number;
  responsavelId: string | null;
  responsavelNome: string;
  responsavelInput: string;
  mesFatura: string;
  tipoLancamento: "unica" | "parcelada";
  parcelas: number;
  parcelaInicial: number;
  valido: boolean;
  erro?: string;
}

export interface ResultadoImportacao {
  sucesso: number;
  erros: number;
  detalhes: { linha: number; erro?: string }[];
}

/* ======================================================
   Helpers
====================================================== */

/**
 * Calcular o mês da fatura baseado na data da compra e dia de fechamento
 */
function calcularMesFatura(dataCompra: Date, diaFechamento: number): string {
  const diaCompra = dataCompra.getDate();
  const mesCompra = dataCompra.getMonth();
  const anoCompra = dataCompra.getFullYear();

  if (diaCompra >= diaFechamento) {
    // Compra após/no fechamento: vai para a fatura do mês atual
    return format(new Date(anoCompra, mesCompra, 1), "yyyy-MM");
  } else {
    // Compra antes do fechamento: vai para a fatura do mês anterior
    return format(new Date(anoCompra, mesCompra - 1, 1), "yyyy-MM");
  }
}

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
      responsavelId: null,
      responsavelNome: "",
      responsavelInput: "",
      mesFatura: "",
      tipoLancamento: "unica",
      parcelas: 1,
      parcelaInicial: 1,
      valido: false,
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
      // Formato: "... ,valor responsavel" ou "... X/Y,valor responsavel"
      
      // Primeiro: tentar capturar após padrão de parcela X/Y
      let matchFinal = resto.match(/\d+\/\d+[,;]\s*([\d]+[.,]?\d*)\s+(\w+)\s*$/);
      
      // Fallback: padrão normal com vírgula/ponto-e-vírgula antes do valor
      if (!matchFinal) {
        matchFinal = resto.match(/[,;]\s*([\d]+[.,]?\d*)\s+(\w+)\s*$/);
      }
      
      // Último fallback: espaço antes do valor (formato sem vírgula)
      if (!matchFinal) {
        matchFinal = resto.match(/\s([\d]+[.,]\d+)\s+(\w+)\s*$/);
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
      // Remover a parte final que já processamos
      resto = resto.substring(0, resto.length - matchFinal[0].length).trim();
      // Remover vírgula inicial se houver
      resto = resto.replace(/^[,;]\s*/, "").trim();
      // Remover vírgula final se houver
      resto = resto.replace(/[,;]\s*$/, "").trim();
      
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

      // Calcular mês da fatura
      preview.mesFatura = calcularMesFatura(preview.dataCompra, diaFechamento);

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
      const input: CompraCartaoInput = {
        cartaoId,
        descricao: compra.descricao,
        valorTotal: compra.valor,
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
   Exports auxiliares
====================================================== */

export { calcularMesFatura, detectarParcela, mapearResponsavel, parsearValor, parsearData };
