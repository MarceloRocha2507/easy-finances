import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { useAdmin, AdminUser, TipoPlano } from "@/hooks/useAdmin";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Users, Shield, MoreHorizontal, Pencil, Power, Key, UserCheck, UserX, Clock, RefreshCw, AlertTriangle } from "lucide-react";
import { format, parseISO, isBefore, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { EditarUsuarioDialog } from "@/components/admin/EditarUsuarioDialog";
import { AlterarStatusDialog } from "@/components/admin/AlterarStatusDialog";
import { RenovarPlanoDialog } from "@/components/admin/RenovarPlanoDialog";
import { ResetarSenhaDialog } from "@/components/admin/ResetarSenhaDialog";

export default function Admin() {
  const { users, isLoadingUsers, isAdmin, isCheckingRole, fetchUsers, createUser, updateUser, toggleUserStatus, resetPassword } = useAdmin();
  const { toast } = useToast();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    tipo_plano: "mensal" as TipoPlano
  });

  // Estados dos dialogs
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [statusUser, setStatusUser] = useState<AdminUser | null>(null);
  const [renovarUser, setRenovarUser] = useState<AdminUser | null>(null);
  const [resetUser, setResetUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    if (isAdmin && !isCheckingRole) {
      fetchUsers();
    }
  }, [isAdmin, isCheckingRole]);

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setIsCreating(true);

    try {
      await createUser(formData.email, formData.password, formData.full_name || undefined, formData.tipo_plano);
      
      toast({
        title: "Usuário criado",
        description: `${formData.email} foi cadastrado com sucesso.`
      });
      
      setFormData({ email: "", password: "", full_name: "", tipo_plano: "mensal" });
      setIsDialogOpen(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: "Erro ao criar usuário",
        description: message,
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  }

  async function handleUpdateUser(user_id: string, data: { email?: string; full_name?: string; tipo_plano?: TipoPlano }) {
    try {
      await updateUser(user_id, data);
      toast({
        title: "Usuário atualizado",
        description: "As informações foram salvas com sucesso."
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: "Erro ao atualizar",
        description: message,
        variant: "destructive"
      });
      throw error;
    }
  }

  async function handleToggleStatus(user_id: string, ativo: boolean, motivo?: string) {
    try {
      await toggleUserStatus(user_id, ativo, motivo);
      toast({
        title: ativo ? "Usuário reativado" : "Usuário desativado",
        description: ativo ? "O acesso foi restaurado." : "O acesso foi bloqueado."
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: "Erro ao alterar status",
        description: message,
        variant: "destructive"
      });
      throw error;
    }
  }

  async function handleResetPassword(user_id: string): Promise<string> {
    try {
      const newPassword = await resetPassword(user_id);
      toast({
        title: "Senha resetada",
        description: "Uma nova senha foi gerada."
      });
      return newPassword;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: "Erro ao resetar senha",
        description: message,
        variant: "destructive"
      });
      throw error;
    }
  }

  async function handleRenovarPlano(user_id: string, tipo_plano: TipoPlano) {
    try {
      await updateUser(user_id, { tipo_plano });
      toast({
        title: "Plano renovado",
        description: "A validade foi recalculada com sucesso."
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: "Erro ao renovar plano",
        description: message,
        variant: "destructive"
      });
      throw error;
    }
  }

  // Estatísticas
  const usuariosAtivos = users.filter(u => u.ativo).length;
  const usuariosInativos = users.filter(u => !u.ativo).length;
  const expirandoEmBreve = users.filter(u => {
    if (!u.data_expiracao) return false;
    const expDate = parseISO(u.data_expiracao);
    return isBefore(expDate, addDays(new Date(), 7)) && !isBefore(expDate, new Date());
  }).length;

  function getStatusBadge(user: AdminUser) {
    if (!user.ativo) {
      return <Badge variant="destructive">Inativo</Badge>;
    }
    if (user.data_expiracao && isBefore(parseISO(user.data_expiracao), new Date())) {
      return <Badge variant="destructive">Expirado</Badge>;
    }
    return <Badge className="bg-green-600 hover:bg-green-700">Ativo</Badge>;
  }

  function getPlanoBadge(user: AdminUser) {
    const cores = {
      teste: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
      mensal: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
      anual: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
      ilimitado: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
    };
    const labels = {
      teste: "Teste",
      mensal: "Mensal",
      anual: "Anual",
      ilimitado: "Ilimitado",
    };
    const plano = user.tipo_plano || "mensal";
    return <Badge className={cores[plano]}>{labels[plano]}</Badge>;
  }

  function getValidadeBadge(user: AdminUser) {
    if (!user.data_expiracao) {
      return <span className="text-muted-foreground">Sem limite</span>;
    }
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Painel Admin</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie os usuários do sistema
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Usuário</DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleCreateUser} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nome completo</Label>
                  <Input
                    id="full_name"
                    placeholder="Nome do usuário"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@exemplo.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Senha *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tipo de Plano</Label>
                  <Select 
                    value={formData.tipo_plano} 
                    onValueChange={(v) => setFormData({ ...formData, tipo_plano: v as TipoPlano })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="teste">Período de Teste (7 dias)</SelectItem>
                      <SelectItem value="mensal">Mensal (30 dias)</SelectItem>
                      <SelectItem value="anual">Anual (365 dias)</SelectItem>
                      <SelectItem value="ilimitado">Ilimitado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Criar Usuário
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="gradient-neutral shadow-lg rounded-xl border-0 animate-fade-in-up">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total</p>
                  <p className="text-2xl sm:text-3xl font-bold">{users.length}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm rounded-xl border-l-4 border-l-amber-500 animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Admins</p>
                  <p className="text-2xl sm:text-3xl font-bold">
                    {users.filter(u => u.role === 'admin').length}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-income shadow-lg rounded-xl border-0 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Ativos</p>
                  <p className="text-2xl sm:text-3xl font-bold text-income">{usuariosAtivos}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <UserCheck className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-expense shadow-lg rounded-xl border-0 animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Inativos</p>
                  <p className="text-2xl sm:text-3xl font-bold text-expense">{usuariosInativos}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-rose-500/20 flex items-center justify-center">
                  <UserX className="h-6 w-6 text-rose-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm rounded-xl border-l-4 border-l-amber-500 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Expirando</p>
                  <p className="text-2xl sm:text-3xl font-bold">{expirandoEmBreve}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card className="shadow-sm rounded-xl animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <CardHeader>
            <CardTitle>Usuários Cadastrados</CardTitle>
            <CardDescription>
              Lista de todos os usuários do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingUsers ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum usuário cadastrado
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
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
                  {users.map((user) => (
                    <TableRow 
                      key={user.id}
                      className={isUserExpiringSoon(user) ? "bg-amber-50 dark:bg-amber-950/30 border-l-2 border-l-amber-500" : ""}
                    >
                      <TableCell className="font-medium">
                        {user.full_name || "-"}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                          {user.role === 'admin' ? 'Admin' : 'Usuário'}
                        </Badge>
                      </TableCell>
                      <TableCell>{getPlanoBadge(user)}</TableCell>
                      <TableCell>{getStatusBadge(user)}</TableCell>
                      <TableCell>{getValidadeBadge(user)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(user.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditUser(user)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatusUser(user)}>
                              <Power className="h-4 w-4 mr-2" />
                              {user.ativo ? 'Desativar' : 'Reativar'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setRenovarUser(user)}>
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Renovar Plano
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setResetUser(user)}>
                              <Key className="h-4 w-4 mr-2" />
                              Resetar Senha
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
      </div>

      {/* Dialogs */}
      <EditarUsuarioDialog
        user={editUser}
        open={!!editUser}
        onOpenChange={(open) => !open && setEditUser(null)}
        onSave={handleUpdateUser}
      />
      <AlterarStatusDialog
        user={statusUser}
        open={!!statusUser}
        onOpenChange={(open) => !open && setStatusUser(null)}
        onConfirm={handleToggleStatus}
      />
      <RenovarPlanoDialog
        user={renovarUser}
        open={!!renovarUser}
        onOpenChange={(open) => !open && setRenovarUser(null)}
        onConfirm={handleRenovarPlano}
      />
      <ResetarSenhaDialog
        user={resetUser}
        open={!!resetUser}
        onOpenChange={(open) => !open && setResetUser(null)}
        onReset={handleResetPassword}
      />
    </Layout>
  );
}
