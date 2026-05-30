import type { CompraExtraida } from "@/components/cartoes/RevisarComprasLoteDialog";

/**
 * Parser do CSV da fatura do PicPay.
 *
 * Header esperado:
 *   data,descricao,valor,cartao,tipo,categoria,parcela_atual,parcela_total,status,observacao
 *
 * Regras:
 *  - data: YYYY-MM-DD
 *  - valor: número positivo (formato 1234.56)
 *  - tipo: compra | financiamento | iof | pagamento | credito
 *  - status: ativo | cancelado | credito
 *      - "cancelado" → marcamos como `compra_substituida` para ser descartada
 *  - parcela_atual / parcela_total: opcionais; quando presentes o valor já é a parcela
 *  - Pagamentos e créditos (estornos) são descartados pelo conversor downstream
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

const REQUIRED = ["data", "descricao", "valor", "tipo"] as const;

function mapTipo(tipoCsv: string): {
  tipo: NonNullable<CompraExtraida["tipo"]>;
  sinal: "debito" | "credito";
} {
  const t = tipoCsv.toLowerCase().trim();
  if (t === "pagamento" || t === "pagamento_fatura") {
    return { tipo: "pagamento_fatura", sinal: "credito" };
  }
  if (t === "credito" || t === "estorno") {
    return { tipo: "estorno", sinal: "credito" };
  }
  if (t === "iof") {
    return { tipo: "iof", sinal: "debito" };
  }
  // financiamento e compra entram como compra normal (parcelas tratadas separadamente)
  return { tipo: "compra", sinal: "debito" };
}

export function parsePicpayCsv(text: string): CompraExtraida[] {
  const linhas = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (linhas.length === 0) return [];

  const header = splitCsvLine(linhas[0]).map((h) => h.toLowerCase());
  const ok = REQUIRED.every((c) => header.includes(c));
  if (!ok) {
    throw new Error(
      `CSV PicPay inválido. Cabeçalho esperado: ${REQUIRED.join(", ")}, ...`
    );
  }

  const ix = {
    data: header.indexOf("data"),
    descricao: header.indexOf("descricao"),
    valor: header.indexOf("valor"),
    tipo: header.indexOf("tipo"),
    parcAtual: header.indexOf("parcela_atual"),
    parcTotal: header.indexOf("parcela_total"),
    status: header.indexOf("status"),
    observacao: header.indexOf("observacao"),
  };

  const compras: CompraExtraida[] = [];

  for (const linhaBruta of linhas.slice(1)) {
    const cols = splitCsvLine(linhaBruta);
    if (cols.length < REQUIRED.length) continue;

    const dataStr = cols[ix.data];
    const descricao = cols[ix.descricao];
    const valorStr = cols[ix.valor];
    const tipoStr = cols[ix.tipo];
    const status = ix.status >= 0 ? (cols[ix.status] || "").toLowerCase() : "ativo";

    if (!dataStr || !descricao || !valorStr) continue;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dataStr)) continue;

    const valorNum = parseFloat(valorStr.replace(",", "."));
    if (!isFinite(valorNum) || valorNum <= 0) continue;

    let { tipo, sinal } = mapTipo(tipoStr);

    // Status cancelado/riscado → será ignorada pelo conversor
    if (status === "cancelado" || status === "riscada" || status === "riscado") {
      tipo = "compra_substituida";
    }

    // Parcelas
    let parcelas = 1;
    let parcela_atual: number | undefined = undefined;
    let valor_eh_parcela = false;

    const pa = ix.parcAtual >= 0 ? parseInt(cols[ix.parcAtual] || "", 10) : NaN;
    const pt = ix.parcTotal >= 0 ? parseInt(cols[ix.parcTotal] || "", 10) : NaN;
    if (isFinite(pa) && isFinite(pt) && pa > 0 && pt > 0 && pa <= pt && pt <= 99) {
      parcelas = pt;
      parcela_atual = pa;
      valor_eh_parcela = true;
    }

    compras.push({
      valor: valorNum,
      estabelecimento: descricao,
      data: dataStr,
      parcelas,
      parcela_atual,
      valor_eh_parcela,
      linha_original: linhaBruta,
      valor_texto: valorStr,
      tipo,
      sinal,
    });
  }

  return compras;
}
