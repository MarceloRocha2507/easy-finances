import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useTransactions } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Calendar, Lock, ArrowLeftRight, Tag, LogOut } from 'lucide-react';
import { formatDateLong } from '@/lib/formatters';

export default function Profile() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const { data: transactions } = useTransactions();
  const { data: categories } = useCategories();

  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [isUpdating, setIsUpdating] = useState(false);

  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleUpdateProfile = async () => {
    setIsUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName },
      });

      if (error) throw error;

      toast({
        title: 'Perfil atualizado',
        description: 'Suas informações foram atualizadas com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o perfil.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Erro',
        description: 'As senhas não coincidem.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: 'Erro',
        description: 'A senha deve ter pelo menos 6 caracteres.',
        variant: 'destructive',
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast({
        title: 'Senha alterada',
        description: 'Sua senha foi alterada com sucesso.',
      });

      setPasswordDialogOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar a senha.',
        variant: 'destructive',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const totalTransactions = transactions?.length || 0;
  const totalCategories = categories?.length || 0;
  const memberSince = user?.created_at ? formatDateLong(user.created_at) : 'N/A';

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Meu Perfil</h1>
          <p className="text-muted-foreground">Gerencie suas informações pessoais</p>
        </div>

        {/* Profile Card */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Informações Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center text-3xl text-primary-foreground">
                {fullName ? fullName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-lg">{fullName || 'Usuário'}</p>
                <p className="text-muted-foreground">{user?.email}</p>
              </div>
            </div>

            {/* Email (read-only) */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </Label>
              <Input value={user?.email || ''} disabled className="bg-muted" />
            </div>

            {/* Full Name */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Nome Completo
              </Label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Seu nome completo"
              />
            </div>

            <Button onClick={handleUpdateProfile} disabled={isUpdating} className="gradient-primary">
              {isUpdating ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </CardContent>
        </Card>

        {/* Stats Card */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Estatísticas da Conta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-secondary text-center">
                <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center mx-auto mb-2">
                  <ArrowLeftRight className="w-5 h-5 text-primary-foreground" />
                </div>
                <p className="text-2xl font-bold text-foreground">{totalTransactions}</p>
                <p className="text-sm text-muted-foreground">Transações</p>
              </div>

              <div className="p-4 rounded-xl bg-secondary text-center">
                <div className="w-10 h-10 rounded-lg gradient-income flex items-center justify-center mx-auto mb-2">
                  <Tag className="w-5 h-5 text-income-foreground" />
                </div>
                <p className="text-2xl font-bold text-foreground">{totalCategories}</p>
                <p className="text-sm text-muted-foreground">Categorias</p>
              </div>

              <div className="p-4 rounded-xl bg-secondary text-center">
                <div className="w-10 h-10 rounded-lg gradient-expense flex items-center justify-center mx-auto mb-2">
                  <Calendar className="w-5 h-5 text-expense-foreground" />
                </div>
                <p className="text-sm font-bold text-foreground">{memberSince}</p>
                <p className="text-sm text-muted-foreground">Membro desde</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Card */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Segurança
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <Lock className="w-4 h-4 mr-2" />
                  Alterar Senha
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Alterar Senha</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Nova Senha</Label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Confirmar Nova Senha</Label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Digite novamente"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancelar</Button>
                  </DialogClose>
                  <Button
                    onClick={handleChangePassword}
                    disabled={isChangingPassword || !newPassword || !confirmPassword}
                    className="gradient-primary"
                  >
                    {isChangingPassword ? 'Alterando...' : 'Alterar Senha'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button variant="destructive" className="w-full justify-start" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sair da Conta
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
