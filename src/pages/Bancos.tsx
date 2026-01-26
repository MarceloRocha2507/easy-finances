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
} from "@/components/bancos";
import {
  Building2,
  Plus,
  CreditCard,
  RefreshCw,
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
  const [bancoSelecionado, setBancoSelecionado] = useState<Banco | BancoComResumo | null>(null);
  const [inativosOpen, setInativosOpen] = useState(false);

  const bancosInativos = todosBancos.filter((b) => !b.ativo);

  // Totais
  const totalCartoes = bancosResumo.reduce((acc, b) => acc + b.quantidadeCartoes, 0);
  const totalLimite = bancosResumo.reduce((acc, b) => acc + b.limiteTotal, 0);
  const totalFatura = bancosResumo.reduce((acc, b) => acc + b.faturaTotal, 0);
  const totalDisponivel = bancosResumo.reduce((acc, b) => acc + b.disponivelTotal, 0);

  const handleEdit = (banco: BancoComResumo) => {
    setBancoSelecionado(banco);
    setEditarOpen(true);
  };

  const handleDelete = (banco: BancoComResumo) => {
    setBancoSelecionado(banco);
    setExcluirOpen(true);
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
          <h1 className="text-xl font-semibold text-foreground">Bancos</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie suas instituições financeiras
          </p>
        </div>

        <Button onClick={() => setNovoOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Novo Banco
        </Button>
      </div>

      {/* Resumo Geral */}
      {bancosResumo.length > 0 && (
        <Card className="border mb-6">
          <CardContent className="p-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Bancos Ativos</p>
                <div className="flex items-center justify-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
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
                <p className="text-xs text-muted-foreground mb-1">Limite Total</p>
                <p className="text-xl font-semibold">{formatCurrency(totalLimite)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Disponível</p>
                <p className="text-xl font-semibold text-income">
                  {formatCurrency(totalDisponivel)}
                </p>
              </div>
            </div>

            {totalLimite > 0 && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Uso total</span>
                  <span>{((totalFatura / totalLimite) * 100).toFixed(0)}%</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${Math.min((totalFatura / totalLimite) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}
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
            <h3 className="text-lg font-medium mb-2">Nenhum banco cadastrado</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Cadastre seus bancos para organizar seus cartões por instituição
            </p>
            <Button onClick={() => setNovoOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              Cadastrar Primeiro Banco
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
                Bancos inativos ({bancosInativos.length})
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
    </Layout>
  );
}
