import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Lock, Mail, LogOut, ChevronRight, Shield, CheckCircle2 } from 'lucide-react';

export function SegurancaTab() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword) {
      toast({
        title: 'Erro',
        description: 'Digite sua senha atual.',
        variant: 'destructive',
      });
      return;
    }

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

    if (newPassword.length > 72) {
      toast({
        title: 'Erro',
        description: 'A senha deve ter no máximo 72 caracteres.',
        variant: 'destructive',
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      // Verify current password
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: currentPassword,
      });

      if (authError) {
        toast({
          title: 'Erro',
          description: 'Senha atual incorreta.',
          variant: 'destructive',
        });
        return;
      }

      // Update password
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

  const isEmailVerified = user?.email_confirmed_at != null;

  return (
    <div className="space-y-6">
      {/* Segurança da Conta */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Segurança da Conta
          </CardTitle>
          <CardDescription>
            Gerencie a segurança da sua conta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Alterar Senha */}
          <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
            <DialogTrigger asChild>
              <button className="w-full flex items-center justify-between p-4 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-foreground">Alterar Senha</p>
                    <p className="text-sm text-muted-foreground">
                      Atualize sua senha de acesso
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Alterar Senha</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Senha Atual</Label>
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Digite sua senha atual"
                  />
                </div>
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
                >
                  {isChangingPassword ? 'Alterando...' : 'Alterar Senha'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Verificação de Email */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-secondary">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Verificação de Email</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            {isEmailVerified ? (
              <Badge variant="outline" className="bg-income/10 text-income border-income/20">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Verificado
              </Badge>
            ) : (
              <Badge variant="secondary">Pendente</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Zona de Perigo */}
      <Card className="border-0 shadow-lg border-destructive/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <LogOut className="w-5 h-5" />
            Sessão
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            variant="destructive" 
            className="w-full" 
            onClick={signOut}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair da Conta
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
