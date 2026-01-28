import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, ArrowRight } from "lucide-react";

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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center">
            <span className="text-xl font-bold text-primary-foreground">F</span>
          </div>
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-secondary p-6">
      <div className="w-full max-w-md">
        {/* Logo & Brand */}
        <div className="mb-10 text-center animate-fade-in">
          <div className="inline-flex h-16 w-16 rounded-2xl bg-primary items-center justify-center mb-6">
            <span className="text-2xl font-bold text-primary-foreground">F</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Fina</h1>
          <p className="text-muted-foreground">
            Gestão financeira inteligente
          </p>
        </div>

        {/* Login Card */}
        <Card className="shadow-lg animate-scale-in">
          <CardContent className="p-8">
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
                />
              </div>

              <Button
                type="submit"
                size="xl"
                className="w-full"
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
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-center mt-8 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          Ao continuar, você concorda com nossos termos de uso.
        </p>
      </div>
    </div>
  );
}
