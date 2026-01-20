import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Eye, Copy, Check } from "lucide-react";

const DEMO_EMAIL = "demo@fina.app";
const DEMO_PASSWORD = "demo123";

export default function Auth() {
  const { user, signIn, loading } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await signIn(email, password);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Verifique suas credenciais.";
      toast({
        title: "Não foi possível entrar",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async () => {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    setIsSubmitting(true);

    try {
      await signIn(DEMO_EMAIL, DEMO_PASSWORD);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao acessar conta demo.";
      toast({
        title: "Erro ao acessar demo",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <h1 className="text-xl font-semibold text-foreground">Fina</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestão financeira pessoal
          </p>
        </div>

        <Card className="border shadow-sm">
          <CardHeader className="pb-4">
            <h2 className="text-lg font-medium text-foreground">
              Acesse sua conta
            </h2>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                Entrar
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Demo Account Section */}
        <Card className="mt-4 border-dashed bg-muted/30">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-3">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Quer conhecer o sistema?</span>
            </div>
            
            <div className="space-y-2 mb-3">
              <div className="flex items-center justify-between bg-background rounded-md px-3 py-1.5 text-sm">
                <span className="text-muted-foreground">Email:</span>
                <div className="flex items-center gap-1">
                  <code className="text-foreground font-mono">{DEMO_EMAIL}</code>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => copyToClipboard(DEMO_EMAIL, 'email')}
                  >
                    {copiedField === 'email' ? (
                      <Check className="h-3 w-3 text-income" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between bg-background rounded-md px-3 py-1.5 text-sm">
                <span className="text-muted-foreground">Senha:</span>
                <div className="flex items-center gap-1">
                  <code className="text-foreground font-mono">{DEMO_PASSWORD}</code>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => copyToClipboard(DEMO_PASSWORD, 'password')}
                  >
                    {copiedField === 'password' ? (
                      <Check className="h-3 w-3 text-income" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleDemoLogin}
              disabled={isSubmitting}
            >
              {isSubmitting && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Entrar na conta demo
            </Button>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-center mt-6">
          Ao continuar, você concorda com nossos termos de uso.
        </p>
      </div>
    </div>
  );
}
