import { useEffect, useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { useAdmin, AdminUser, TipoPlano } from "@/hooks/useAdmin";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, Plus, Users, Shield, MoreHorizontal, Pencil, Power, Key,
  UserCheck, UserX, Clock, RefreshCw, AlertTriangle, Search, Eye, Trash2,
  ArrowRightLeft,
} from "lucide-react";
import { format, parseISO, isBefore, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { EditarUsuarioDialog } from "@/components/admin/EditarUsuarioDialog";
import { AlterarStatusDialog } from "@/components/admin/AlterarStatusDialog";
import { RenovarPlanoDialog } from "@/components/admin/RenovarPlanoDialog";
import { ResetarSenhaDialog } from "@/components/admin/ResetarSenhaDialog";
import { DetalhesUsuarioDialog } from "@/components/admin/DetalhesUsuarioDialog";
import { ExcluirUsuarioDialog } from "@/components/admin/ExcluirUsuarioDialog";
import { AtividadeRecente } from "@/components/admin/AtividadeRecente";

type FiltroStatus = "todos" | "ativos" | "inativos" | "expirados";
type FiltroPlano = "todos" | TipoPlano;

export default function Admin() {
  const {
    users, isLoadingUsers, isAdmin, isCheckingRole, stats, isLoadingStats,
    fetchUsers, fetchStats, fetchUserDetails, fetchActivity,
    createUser, updateUser, toggleUserStatus, resetPassword,
    deleteUser, bulkRenew, bulkToggle
  } = useAdmin();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "", full_name: "", tipo_plano: "mensal" as TipoPlano });

  // Dialogs
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [statusUser, setStatusUser] = useState<AdminUser | null>(null);
  const [renovarUser, setRenovarUser] = useState<AdminUser | null>(null);
  const [resetUser, setResetUser] = useState<AdminUser | null>(null);
  const [detailsUser, setDetailsUser] = useState<AdminUser | null>(null);
  const [deleteUserState, setDeleteUserState] = useState<AdminUser | null>(null);

  // Search & Filters
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>("todos");
  const [filtroPlano, setFiltroPlano] = useState<FiltroPlano>("todos");

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkRenewing, setIsBulkRenewing] = useState(false);
  const [isBulkToggling, setIsBulkToggling] = useState(false);
  const [bulkPlano, setBulkPlano] = useState<TipoPlano>("mensal");

  useEffect(() => {
    if (isAdmin && !isCheckingRole) {
      fetchUsers();
      fetchStats();
    }
  }, [isAdmin, isCheckingRole]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchBusca = !busca || 
        (u.full_name || "").toLowerCase().includes(busca.toLowerCase()) ||
        u.email.toLowerCase().includes(busca.toLowerCase());

      let matchStatus = true;
      if (filtroStatus === "ativos") matchStatus = u.ativo && !(u.data_expiracao && isBefore(parseISO(u.data_expiracao), new Date()));
      if (filtroStatus === "inativos") matchStatus = !u.ativo;
      if (filtroStatus === "expirados") matchStatus = !!(u.data_expiracao && isBefore(parseISO(u.data_expiracao), new Date()));

      const matchPlano = filtroPlano === "todos" || u.tipo_plano === filtroPlano;

      return matchBusca && matchStatus && matchPlano;
    });
  }, [users, busca, filtroStatus, filtroPlano]);

  const allSelected = filteredUsers.length > 0 && filteredUsers.every(u => selectedIds.has(u.id));

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredUsers.map(u => u.id)));
    }
  }

  function toggleSelect(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  }

  // Handlers
  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setIsCreating(true);
    try {
      await createUser(formData.email, formData.password, formData.full_name || undefined, formData.tipo_plano);
      toast({ title: "Usuário criado", description: `${formData.email} foi cadastrado com sucesso.` });
      setFormData({ email: "", password: "", full_name: "", tipo_plano: "mensal" });
      setIsDialogOpen(false);
    } catch (error: unknown) {
      toast({ title: "Erro ao criar usuário", description: error instanceof Error ? error.message : 'Erro', variant: "destructive" });
    } finally { setIsCreating(false); }
  }

  async function handleUpdateUser(user_id: string, data: { email?: string; full_name?: string; tipo_plano?: TipoPlano }) {
    try {
      await updateUser(user_id, data);
      toast({ title: "Usuário atualizado", description: "As informações foram salvas." });
    } catch (error: unknown) {
      toast({ title: "Erro", description: error instanceof Error ? error.message : 'Erro', variant: "destructive" });
      throw error;
    }
  }

  async function handleToggleStatus(user_id: string, ativo: boolean, motivo?: string) {
    try {
      await toggleUserStatus(user_id, ativo, motivo);
      toast({ title: ativo ? "Reativado" : "Desativado", description: ativo ? "Acesso restaurado." : "Acesso bloqueado." });
    } catch (error: unknown) {
      toast({ title: "Erro", description: error instanceof Error ? error.message : 'Erro', variant: "destructive" });
      throw error;
    }
  }

  async function handleResetPassword(user_id: string): Promise<string> {
    try {
      const pwd = await resetPassword(user_id);
      toast({ title: "Senha resetada" });
      return pwd;
    } catch (error: unknown) {
      toast({ title: "Erro", description: error instanceof Error ? error.message : 'Erro', variant: "destructive" });
      throw error;
    }
  }

  async function handleRenovarPlano(user_id: string, tipo_plano: TipoPlano) {
    try {
      await updateUser(user_id, { tipo_plano });
      toast({ title: "Plano renovado" });
    } catch (error: unknown) {
      toast({ title: "Erro", description: error instanceof Error ? error.message : 'Erro', variant: "destructive" });
      throw error;
    }
  }

  async function handleDeleteUser(user_id: string) {
    try {
      await deleteUser(user_id);
      toast({ title: "Usuário excluído", description: "Todos os dados foram removidos." });
      setSelectedIds(prev => { const n = new Set(prev); n.delete(user_id); return n; });
    } catch (error: unknown) {
      toast({ title: "Erro", description: error instanceof Error ? error.message : 'Erro', variant: "destructive" });
      throw error;
    }
  }

  async function handleBulkRenew() {
    if (selectedIds.size === 0) return;
    setIsBulkRenewing(true);
    try {
      await bulkRenew([...selectedIds], bulkPlano);
      toast({ title: "Planos renovados", description: `${selectedIds.size} usuário(s) atualizados.` });
      setSelectedIds(new Set());
    } catch (error: unknown) {
      toast({ title: "Erro", description: error instanceof Error ? error.message : 'Erro', variant: "destructive" });
    } finally { setIsBulkRenewing(false); }
  }

  async function handleBulkToggle(ativo: boolean) {
    if (selectedIds.size === 0) return;
    setIsBulkToggling(true);
    try {
      await bulkToggle([...selectedIds], ativo, ativo ? undefined : "Desativação em lote pelo admin");
      toast({ title: ativo ? "Reativados" : "Desativados", description: `${selectedIds.size} usuário(s).` });
      setSelectedIds(new Set());
    } catch (error: unknown) {
      toast({ title: "Erro", description: error instanceof Error ? error.message : 'Erro', variant: "destructive" });
    } finally { setIsBulkToggling(false); }
  }

  // Stats helpers
  const usuariosAtivos = users.filter(u => u.ativo).length;
  const usuariosInativos = users.filter(u => !u.ativo).length;
  const expirandoEmBreve = users.filter(u => {
    if (!u.data_expiracao) return false;
    const expDate = parseISO(u.data_expiracao);
    return isBefore(expDate, addDays(new Date(), 7)) && !isBefore(expDate, new Date());
  }).length;

  function getStatusBadge(user: AdminUser) {
    if (!user.ativo) return <Badge variant="destructive">Inativo</Badge>;
    if (user.data_expiracao && isBefore(parseISO(user.data_expiracao), new Date()))
      return <Badge variant="destructive">Expirado</Badge>;
    return <Badge className="bg-green-600 hover:bg-green-700">Ativo</Badge>;
  }

  function getPlanoBadge(user: AdminUser) {
    const cores: Record<string, string> = {
      teste: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
      mensal: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
      anual: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
      ilimitado: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
    };
    const labels: Record<string, string> = { teste: "Teste", mensal: "Mensal", anual: "Anual", ilimitado: "Ilimitado" };
    const plano = user.tipo_plano || "mensal";
    return <Badge className={cores[plano]}>{labels[plano]}</Badge>;
  }

  function getValidadeBadge(user: AdminUser) {
    if (!user.data_expiracao) return <span className="text-muted-foreground">Sem limite</span>;
    const expDate = parseISO(user.data_expiracao);
    const isExpired = isBefore(expDate, new Date());
    const isExpiringSoon = isBefore(expDate, addDays(new Date(), 7)) && !isExpired;
    return (
      <div className="flex items-center gap-1.5">
        {isExpiringSoon && <AlertTriangle className="h-4 w-4 text-amber-600 animate-pulse" />}
        <span className={isExpired ? "text-destructive font-medium" : isExpiringSoon ? "text-amber-600 font-medium" : ""}>
          {format(expDate, "dd/MM/yyyy", { locale: ptBR })}
        </span>
      </div>
    );
  }

  function isUserExpiringSoon(user: AdminUser): boolean {
    if (!user.data_expiracao) return false;
    const expDate = parseISO(user.data_expiracao);
    return isBefore(expDate, addDays(new Date(), 7)) && !isBefore(expDate, new Date());
  }

  return (
    <Layout>
      <div className="space-y-6 page-enter">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Painel Admin</h1>
            <p className="text-muted-foreground mt-1">Gerencie os usuários do sistema</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Novo Usuário</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Criar Novo Usuário</DialogTitle></DialogHeader>
              <form onSubmit={handleCreateUser} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nome completo</Label>
                  <Input id="full_name" placeholder="Nome do usuário" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail *</Label>
                  <Input id="email" type="email" placeholder="email@exemplo.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha *</Label>
                  <Input id="password" type="password" placeholder="Mínimo 6 caracteres" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required minLength={6} />
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Plano</Label>
                  <Select value={formData.tipo_plano} onValueChange={(v) => setFormData({ ...formData, tipo_plano: v as TipoPlano })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="teste">Teste (7 dias)</SelectItem>
                      <SelectItem value="mensal">Mensal (30 dias)</SelectItem>
                      <SelectItem value="anual">Anual (365 dias)</SelectItem>
                      <SelectItem value="ilimitado">Ilimitado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Criar Usuário
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { label: "Total", value: users.length, icon: Users, bg: "bg-primary/20", iconColor: "text-primary" },
            { label: "Admins", value: users.filter(u => u.role === 'admin').length, icon: Shield, bg: "bg-amber-500/20", iconColor: "text-amber-600" },
            { label: "Ativos", value: usuariosAtivos, icon: UserCheck, bg: "bg-emerald-500/20", iconColor: "text-emerald-600" },
            { label: "Inativos", value: usuariosInativos, icon: UserX, bg: "bg-rose-500/20", iconColor: "text-rose-600" },
            { label: "Expirando", value: expirandoEmBreve, icon: Clock, bg: "bg-amber-500/20", iconColor: "text-amber-600" },
            { label: "Transações", value: stats?.total_transacoes ?? "-", icon: ArrowRightLeft, bg: "bg-blue-500/20", iconColor: "text-blue-600" },
          ].map(({ label, value, icon: Icon, bg, iconColor }, i) => (
            <Card key={label} className="shadow-sm rounded-xl animate-fade-in-up" style={{ animationDelay: `${i * 0.03}s` }}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`h-5 w-5 ${iconColor}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground truncate">{label}</p>
                    <p className="text-xl font-bold">{value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Distribuição de planos */}
        {stats?.distribuicao_planos && (
          <Card className="shadow-sm rounded-xl">
            <CardContent className="p-4">
              <p className="text-sm font-medium text-muted-foreground mb-2">Distribuição de Planos</p>
              <div className="flex gap-4 flex-wrap">
                {Object.entries(stats.distribuicao_planos).map(([plano, count]) => (
                  <div key={plano} className="flex items-center gap-2">
                    <Badge className={
                      plano === "teste" ? "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300" :
                      plano === "mensal" ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300" :
                      plano === "anual" ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300" :
                      "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
                    }>
                      {plano.charAt(0).toUpperCase() + plano.slice(1)}: {count}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="usuarios" className="space-y-4">
          <TabsList>
            <TabsTrigger value="usuarios">Usuários</TabsTrigger>
            <TabsTrigger value="atividade">Atividade</TabsTrigger>
          </TabsList>

          <TabsContent value="usuarios" className="space-y-4">
            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou e-mail..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filtroStatus} onValueChange={(v) => setFiltroStatus(v as FiltroStatus)}>
                <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="ativos">Ativos</SelectItem>
                  <SelectItem value="inativos">Inativos</SelectItem>
                  <SelectItem value="expirados">Expirados</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filtroPlano} onValueChange={(v) => setFiltroPlano(v as FiltroPlano)}>
                <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos planos</SelectItem>
                  <SelectItem value="teste">Teste</SelectItem>
                  <SelectItem value="mensal">Mensal</SelectItem>
                  <SelectItem value="anual">Anual</SelectItem>
                  <SelectItem value="ilimitado">Ilimitado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bulk actions */}
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">{selectedIds.size} selecionado(s)</span>
                <div className="flex items-center gap-2 ml-auto">
                  <Select value={bulkPlano} onValueChange={(v) => setBulkPlano(v as TipoPlano)}>
                    <SelectTrigger className="w-[130px] h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="teste">Teste</SelectItem>
                      <SelectItem value="mensal">Mensal</SelectItem>
                      <SelectItem value="anual">Anual</SelectItem>
                      <SelectItem value="ilimitado">Ilimitado</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="sm" variant="outline" onClick={handleBulkRenew} disabled={isBulkRenewing}>
                    {isBulkRenewing ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <RefreshCw className="h-3 w-3 mr-1" />}
                    Renovar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleBulkToggle(false)} disabled={isBulkToggling}>
                    <Power className="h-3 w-3 mr-1" />Desativar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleBulkToggle(true)} disabled={isBulkToggling}>
                    <UserCheck className="h-3 w-3 mr-1" />Reativar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>Limpar</Button>
                </div>
              </div>
            )}

            {/* Users Table */}
            <Card className="shadow-sm rounded-xl">
              <CardHeader>
                <CardTitle>Usuários Cadastrados</CardTitle>
                <CardDescription>
                  {filteredUsers.length} de {users.length} usuário(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingUsers ? (
                  <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">Nenhum usuário encontrado</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40px]">
                          <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} />
                        </TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>E-mail</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Plano</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Validade</TableHead>
                        <TableHead>Criado em</TableHead>
                        <TableHead className="w-[70px]">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((u) => (
                        <TableRow
                          key={u.id}
                          className={isUserExpiringSoon(u) ? "bg-amber-50 dark:bg-amber-950/30 border-l-2 border-l-amber-500" : ""}
                        >
                          <TableCell>
                            <Checkbox checked={selectedIds.has(u.id)} onCheckedChange={() => toggleSelect(u.id)} />
                          </TableCell>
                          <TableCell className="font-medium">{u.full_name || "-"}</TableCell>
                          <TableCell>{u.email}</TableCell>
                          <TableCell>
                            <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                              {u.role === 'admin' ? 'Admin' : 'Usuário'}
                            </Badge>
                          </TableCell>
                          <TableCell>{getPlanoBadge(u)}</TableCell>
                          <TableCell>{getStatusBadge(u)}</TableCell>
                          <TableCell>{getValidadeBadge(u)}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(u.created_at), "dd/MM/yyyy", { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setDetailsUser(u)}>
                                  <Eye className="h-4 w-4 mr-2" />Ver detalhes
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setEditUser(u)}>
                                  <Pencil className="h-4 w-4 mr-2" />Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setStatusUser(u)}>
                                  <Power className="h-4 w-4 mr-2" />{u.ativo ? 'Desativar' : 'Reativar'}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setRenovarUser(u)}>
                                  <RefreshCw className="h-4 w-4 mr-2" />Renovar Plano
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setResetUser(u)}>
                                  <Key className="h-4 w-4 mr-2" />Resetar Senha
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteUserState(u)}>
                                  <Trash2 className="h-4 w-4 mr-2" />Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="atividade">
            <AtividadeRecente onFetch={fetchActivity} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <EditarUsuarioDialog user={editUser} open={!!editUser} onOpenChange={(o) => !o && setEditUser(null)} onSave={handleUpdateUser} />
      <AlterarStatusDialog user={statusUser} open={!!statusUser} onOpenChange={(o) => !o && setStatusUser(null)} onConfirm={handleToggleStatus} />
      <RenovarPlanoDialog user={renovarUser} open={!!renovarUser} onOpenChange={(o) => !o && setRenovarUser(null)} onConfirm={handleRenovarPlano} />
      <ResetarSenhaDialog user={resetUser} open={!!resetUser} onOpenChange={(o) => !o && setResetUser(null)} onReset={handleResetPassword} />
      <DetalhesUsuarioDialog user={detailsUser} open={!!detailsUser} onOpenChange={(o) => !o && setDetailsUser(null)} onFetchDetails={fetchUserDetails} />
      <ExcluirUsuarioDialog user={deleteUserState} open={!!deleteUserState} onOpenChange={(o) => !o && setDeleteUserState(null)} onConfirm={handleDeleteUser} />
    </Layout>
  );
}
