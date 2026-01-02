import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { listarCartoes, Cartao } from "@/services/cartoes";
import { listarGastosDoCartao } from "@/services/transactions";
import { NovoCartaoDialog } from "@/components/cartoes/NovoCartaoDialog";
import { CartaoCard } from "@/components/cartoes/CartaoCard";
import { DetalhesCartaoDialog } from "@/components/cartoes/DetalhesCartaoDialog";

type CartaoComGasto = Cartao & {
  totalGasto: number;
};

export default function Cartoes() {
  const [cartoes, setCartoes] = useState<CartaoComGasto[]>([]);
  const [cartaoSelecionadoId, setCartaoSelecionadoId] =
    useState<string | null>(null);
  const [detalhesOpen, setDetalhesOpen] = useState(false);

  async function carregar() {
    const base = await listarCartoes();

    const completos = await Promise.all(
      base.map(async (cartao) => {
        const gastos = await listarGastosDoCartao(cartao.id);
        const totalGasto = gastos.reduce(
          (sum, g) => sum + Math.abs(g.amount),
          0
        );

        return { ...cartao, totalGasto };
      })
    );

    setCartoes(completos);
  }

  useEffect(() => {
    carregar();
  }, []);

  const cartaoSelecionado = cartoes.find(
    (c) => c.id === cartaoSelecionadoId
  ) ?? null;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Cartões</h1>
          <NovoCartaoDialog onSaved={carregar} />
        </div>

        {cartoes.length === 0 && (
          <p className="text-muted-foreground">
            Nenhum cartão cadastrado.
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {cartoes.map((cartao) => (
            <CartaoCard
              cartao={cartao}
              totalGasto={cartao.totalGasto}
              statusFatura="ABERTA"
              onClick={() => {
                setCartaoSelecionadoId(cartao.id);
                setDetalhesOpen(true);
              }}
            />
          ))}
        </div>

        <DetalhesCartaoDialog
          cartao={cartaoSelecionado}
          open={detalhesOpen}
          onOpenChange={setDetalhesOpen}
          onUpdated={async () => {
            await carregar();
          }}
        />
      </div>
    </Layout>
  );
}
