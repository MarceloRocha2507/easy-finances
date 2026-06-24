import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";
import type { Cartao } from "@/services/cartoes";

function formatAmountBR(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(value));
}

function csvEscape(s: string): string {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

async function buscarLancamentosFatura(cartaoId: string, mesRef: Date, apenasTitular = false) {
  const mesRefStr = format(new Date(mesRef.getFullYear(), mesRef.getMonth(), 1), "yyyy-MM-dd");
  const { data, error } = await supabase
    .from("parcelas_cartao")
    .select(
      "valor, numero_parcela, total_parcelas, mes_referencia, compras_cartao!inner(cartao_id, descricao, nome_fatura, data_compra, ativo, compra_estornada_id, tipo_lancamento, responsavel:responsaveis(is_titular))"
    )
    .eq("ativo", true)
    .eq("mes_referencia", mesRefStr)
    .eq("compras_cartao.cartao_id", cartaoId)
    .eq("compras_cartao.ativo", true)
    .limit(10000);
  if (error) throw error;
  return (data || [])
    .filter((p: any) => {
      if (!apenasTitular) return true;
      const resp = p.compras_cartao?.responsavel;
      return resp === null || resp === undefined || resp?.is_titular === true;
    })
    .map((p: any) => {
      const compra = p.compras_cartao;
      const baseNome = (compra?.nome_fatura || compra?.descricao || "Lançamento").trim();
      const sufixo =
        p.total_parcelas && p.total_parcelas > 1
          ? ` - ${p.numero_parcela}/${p.total_parcelas}`
          : "";
      const title = `${baseNome}${sufixo}`;
      const isCredito =
        !!compra?.compra_estornada_id ||
        /estorno|crédito|credito|pagamento recebido/i.test(baseNome);
      const valor = Number(p.valor) || 0;
      const amount = isCredito ? -valor : valor;
      const date: string = compra?.data_compra || p.mes_referencia;
      return { date, title, amount };
    });
}

function baixarArquivo(conteudo: string, nome: string, mime = "text/csv;charset=utf-8;") {
  const blob = new Blob([conteudo], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function exportarFaturaInter(cartao: Cartao, mesRef: Date, apenasTitular = false) {
  try {
    const lancamentos = (await buscarLancamentosFatura(cartao.id, mesRef, apenasTitular)).sort((a, b) =>
      a.date.localeCompare(b.date)
    );
    if (lancamentos.length === 0) {
      toast.info("Nenhum lançamento nessa fatura para exportar.");
      return;
    }
    const header = "Data;Histórico;Valor";
    const linhas = lancamentos.map((l) => {
      const [y, m, d] = l.date.split("-");
      const dataBR = `${d}/${m}/${y}`;
      const valorStr = formatAmountBR(l.amount).replace(".", "");
      const valorFinal = l.amount < 0 ? `-${valorStr}` : valorStr;
      return `${dataBR};${csvEscape(l.title)};${valorFinal}`;
    });
    const csv = [header, ...linhas].join("\n");
    const mesLabel = format(mesRef, "yyyy-MM");
    const sufixoArquivo = apenasTitular ? "-titular" : "";
    baixarArquivo(
      csv,
      `inter-${cartao.nome.toLowerCase().replace(/\s+/g, "-")}-${mesLabel}${sufixoArquivo}.csv`
    );
    toast.success(`Fatura exportada no padrão Inter${apenasTitular ? " (somente titular)" : ""}.`);
  } catch (e: any) {
    console.error(e);
    toast.error("Falha ao exportar fatura.", { description: e?.message });
  }
}

export async function exportarFaturaNubank(cartao: Cartao, mesRef: Date, apenasTitular = false) {
  try {
    const lancamentos = (await buscarLancamentosFatura(cartao.id, mesRef, apenasTitular)).sort((a, b) =>
      b.date.localeCompare(a.date)
    );
    if (lancamentos.length === 0) {
      toast.info("Nenhum lançamento nessa fatura para exportar.");
      return;
    }

    const header = "date,title,amount";
    const linhasCsv = lancamentos.map((l) => {
      const valorStr = l.amount < 0 ? `- ${formatAmountBR(l.amount)}` : formatAmountBR(l.amount);
      return `${l.date},${csvEscape(l.title)},${csvEscape(valorStr)}`;
    });
    const csv = [header, ...linhasCsv].join("\n");
    const mesLabel = format(mesRef, "yyyy-MM");
    const sufixoArquivo = apenasTitular ? "-titular" : "";
    baixarArquivo(
      csv,
      `nubank-${cartao.nome.toLowerCase().replace(/\s+/g, "-")}-${mesLabel}${sufixoArquivo}.csv`
    );
    toast.success(`Fatura exportada no padrão Nubank${apenasTitular ? " (somente titular)" : ""}.`);
  } catch (e: any) {
    console.error(e);
    toast.error("Falha ao exportar fatura.", { description: e?.message });
  }
}
