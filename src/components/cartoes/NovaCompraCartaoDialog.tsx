import { useState, useEffect, useMemo } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Cartao } from "@/services/cartoes";
import { criarCompraCartao } from "@/services/compras-cartao";
import { useToast } from "@/hooks/use-toast";
import { ResponsavelSelector } from "@/components/ui/responsavel-selector";
import { useResponsavelTitular } from "@/services/responsaveis";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, Tag, Repeat, Hash, X, Calendar as CalendarIcon } from "lucide-react";
import { CalculatorPopover } from "@/components/ui/calculator-popover";
import { format, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { NovoResponsavelDialog } from "./NovoResponsavelDialog";
import { useQueryClient } from "@tanstack/react-query";
import { calcularMesFaturaCartaoStr } from "@/lib/dateUtils";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type Categoria = {
  id: string;
  name: string;
  color: string;
  icon?: string;
};

type TipoLancamento = "unica" | "parcelada" | "fixa";

interface Props {
  cartao: Cartao;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

/* ── Shared inline styles ── */
const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #E5E7EB",
  borderRadius: 8,
  padding: "10px 12px",
  fontSize: 14,
  color: "#111827",
  background: "#fff",
  outline: "none",
  transition: "border 150ms",
};

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  color: "#374151",
  display: "block",
  marginBottom: 4,
};

function PremiumLabel({
  children,
  required,
  htmlFor,
}: {
  children: React.ReactNode;
  required?: boolean;
  htmlFor?: string;
}) {
  return (
    <label style={labelStyle} htmlFor={htmlFor}>
      {children}
      {required && <span style={{ color: "#DC2626", marginLeft: 2 }}>*</span>}
    </label>
  );
}

function PremiumInput({
  id,
  placeholder,
  value,
  onChange,
  type = "text",
  inputMode,
  className,
  style: extraStyle,
}: {
  id?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  inputMode?: "decimal" | "numeric" | "text";
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <input
      id={id}
      type={type}
      inputMode={inputMode}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={className}
      style={{ ...inputStyle, ...extraStyle }}
      onFocus={(e) => {
        e.currentTarget.style.border = "1.5px solid #111827";
        e.currentTarget.style.padding = "9.5px 11.5px";
      }}
      onBlur={(e) => {
        e.currentTarget.style.border = "1px solid #E5E7EB";
        e.currentTarget.style.padding = "10px 12px";
      }}
    />
  );
}

export function NovaCompraCartaoDialog({
  cartao,
  open,
  onOpenChange,
  onSaved,
}: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: titularData } = useResponsavelTitular();
  const [loading, setLoading] = useState(false);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [novoResponsavelOpen, setNovoResponsavelOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const opcoesMesFatura = useMemo(() => {
    const hoje = new Date();
    const meses = [];
    for (let i = -6; i < 12; i++) {
      const mes = addMonths(hoje, i);
      meses.push({
        value: format(mes, "yyyy-MM"),
        label: format(mes, "MMMM/yyyy", { locale: ptBR }),
      });
    }
    return meses;
  }, []);

  const [form, setForm] = useState({
    descricao: "",
    nomeFatura: "",
    valor: "",
    tipoLancamento: "unica" as TipoLancamento,
    parcelas: "2",
    parcelaInicial: "1",
    mesFatura: opcoesMesFatura[0]?.value || "",
    dataCompra: new Date().toISOString().split("T")[0],
    categoriaId: "",
    responsavelId: "",
  });

  useEffect(() => {
    async function loadCategorias() {
      const { data } = await supabase
        .from("categories")
        .select("id, name, color, icon")
        .eq("type", "expense")
        .order("name");
      if (data) {
        const unique = data.filter(
          (cat, i, arr) => arr.findIndex((c) => c.name === cat.name) === i
        );
        setCategorias(unique);
      }
    }
    loadCategorias();
  }, []);

  useEffect(() => {
    if (titularData && !form.responsavelId) {
      setForm((f) => ({ ...f, responsavelId: titularData.id }));
    }
  }, [titularData]);

  useEffect(() => {
    if (open) {
      const hoje = new Date();
      const mesFaturaCalculado = calcularMesFaturaCartaoStr(
        hoje,
        cartao.dia_fechamento
      );
      setForm({
        descricao: "",
        nomeFatura: "",
        valor: "",
        tipoLancamento: "unica",
        parcelas: "2",
        parcelaInicial: "1",
        mesFatura: mesFaturaCalculado,
        dataCompra: hoje.toISOString().split("T")[0],
        categoriaId: "",
        responsavelId: titularData?.id || "",
      });
    }
  }, [open, titularData, cartao.dia_fechamento]);

  useEffect(() => {
    if (form.dataCompra && open) {
      const dataCompra = new Date(form.dataCompra + "T12:00:00");
      const novoMesFatura = calcularMesFaturaCartaoStr(
        dataCompra,
        cartao.dia_fechamento
      );
      if (form.mesFatura !== novoMesFatura) {
        setForm((f) => ({ ...f, mesFatura: novoMesFatura }));
      }
    }
  }, [form.dataCompra, cartao.dia_fechamento, open]);

  const opcoesParcelaInicial = useMemo(() => {
    const numParcelas = parseInt(form.parcelas) || 2;
    return Array.from({ length: numParcelas }, (_, i) => ({
      value: String(i + 1),
      label: `${i + 1}ª parcela`,
    }));
  }, [form.parcelas]);

  useEffect(() => {
    const numParcelas = parseInt(form.parcelas) || 2;
    const parcelaInicial = parseInt(form.parcelaInicial) || 1;
    if (parcelaInicial > numParcelas) {
      setForm((f) => ({ ...f, parcelaInicial: "1" }));
    }
  }, [form.parcelas]);

  async function handleSalvar() {
    if (loading) return;
    if (!form.descricao.trim()) {
      toast({ title: "Informe a descrição", variant: "destructive" });
      return;
    }
    const valor = parseFloat(form.valor.replace(",", "."));
    if (isNaN(valor) || valor <= 0) {
      toast({ title: "Informe um valor válido", variant: "destructive" });
      return;
    }
    if (!form.responsavelId) {
      toast({ title: "Selecione o responsável", variant: "destructive" });
      return;
    }
    if (!form.mesFatura) {
      toast({ title: "Selecione o mês da fatura", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const [ano, mes] = form.mesFatura.split("-").map(Number);
      const mesFaturaDate = new Date(ano, mes - 1, 1);

      let numParcelas = 1;
      let parcelaInicial = 1;
      if (form.tipoLancamento === "parcelada") {
        numParcelas = parseInt(form.parcelas);
        parcelaInicial = parseInt(form.parcelaInicial);
      } else if (form.tipoLancamento === "fixa") {
        numParcelas = 12;
        parcelaInicial = 1;
      }

      await criarCompraCartao({
        cartaoId: cartao.id,
        descricao: form.descricao,
        valorTotal: valor,
        parcelas: numParcelas,
        parcelaInicial,
        mesFatura: mesFaturaDate,
        tipoLancamento: form.tipoLancamento,
        dataCompra: new Date(form.dataCompra),
        categoriaId:
          form.categoriaId && form.categoriaId !== "none"
            ? form.categoriaId
            : undefined,
        responsavelId: form.responsavelId,
        nomeFatura: form.nomeFatura || undefined,
      });

      // Telegram notification (fire-and-forget)
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const categoriaNome = categorias.find(
          (c) => c.id === form.categoriaId
        )?.name;
        const dataFormatada = new Date(
          form.dataCompra + "T12:00:00"
        ).toLocaleDateString("pt-BR");

        let mensagem = `🛒 *Nova Compra no Cartão*\n\n📝 Descrição: ${form.descricao}\n💳 Cartão: ${cartao.nome}\n💵 Valor: R$ ${valor.toFixed(2).replace(".", ",")}`;
        if (form.tipoLancamento === "parcelada") {
          const np = parseInt(form.parcelas);
          const vp = valor / np;
          mensagem += `\n🔢 Parcelas: ${np}x de R$ ${vp.toFixed(2).replace(".", ",")}`;
        }
        if (categoriaNome) mensagem += `\n📂 Categoria: ${categoriaNome}`;
        mensagem += `\n📅 Data: ${dataFormatada}`;

        supabase.functions
          .invoke("telegram-send", {
            body: {
              user_id: user.id,
              alertas: [
                { tipo_alerta: "cartao_nova_compra", tipo: "info", mensagem },
              ],
            },
          })
          .catch(() => {});
      }

      toast({ title: "Compra registrada!" });
      onSaved();
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao salvar",
        description: "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const resumoParcelas = useMemo(() => {
    const valor = parseFloat(form.valor.replace(",", ".")) || 0;
    if (valor <= 0) return null;
    if (form.tipoLancamento === "unica") return { tipo: "unica" as const, valor };
    if (form.tipoLancamento === "parcelada") {
      const numParcelas = parseInt(form.parcelas) || 2;
      const parcelaInicial = parseInt(form.parcelaInicial) || 1;
      const numParcelasACriar = numParcelas - parcelaInicial + 1;
      const valorParcela = valor / numParcelas;
      return {
        tipo: "parcelada" as const,
        valorParcela,
        numParcelas,
        parcelaInicial,
        numParcelasACriar,
      };
    }
    if (form.tipoLancamento === "fixa")
      return { tipo: "fixa" as const, valorMensal: valor };
    return null;
  }, [form.valor, form.tipoLancamento, form.parcelas, form.parcelaInicial]);

  const tabs: { value: TipoLancamento; label: string; icon?: React.ReactNode }[] = [
    { value: "unica", label: "Avulsa" },
    { value: "parcelada", label: "Parcelada" },
    { value: "fixa", label: "Fixa", icon: <Repeat style={{ width: 14, height: 14, marginRight: 4 }} /> },
  ];

  const dataCompraDate = form.dataCompra
    ? new Date(form.dataCompra + "T12:00:00")
    : undefined;

  const isMobile = useIsMobile();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        noPadding
        className={cn(
          "gap-0 border-0 [&>button]:hidden flex flex-col rounded-2xl",
          isMobile
            ? "!w-auto max-w-none fixed !translate-x-0 !translate-y-0 data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom data-[state=open]:duration-300 data-[state=closed]:duration-200"
            : "w-[calc(100%-2rem)] max-w-[460px]"
        )}
        style={isMobile
          ? {
              borderRadius: 16,
              left: "max(1.25rem, env(safe-area-inset-left))",
              right: "max(1.25rem, env(safe-area-inset-right))",
              top: "1rem",
              maxHeight: "calc(100dvh - 2rem)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
            }
          : {
              borderRadius: 16,
              boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
              maxWidth: 460,
              maxHeight: "90dvh",
            }
        }
      >
        {/* Drag handle - mobile only */}
        {isMobile && (
          <div className="flex justify-center pt-2 pb-1 shrink-0">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
          </div>
        )}

        {/* Sticky Header */}
        <div className={cn(
          "flex items-start justify-between shrink-0 bg-white z-10",
          isMobile ? "sticky top-0 px-5 pt-2 pb-2 rounded-t-2xl" : "px-6 pt-6 pb-0"
        )}>
          <div className="flex items-center gap-2.5">
            <CreditCard style={{ width: 18, height: 18, color: "#6B7280" }} />
            <div>
              <h2 style={{ color: "#111827", fontWeight: 700, fontSize: 16, lineHeight: "20px" }}>
                Nova Compra
              </h2>
              <p style={{ color: "#9CA3AF", fontSize: 12, marginTop: 2 }}>
                Registre uma compra no cartão {cartao.nome}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="transition-colors"
            style={{ background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 6, color: "#9CA3AF" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#F3F4F6")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* Form body */}
        <div className={cn(
          "flex-1 overflow-y-auto overflow-x-hidden min-h-0 flex flex-col gap-3",
          isMobile ? "px-5 pt-2 pb-2" : "px-6 pt-5 pb-5"
        )}>
          {/* Descrição */}
          <div>
            <PremiumLabel required htmlFor="descricao">Descrição</PremiumLabel>
            <PremiumInput
              id="descricao"
              placeholder="Ex: Supermercado, Farmácia..."
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            />
          </div>

          {/* Nome na Fatura */}
          <div>
            <PremiumLabel htmlFor="nomeFatura">Nome na Fatura</PremiumLabel>
            <PremiumInput
              id="nomeFatura"
              placeholder="Ex: MARCELO*NETFLIX, UBER TRIP..."
              value={form.nomeFatura}
              onChange={(e) => setForm({ ...form, nomeFatura: e.target.value })}
            />
            <p style={{ color: "#9CA3AF", fontSize: 12, marginTop: 4 }}>
              Como aparece na fatura do cartão
            </p>
          </div>

          {/* Valor */}
          <div>
            <PremiumLabel required htmlFor="valor">Valor total (R$)</PremiumLabel>
            <div className="flex gap-2">
              <PremiumInput
                id="valor"
                inputMode="decimal"
                placeholder="0,00"
                value={form.valor}
                onChange={(e) => setForm({ ...form, valor: e.target.value })}
                style={{ flex: 1 }}
              />
              <CalculatorPopover
                onResult={(value) => {
                  setForm({ ...form, valor: value.toFixed(2).replace(".", ",") });
                }}
                trigger={
                  <button
                    type="button"
                    className="flex items-center justify-center transition-colors flex-shrink-0"
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 6,
                      background: "#F3F4F6",
                      border: "none",
                      cursor: "pointer",
                      color: "#9CA3AF",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#E5E7EB")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#F3F4F6")}
                  >
                    <Hash style={{ width: 16, height: 16 }} />
                  </button>
                }
              />
            </div>
          </div>

          {/* Tipo de lançamento — underline tabs */}
          <div>
            <PremiumLabel>Tipo de lançamento</PremiumLabel>
            <div className="flex" style={{ borderBottom: "1px solid #F3F4F6" }}>
              {tabs.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setForm({ ...form, tipoLancamento: tab.value })}
                  className="flex items-center justify-center transition-all"
                  style={{
                    flex: 1,
                    padding: "8px 0",
                    fontSize: 13,
                    fontWeight: form.tipoLancamento === tab.value ? 600 : 400,
                    color: form.tipoLancamento === tab.value ? "#111827" : "#6B7280",
                    background: "none",
                    border: "none",
                    borderBottom: form.tipoLancamento === tab.value ? "2px solid #111827" : "2px solid transparent",
                    cursor: "pointer",
                    transition: "all 150ms",
                  }}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Parcelas config */}
          {form.tipoLancamento === "parcelada" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <PremiumLabel htmlFor="parcelas">Nº de parcelas</PremiumLabel>
                <Select
                  value={form.parcelas}
                  onValueChange={(v) => setForm({ ...form, parcelas: v })}
                >
                  <SelectTrigger
                    id="parcelas"
                    className="border-[#E5E7EB] rounded-lg h-[42px] text-sm focus:ring-0 focus:border-[#111827]"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 23 }, (_, i) => i + 2).map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n}x
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <PremiumLabel htmlFor="parcelaInicial">Começar na</PremiumLabel>
                <Select
                  value={form.parcelaInicial}
                  onValueChange={(v) => setForm({ ...form, parcelaInicial: v })}
                >
                  <SelectTrigger
                    id="parcelaInicial"
                    className="border-[#E5E7EB] rounded-lg h-[42px] text-sm focus:ring-0 focus:border-[#111827]"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {opcoesParcelaInicial.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Mês da fatura */}
          <div>
            <PremiumLabel htmlFor="mesFatura">Mês da fatura</PremiumLabel>
            <Select
              value={form.mesFatura}
              onValueChange={(v) => setForm({ ...form, mesFatura: v })}
            >
              <SelectTrigger
                id="mesFatura"
                className="border-[#E5E7EB] rounded-lg h-[42px] text-sm focus:ring-0 focus:border-[#111827]"
              >
                <SelectValue placeholder="Selecione o mês" />
              </SelectTrigger>
              <SelectContent>
                {opcoesMesFatura.map((mes) => (
                  <SelectItem key={mes.value} value={mes.value}>
                    <span className="capitalize">{mes.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Data da compra — custom date picker */}
          <div>
            <PremiumLabel>Data da compra</PremiumLabel>
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="w-full flex items-center justify-between transition-all"
                  style={{
                    ...inputStyle,
                    cursor: "pointer",
                    color: form.dataCompra ? "#111827" : "#9CA3AF",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.border = "1.5px solid #111827";
                    e.currentTarget.style.padding = "9.5px 11.5px";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.border = "1px solid #E5E7EB";
                    e.currentTarget.style.padding = "10px 12px";
                  }}
                >
                  <span>
                    {dataCompraDate
                      ? format(dataCompraDate, "dd/MM/yyyy", { locale: ptBR })
                      : "Selecione a data"}
                  </span>
                  <CalendarIcon style={{ width: 16, height: 16, color: "#9CA3AF" }} />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dataCompraDate}
                  onSelect={(date) => {
                    if (date) {
                      setForm({
                        ...form,
                        dataCompra: format(date, "yyyy-MM-dd"),
                      });
                    }
                    setDatePickerOpen(false);
                  }}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Responsável */}
          <ResponsavelSelector
            label="Quem fez a compra?"
            value={form.responsavelId}
            onChange={(id) => setForm({ ...form, responsavelId: id || "" })}
            onAddNew={() => setNovoResponsavelOpen(true)}
            required
          />

          {/* Subcategoria */}
          <div>
            <PremiumLabel htmlFor="categoria">Subcategoria (opcional)</PremiumLabel>
            <Select
              value={form.categoriaId}
              onValueChange={(v) => setForm({ ...form, categoriaId: v })}
            >
              <SelectTrigger
                id="categoria"
                className="border-[#E5E7EB] rounded-lg h-[42px] text-sm focus:ring-0 focus:border-[#111827]"
              >
                <SelectValue placeholder="Selecionar subcategoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem subcategoria</SelectItem>
                {categorias
                  .filter((c) => c.name !== "Fatura do Cartão")
                  .map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <span
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: 3,
                            background: cat.color,
                            display: "inline-block",
                            flexShrink: 0,
                          }}
                        />
                        {cat.name}
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Resumo */}
          {resumoParcelas && (
            <div
              style={{
                background: "#F9FAFB",
                borderRadius: 8,
                border: "1px solid #F3F4F6",
                padding: "10px 14px",
              }}
            >
              {resumoParcelas.tipo === "unica" && (
                <p style={{ color: "#6B7280", fontSize: 13 }}>
                  Compra à vista:{" "}
                  <strong style={{ color: "#111827" }}>
                    R$ {resumoParcelas.valor.toFixed(2).replace(".", ",")}
                  </strong>
                </p>
              )}
              {resumoParcelas.tipo === "parcelada" && (
                <>
                  <p style={{ color: "#6B7280", fontSize: 13 }}>
                    {resumoParcelas.numParcelas}x de{" "}
                    <strong style={{ color: "#111827" }}>
                      R$ {resumoParcelas.valorParcela.toFixed(2).replace(".", ",")}
                    </strong>
                  </p>
                  {resumoParcelas.parcelaInicial > 1 && (
                    <p style={{ color: "#D97706", fontSize: 12, marginTop: 4 }}>
                      Começando na {resumoParcelas.parcelaInicial}ª parcela (
                      {resumoParcelas.numParcelasACriar} parcelas serão criadas)
                    </p>
                  )}
                </>
              )}
              {resumoParcelas.tipo === "fixa" && (
                <p style={{ color: "#6B7280", fontSize: 13 }}>
                  Despesa fixa mensal:{" "}
                  <strong style={{ color: "#111827" }}>
                    R$ {resumoParcelas.valorMensal.toFixed(2).replace(".", ",")}
                  </strong>
                </p>
              )}
            </div>
          )}

        </div>

        {/* Sticky Footer - Submit button */}
        <div className={cn(
          "shrink-0 bg-white border-t border-border/50",
          isMobile ? "sticky bottom-0 px-5 pt-2 z-10 rounded-b-2xl" : "px-6 pt-3 pb-5"
        )}
          style={isMobile ? { paddingBottom: "max(12px, env(safe-area-inset-bottom))" } : undefined}
        >
          <button
            type="button"
            onClick={handleSalvar}
            disabled={loading}
            className="w-full flex items-center justify-center transition-colors disabled:opacity-50"
            style={{
              height: 48,
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 600,
              color: "#fff",
              background: "#111827",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.background = "#1F2937";
            }}
            onMouseLeave={(e) => {
              if (!loading) e.currentTarget.style.background = "#111827";
            }}
          >
            {loading ? "Salvando..." : "Registrar compra"}
          </button>
        </div>
      </DialogContent>

      <NovoResponsavelDialog
        open={novoResponsavelOpen}
        onOpenChange={setNovoResponsavelOpen}
        onCreated={(novoId) => {
          setForm({ ...form, responsavelId: novoId });
          queryClient.invalidateQueries({ queryKey: ["responsaveis"] });
        }}
      />
    </Dialog>
  );
}
