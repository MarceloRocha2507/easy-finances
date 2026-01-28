import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Wallet, ArrowRight } from "lucide-react";

export default function Auth() {
  const { user, signIn, loading } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background mesh-gradient-auth">
        <div className="flex flex-col items-center gap-4 animate-pulse-soft">
          <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center shadow-glow">
            <Wallet className="h-8 w-8 text-white" />
          </div>
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background mesh-gradient-auth p-6">
      {/* Floating orbs for visual interest */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 right-1/3 w-48 h-48 bg-income/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo & Brand */}
        <div className="mb-10 text-center animate-fade-in">
          <div className="inline-flex h-20 w-20 rounded-3xl gradient-primary items-center justify-center shadow-glow mb-6 animate-float">
            <Wallet className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Fina</h1>
          <p className="text-muted-foreground">
            Gestão financeira inteligente
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-strong rounded-3xl p-8 shadow-2xl animate-scale-in">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-foreground">
              Bem-vindo de volta
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Entre para acessar sua conta
            </p>
          </div>

          <form onSubmit={handleSignIn} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                E-mail
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="h-12"
              />
            </div>

            <Button
              type="submit"
              size="lg"
              variant="gradient"
              className="w-full h-12 text-base"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Entrar
                  <ArrowRight className="h-5 w-5 ml-1" />
                </>
              )}
            </Button>
          </form>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-8 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          Ao continuar, você concorda com nossos termos de uso.
        </p>
      </div>
    </div>
  );
}
