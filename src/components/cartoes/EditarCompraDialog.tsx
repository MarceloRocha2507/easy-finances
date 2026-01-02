import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

import { ParcelaFatura } from "@/services/transactions";
import { Categoria, listarCategorias } from "@/services/categorias";
import {
  Tag,
  listarTags,
  listarTagsDaCompra,
  sincronizarTagsDaCompra,
  criarTag,
} from "@/services/tags";
import { supabase } from "@/integrations/supabase/client";

import {
  Loader2,
  Plus,
  X,
  Tag as TagIcon,
  Utensils,
  Car,
  Gamepad2,
  HeartPulse,
  GraduationCap,
  ShoppingBag,
  Home,
  MoreHorizontal,
} from "lucide-react";

/* ======================================================
   Mapa de ícones
====================================================== */
const ICONE_MAP: Record<string, React.ReactNode> = {
  utensils: <Utensils className="h-4 w-4" />,
  car: <Car className="h-4 w-4" />,
  "gamepad-2": <Gamepad2 className="h-4 w-4" />,
  "heart-pulse": <HeartPulse className="h-4 w-4" />,
  "graduation-cap": <GraduationCap className="h-4 w-4" />,
  "shopping-bag": <ShoppingBag className="h-4 w-4" />,
  home: <Home className="h-4 w-4" />,
  "more-horizontal": <MoreHorizontal className="h-4 w-4" />,
  tag: <TagIcon className="h-4 w-4" />,
};

/* ======================================================
   Props
====================================================== */
interface Props {
  parcela: ParcelaFatura | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

/* ======================================================
   Component
====================================================== */
export function EditarCompraDialog({
  parcela,
  open,
  onOpenChange,
  onSaved,
}: Props) {
  const [descricao, setDescricao] = useState("");
  const [valorTotal, setValorTotal] = useState(0);
  const [categoriaId, setCategoriaId] = useState<string | null>(null);
  const [tagsSelecionadas, setTagsSelecionadas] = useState<string[]>([]);
  const [novaTagNome, setNovaTagNome] = useState("");

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);

  /* ======================================================
     Carregar dados iniciais
  ====================================================== */
  useEffect(() => {
    if (!open || !parcela) return;

    async function carregarDados() {
      setLoading(true);
      try {
        // Buscar compra completa
        const { data: compra } = await (supabase as any)
          .from("compras_cartao")
          .select("id, descricao, valor_total, parcelas, categoria_id")
          .eq("id", parcela.compra_id)
          .single();

        if (compra) {
          setDescricao(compra.descricao || "");
          setValorTotal(compra.valor_total || 0);
          setCategoriaId(compra.categoria_id || null);
        }

        // Carregar categorias
        const cats = await listarCategorias();
        setCategorias(cats);

        // Carregar todas as tags
        const allTags = await listarTags();
        setTags(allTags);

        // Carregar tags da compra
        const compraTags = await listarTagsDaCompra(parcela.compra_id);
        setTagsSelecionadas(compraTags.map((t) => t.id));
      } catch (e) {
        console.error("Erro ao carregar dados:", e);
      } finally {
        setLoading(false);
      }
    }

    carregarDados();
  }, [open, parcela?.compra_id]);

  /* ======================================================
     Salvar alterações
  ====================================================== */
  async function salvar() {
    if (!parcela) return;

    setSalvando(true);
    try {
      // 1. Atualizar compra (descrição e categoria)
      await (supabase as any)
        .from("compras_cartao")
        .update({
          descricao,
          categoria_id: categoriaId,
        })
        .eq("id", parcela.compra_id);

      // 2. Se o valor mudou, recalcular parcelas
      const { data: compraAtual } = await (supabase as any)
        .from("compras_cartao")
        .select("valor_total, parcelas")
        .eq("id", parcela.compra_id)
        .single();

      if (compraAtual && compraAtual.valor_total !== valorTotal) {
        const numParcelas = compraAtual.parcelas || 1;
        const novoValorParcela = Number((valorTotal / numParcelas).toFixed(2));

        // Atualizar valor_total
        await (supabase as any)
          .from("compras_cartao")
          .update({ valor_total: valorTotal })
          .eq("id", parcela.compra_id);

        // Atualizar parcelas não pagas
        await (supabase as any)
          .from("parcelas_cartao")
          .update({ valor: novoValorParcela })
          .eq("compra_id", parcela.compra_id)
          .eq("paga", false);
      }

      // 3. Sincronizar tags
      await sincronizarTagsDaCompra(parcela.compra_id, tagsSelecionadas);

      onSaved();
      onOpenChange(false);
    } catch (e) {
      console.error("Erro ao salvar:", e);
      alert("Erro ao salvar alterações");
    } finally {
      setSalvando(false);
    }
  }

  /* ======================================================
     Criar nova tag
  ====================================================== */
  async function handleCriarTag() {
    if (!novaTagNome.trim()) return;

    try {
      const novaTag = await criarTag({
        nome: novaTagNome.trim(),
        cor: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0")}`,
      });

      setTags((prev) => [...prev, novaTag]);
      setTagsSelecionadas((prev) => [...prev, novaTag.id]);
      setNovaTagNome("");
    } catch (e) {
      console.error("Erro ao criar tag:", e);
    }
  }

  /* ======================================================
     Toggle tag
  ====================================================== */
  function toggleTag(tagId: string) {
    setTagsSelecionadas((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  }

  if (!parcela) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar compra</DialogTitle>
          <DialogDescription>
            Parcela {parcela.numero_parcela}/{parcela.total_parcelas}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Input
                id="descricao"
                placeholder="Ex: Compra na Amazon"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
              />
            </div>

            {/* Valor Total */}
            <div className="space-y-2">
              <Label htmlFor="valor">Valor total da compra</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={valorTotal}
                onChange={(e) => setValorTotal(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                O valor das parcelas não pagas será recalculado automaticamente.
              </p>
            </div>

            {/* Categoria */}
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={categoriaId || "sem-categoria"}
                onValueChange={(v) =>
                  setCategoriaId(v === "sem-categoria" ? null : v)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sem-categoria">
                    <span className="text-muted-foreground">Sem categoria</span>
                  </SelectItem>
                  {categorias.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: cat.cor }}
                        />
                        {ICONE_MAP[cat.icone] || <TagIcon className="h-4 w-4" />}
                        <span>{cat.nome}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags</Label>

              {/* Tags selecionadas */}
              <div className="flex flex-wrap gap-2 min-h-[32px]">
                {tagsSelecionadas.length === 0 ? (
                  <span className="text-sm text-muted-foreground">
                    Nenhuma tag selecionada
                  </span>
                ) : (
                  tagsSelecionadas.map((tagId) => {
                    const tag = tags.find((t) => t.id === tagId);
                    if (!tag) return null;
                    return (
                      <Badge
                        key={tag.id}
                        variant="secondary"
                        className="gap-1 cursor-pointer"
                        style={{
                          backgroundColor: `${tag.cor}20`,
                          borderColor: tag.cor,
                          color: tag.cor,
                        }}
                        onClick={() => toggleTag(tag.id)}
                      >
                        {tag.nome}
                        <X className="h-3 w-3" />
                      </Badge>
                    );
                  })
                )}
              </div>

              {/* Lista de tags disponíveis */}
              <ScrollArea className="h-[120px] border rounded-md p-2">
                <div className="flex flex-wrap gap-2">
                  {tags
                    .filter((t) => !tagsSelecionadas.includes(t.id))
                    .map((tag) => (
                      <Badge
                        key={tag.id}
                        variant="outline"
                        className="cursor-pointer hover:bg-muted"
                        onClick={() => toggleTag(tag.id)}
                      >
                        <div
                          className="w-2 h-2 rounded-full mr-1"
                          style={{ backgroundColor: tag.cor }}
                        />
                        {tag.nome}
                      </Badge>
                    ))}

                  {tags.filter((t) => !tagsSelecionadas.includes(t.id))
                    .length === 0 && (
                    <span className="text-xs text-muted-foreground">
                      Todas as tags estão selecionadas
                    </span>
                  )}
                </div>
              </ScrollArea>

              {/* Criar nova tag */}
              <div className="flex gap-2">
                <Input
                  placeholder="Nova tag..."
                  value={novaTagNome}
                  onChange={(e) => setNovaTagNome(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCriarTag()}
                />
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={handleCriarTag}
                  disabled={!novaTagNome.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Separator />

            {/* Botões */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1"
                onClick={salvar}
                disabled={salvando || !descricao.trim()}
              >
                {salvando ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}