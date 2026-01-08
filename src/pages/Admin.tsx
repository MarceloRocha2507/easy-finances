import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { useAdmin, AdminUser } from "@/hooks/useAdmin";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Loader2, Plus, Users, Shield, MoreHorizontal, Pencil, Power, Key, UserCheck, UserX, Clock } from "lucide-react";
import { format, parseISO, isBefore, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { EditarUsuarioDialog } from "@/components/admin/EditarUsuarioDialog";
import { AlterarStatusDialog } from "@/components/admin/AlterarStatusDialog";
import { ResetarSenhaDialog } from "@/components/admin/ResetarSenhaDialog";

export default function Admin() {
  const { users, isLoadingUsers, fetchUsers, createUser, updateUser, toggleUserStatus, resetPassword } = useAdmin();
  const { toast } = useToast();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: ""
  });

  // Estados dos dialogs
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [statusUser, setStatusUser] = useState<AdminUser | null>(null);
  const [resetUser, setResetUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setIsCreating(true);

    try {
      await createUser(formData.email, formData.password, formData.full_name || undefined);
      
      toast({
        title: "Usuário criado",
        description: `${formData.email} foi cadastrado com sucesso.`
      });
      
      setFormData({ email: "", password: "", full_name: "" });
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

  async function handleUpdateUser(user_id: string, data: { email?: string; full_name?: string; data_expiracao?: string | null }) {
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

  function getValidadeBadge(user: AdminUser) {
    if (!user.data_expiracao) {
      return <span className="text-muted-foreground">Ilimitado</span>;
    }
    const expDate = parseISO(user.data_expiracao);
    const isExpired = isBefore(expDate, new Date());
    const isExpiringSoon = isBefore(expDate, addDays(new Date(), 7)) && !isExpired;
    
    return (
      <span className={isExpired ? "text-destructive" : isExpiringSoon ? "text-amber-600" : ""}>
        {format(expDate, "dd/MM/yyyy", { locale: ptBR })}
      </span>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
              <Shield className="h-6 w-6" />
              Painel Admin
            </h1>
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
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total</p>
                  <p className="text-2xl font-semibold">{users.length}</p>
                </div>
                <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Admins</p>
                  <p className="text-2xl font-semibold">
                    {users.filter(u => u.role === 'admin').length}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-md bg-amber-100 dark:bg-amber-950 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Ativos</p>
                  <p className="text-2xl font-semibold">{usuariosAtivos}</p>
                </div>
                <div className="w-10 h-10 rounded-md bg-green-100 dark:bg-green-950 flex items-center justify-center">
                  <UserCheck className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Inativos</p>
                  <p className="text-2xl font-semibold">{usuariosInativos}</p>
                </div>
                <div className="w-10 h-10 rounded-md bg-red-100 dark:bg-red-950 flex items-center justify-center">
                  <UserX className="h-5 w-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Expirando</p>
                  <p className="text-2xl font-semibold">{expirandoEmBreve}</p>
                </div>
                <div className="w-10 h-10 rounded-md bg-amber-100 dark:bg-amber-950 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
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
                    <TableHead>Status</TableHead>
                    <TableHead>Validade</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="w-[70px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.full_name || "-"}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                          {user.role === 'admin' ? 'Admin' : 'Usuário'}
                        </Badge>
                      </TableCell>
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
                              {user.ativo ? "Desativar" : "Reativar"}
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

      <ResetarSenhaDialog
        user={resetUser}
        open={!!resetUser}
        onOpenChange={(open) => !open && setResetUser(null)}
        onReset={handleResetPassword}
      />
    </Layout>
  );
}
