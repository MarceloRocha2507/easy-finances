import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useBancosComResumo,
  useTodosBancos,
  useReativarBanco,
  Banco,
  BancoComResumo,
} from "@/services/bancos";
import { formatCurrency } from "@/lib/formatters";
import {
  BancoCard,
  NovoBancoDialog,
  EditarBancoDialog,
  ExcluirBancoDialog,
  AjustarSaldoBancoDialog,
} from "@/components/bancos";
import {
  Building2,
  Plus,
  CreditCard,
  RefreshCw,
  Wallet,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

function BancoSkeleton() {
  return (
    <Card className="border">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-12 h-12 rounded-lg" />
            <div>
              <Skeleton className="h-5 w-24 mb-1" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function Bancos() {
  const { data: bancosResumo = [], isLoading, refetch } = useBancosComResumo();
  const { data: todosBancos = [] } = useTodosBancos();
  const reativarBanco = useReativarBanco();

  const [novoOpen, setNovoOpen] = useState(false);
  const [editarOpen, setEditarOpen] = useState(false);
  const [excluirOpen, setExcluirOpen] = useState(false);
  const [ajustarOpen, setAjustarOpen] = useState(false);
  const [bancoSelecionado, setBancoSelecionado] = useState<Banco | BancoComResumo | null>(null);
  const [inativosOpen, setInativosOpen] = useState(false);

  const bancosInativos = todosBancos.filter((b) => !b.ativo);

  // Totais
  const totalCartoes = bancosResumo.reduce((acc, b) => acc + b.quantidadeCartoes, 0);
  const totalLimite = bancosResumo.reduce((acc, b) => acc + b.limiteTotal, 0);
  const totalFatura = bancosResumo.reduce((acc, b) => acc + b.faturaTotal, 0);
  const totalDisponivel = bancosResumo.reduce((acc, b) => acc + b.disponivelTotal, 0);
  const totalSaldo = bancosResumo.reduce((acc, b) => acc + b.saldoCalculado, 0);

  const handleEdit = (banco: BancoComResumo) => {
    setBancoSelecionado(banco);
    setEditarOpen(true);
  };

  const handleDelete = (banco: BancoComResumo) => {
    setBancoSelecionado(banco);
    setExcluirOpen(true);
  };

  const handleAjustarSaldo = (banco: BancoComResumo) => {
    setBancoSelecionado(banco);
    setAjustarOpen(true);
  };

  const handleReativar = async (banco: Banco) => {
    await reativarBanco.mutateAsync(banco.id);
    refetch();
  };

  return (
    <Layout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Contas Bancárias</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie suas contas e instituições financeiras
          </p>
        </div>

        <Button onClick={() => setNovoOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Nova Conta
        </Button>
      </div>

      {/* Resumo Geral */}
      {bancosResumo.length > 0 && (
        <Card className="border mb-6">
          <CardContent className="p-5">
            {/* Saldo Total em Destaque */}
            <div className="text-center mb-4 pb-4 border-b">
              <p className="text-sm text-muted-foreground mb-1">Saldo Total em Contas</p>
              <p className="text-3xl font-bold text-income">{formatCurrency(totalSaldo)}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Contas Ativas</p>
                <div className="flex items-center justify-center gap-2">
                  <Wallet className="h-4 w-4 text-primary" />
                  <span className="text-xl font-semibold">{bancosResumo.length}</span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Total Cartões</p>
                <div className="flex items-center justify-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xl font-semibold">{totalCartoes}</span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Limite Cartões</p>
                <p className="text-xl font-semibold">{formatCurrency(totalLimite)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Crédito Disponível</p>
                <p className="text-xl font-semibold text-income">
                  {formatCurrency(totalDisponivel)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Bancos */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <BancoSkeleton />
          <BancoSkeleton />
          <BancoSkeleton />
        </div>
      ) : bancosResumo.length === 0 ? (
        <Card className="border">
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
            <h3 className="text-lg font-medium mb-2">Nenhuma conta cadastrada</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Cadastre suas contas bancárias para controlar seu saldo real
            </p>
            <Button onClick={() => setNovoOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              Cadastrar Primeira Conta
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bancosResumo.map((banco) => (
            <BancoCard
              key={banco.id}
              banco={banco}
              onEdit={() => handleEdit(banco)}
              onDelete={() => handleDelete(banco)}
              onAjustarSaldo={() => handleAjustarSaldo(banco)}
            />
          ))}
        </div>
      )}

      {/* Bancos Inativos */}
      {bancosInativos.length > 0 && (
        <Collapsible open={inativosOpen} onOpenChange={setInativosOpen} className="mt-6">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="h-4 w-4" />
                Contas inativas ({bancosInativos.length})
              </span>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bancosInativos.map((banco) => (
                <Card key={banco.id} className="border opacity-60">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${banco.cor}15` }}
                        >
                          <Building2 className="h-5 w-5" style={{ color: banco.cor }} />
                        </div>
                        <div>
                          <p className="font-medium">{banco.nome}</p>
                          <p className="text-xs text-muted-foreground">Inativo</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReativar(banco)}
                        disabled={reativarBanco.isPending}
                      >
                        <RefreshCw className="h-4 w-4 mr-1.5" />
                        Reativar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Dialogs */}
      <NovoBancoDialog
        open={novoOpen}
        onOpenChange={setNovoOpen}
        onSaved={() => {
          refetch();
          setNovoOpen(false);
        }}
      />

      <EditarBancoDialog
        banco={bancoSelecionado}
        open={editarOpen}
        onOpenChange={setEditarOpen}
        onSaved={() => refetch()}
      />

      <ExcluirBancoDialog
        banco={bancoSelecionado}
        open={excluirOpen}
        onOpenChange={setExcluirOpen}
        onConfirm={() => refetch()}
      />

      <AjustarSaldoBancoDialog
        banco={bancoSelecionado as BancoComResumo}
        open={ajustarOpen}
        onOpenChange={setAjustarOpen}
        onSaved={() => refetch()}
      />
    </Layout>
  );
}
