import type { CompraExtraida } from "@/components/cartoes/RevisarComprasLoteDialog";

/**
 * Parser local do CSV oficial do Nubank.
 * Formato esperado (header): date,title,amount
 * - date: YYYY-MM-DD
 * - amount: número (negativo = crédito/pagamento/estorno)
 */

const PARCELA_REGEX = /\s*[-–]\s*(?:Parcela\s+)?(\d{1,2})\s*\/\s*(\d{1,2})\s*$/i;

function classificarTipo(titleLower: string): {
  tipo: NonNullable<CompraExtraida["tipo"]>;
  forcaCredito: boolean;
} {
  if (/pagamento\s+recebido/.test(titleLower)) {
    return { tipo: "pagamento_fatura", forcaCredito: true };
  }
  if (/cr[eé]dito\s+de\s+parcelamento\s+de\s+compra/.test(titleLower)) {
    return { tipo: "estorno_parcelamento", forcaCredito: true };
  }
  if (/estorno|reembolso/.test(titleLower)) {
    return { tipo: "estorno", forcaCredito: true };
  }
  if (/\biof\b/.test(titleLower)) {
    return { tipo: "iof", forcaCredito: false };
  }
  if (/anuidade/.test(titleLower)) {
    return { tipo: "anuidade", forcaCredito: false };
  }
  if (/juros/.test(titleLower)) {
    return { tipo: "juros", forcaCredito: false };
  }
  return { tipo: "compra", forcaCredito: false };
}

/**
 * Divide uma linha CSV respeitando aspas duplas.
 */
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

export function parseNubankCsv(text: string): CompraExtraida[] {
  const linhas = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (linhas.length === 0) return [];

  // Detectar header
  const header = splitCsvLine(linhas[0]).map((h) => h.toLowerCase());
  const idxDate = header.indexOf("date");
  const idxTitle = header.indexOf("title");
  const idxAmount = header.indexOf("amount");

  const hasHeader = idxDate >= 0 && idxTitle >= 0 && idxAmount >= 0;
  const dataLinhas = hasHeader ? linhas.slice(1) : linhas;
  const ixD = hasHeader ? idxDate : 0;
  const ixT = hasHeader ? idxTitle : 1;
  const ixA = hasHeader ? idxAmount : 2;

  const compras: CompraExtraida[] = [];

  for (const linhaBruta of dataLinhas) {
    const cols = splitCsvLine(linhaBruta);
    if (cols.length < 3) continue;

    const dateStr = cols[ixD];
    const titleStr = cols[ixT];
    const amountStr = cols[ixA];

    if (!dateStr || !titleStr || !amountStr) continue;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) continue;

    const amountNum = parseFloat(amountStr.replace(",", "."));
    if (!isFinite(amountNum)) continue;

    const titleLower = titleStr.toLowerCase();
    const { tipo, forcaCredito } = classificarTipo(titleLower);

    const ehCredito = forcaCredito || amountNum < 0;
    const valorAbs = Math.abs(amountNum);

    // Detectar parcela no final do título
    let parcelas = 1;
    let parcela_atual: number | undefined = undefined;
    let valor_eh_parcela = false;

    const m = titleStr.match(PARCELA_REGEX);
    if (m) {
      const atual = parseInt(m[1], 10);
      const total = parseInt(m[2], 10);
      if (atual > 0 && total > 0 && atual <= total && total <= 99) {
        parcela_atual = atual;
        parcelas = total;
        valor_eh_parcela = true;
      }
    }

    compras.push({
      valor: valorAbs,
      estabelecimento: titleStr,
      data: dateStr,
      parcelas,
      parcela_atual,
      valor_eh_parcela,
      linha_original: linhaBruta,
      valor_texto: amountStr,
      tipo,
      sinal: ehCredito ? "credito" : "debito",
    });
  }

  return compras;
}
