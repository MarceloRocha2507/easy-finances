import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  User,
  UserPlus,
  MoreVertical,
  Pencil,
  Trash2,
  Phone,
  Crown,
  UserX,
  UserCheck,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  useResponsaveis,
  useTodosResponsaveis,
  useCriarResponsavel,
  useAtualizarResponsavel,
  useDesativarResponsavel,
  Responsavel,
} from "@/services/responsaveis";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { PlanLimitAlert, PlanLimitBadge } from "@/components/ui/plan-limit-alert";

export default function Responsaveis() {
  const { toast } = useToast();
  const { data: responsaveis = [], isLoading } = useTodosResponsaveis();
  const criarMutation = useCriarResponsavel();
  const atualizarMutation = useAtualizarResponsavel();
  const desativarMutation = useDesativarResponsavel();

  const { canCreate, isLimitReached, usage, limits } = usePlanLimits();
  const limiteResponsaveisAtingido = isLimitReached("responsaveis");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState<Responsavel | null>(null);
  const [excluindoId, setExcluindoId] = useState<string | null>(null);

  const [form, setForm] = useState({
    nome: "",
    apelido: "",
    telefone: "",
  });

  const resetForm = () => {
    setForm({ nome: "", apelido: "", telefone: "" });
    setEditando(null);
  };

  const abrirDialogNovo = () => {
    if (limiteResponsaveisAtingido) {
      toast({ title: "Limite de responsáveis atingido", description: "Faça upgrade do seu plano.", variant: "destructive" });
      return;
    }
    resetForm();
    setDialogOpen(true);
  };

  const abrirDialogEditar = (responsavel: Responsavel) => {
    setEditando(responsavel);
    setForm({
      nome: responsavel.nome,
      apelido: responsavel.apelido || "",
      telefone: responsavel.telefone || "",
    });
    setDialogOpen(true);
  };

  const handleSalvar = async () => {
    if (!form.nome.trim()) {
      toast({ title: "Informe o nome", variant: "destructive" });
      return;
    }

    // Verificar limite apenas para novos responsáveis
    if (!editando && !canCreate("responsaveis")) {
      toast({ title: "Limite de responsáveis atingido", description: "Faça upgrade do seu plano.", variant: "destructive" });
      return;
    }

    try {
      if (editando) {
        await atualizarMutation.mutateAsync({
          id: editando.id,
          dados: {
            nome: form.nome,
            apelido: form.apelido || undefined,
            telefone: form.telefone || undefined,
          },
        });
        toast({ title: "Responsável atualizado!" });
      } else {
        await criarMutation.mutateAsync({
          nome: form.nome,
          apelido: form.apelido || undefined,
          telefone: form.telefone || undefined,
        });
        toast({ title: "Responsável adicionado!" });
      }
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleDesativar = async () => {
    if (!excluindoId) return;

    try {
      await desativarMutation.mutateAsync(excluindoId);
      toast({ title: "Responsável removido!" });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível remover.",
        variant: "destructive",
      });
    }
    setExcluindoId(null);
  };

  const handleReativar = async (id: string) => {
    try {
      await atualizarMutation.mutateAsync({
        id,
        dados: { ativo: true },
      });
      toast({ title: "Responsável reativado!" });
    } catch {
      toast({ title: "Erro ao reativar", variant: "destructive" });
    }
  };

  // Separar ativos e inativos
  const ativos = responsaveis.filter((r) => r.ativo);
  const inativos = responsaveis.filter((r) => !r.ativo);

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">Responsáveis</h1>
              <PlanLimitBadge usado={usage.responsaveis} limite={limits.responsaveis} />
            </div>
            <p className="text-muted-foreground text-sm mt-0.5">
              Gerencie as pessoas que usam seus cartões
            </p>
          </div>
          <Button onClick={abrirDialogNovo} size="sm" disabled={limiteResponsaveisAtingido}>
            <UserPlus className="h-4 w-4 mr-1.5" />
            Adicionar pessoa
          </Button>
        </div>

        {limiteResponsaveisAtingido && (
          <PlanLimitAlert
            recurso="responsáveis"
            usado={usage.responsaveis}
            limite={limits.responsaveis}
            onUpgrade={() => toast({ title: "Contate o administrador", description: "Para fazer upgrade do seu plano." })}
          />
        )}

        {/* Lista de responsáveis ativos */}
        <div className="space-y-3">
          {ativos.map((responsavel, index) => (
            <Card
              key={responsavel.id}
              className="card-hover fade-in"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div
                      className={`h-12 w-12 rounded-full flex items-center justify-center ${
                        responsavel.is_titular
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {responsavel.is_titular ? (
                        <Crown className="h-5 w-5" />
                      ) : (
                        <User className="h-5 w-5" />
                      )}
                    </div>

                    {/* Info */}
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{responsavel.nome}</p>
                        {responsavel.apelido && responsavel.apelido !== responsavel.nome && (
                          <Badge variant="secondary" className="text-xs">
                            {responsavel.apelido}
                          </Badge>
                        )}
                        {responsavel.is_titular && (
                          <Badge variant="outline" className="text-xs">
                            Titular
                          </Badge>
                        )}
                      </div>
                      {responsavel.telefone && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Phone className="h-3 w-3" />
                          {responsavel.telefone}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Ações */}
                  {!responsavel.is_titular && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => abrirDialogEditar(responsavel)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-500 focus:text-red-500"
                          onClick={() => setExcluindoId(responsavel.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remover
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {ativos.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <User className="h-10 w-10 mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-muted-foreground">Nenhum responsável cadastrado</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Responsáveis inativos */}
        {inativos.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground">Inativos</h2>
            {inativos.map((responsavel) => (
              <Card key={responsavel.id} className="opacity-60">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                        <UserX className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{responsavel.nome}</p>
                        <p className="text-sm text-muted-foreground">Inativo</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReativar(responsavel.id)}
                    >
                      <UserCheck className="h-4 w-4 mr-1.5" />
                      Reativar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialog de criar/editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editando ? "Editar responsável" : "Novo responsável"}
            </DialogTitle>
            <DialogDescription>
              {editando
                ? "Atualize as informações da pessoa"
                : "Adicione uma pessoa que usa seus cartões"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome completo</Label>
              <Input
                id="nome"
                placeholder="Ex: Maria Silva"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apelido">Apelido (opcional)</Label>
              <Input
                id="apelido"
                placeholder="Ex: Mãe"
                value={form.apelido}
                onChange={(e) => setForm({ ...form, apelido: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Como você quer identificar essa pessoa
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone (opcional)</Label>
              <Input
                id="telefone"
                placeholder="(00) 00000-0000"
                value={form.telefone}
                onChange={(e) => setForm({ ...form, telefone: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Para enviar mensagens de cobrança
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSalvar}
              disabled={criarMutation.isPending || atualizarMutation.isPending}
            >
              {criarMutation.isPending || atualizarMutation.isPending
                ? "Salvando..."
                : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog de exclusão */}
      <AlertDialog open={!!excluindoId} onOpenChange={() => setExcluindoId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover responsável?</AlertDialogTitle>
            <AlertDialogDescription>
              Se essa pessoa tiver compras vinculadas, ela será apenas desativada.
              Você poderá reativá-la depois se precisar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDesativar}
              className="bg-red-500 hover:bg-red-600"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}