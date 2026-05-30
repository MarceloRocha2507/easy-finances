import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

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
      const { error } = await signIn(email, password);
      if (error) {
        toast({
          title: "Não foi possível entrar",
          description: error.message || "Verifique suas credenciais.",
          variant: "destructive",
        });
      }
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
        <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'hsl(var(--accent-violet))' }} />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 min-h-screen">

      {/* Painel esquerdo — decorativo (desktop only) */}
      <div className="hidden lg:flex lg:col-span-2 flex-col items-center justify-center relative overflow-hidden bg-[#0f0f13]">
        {/* Elementos decorativos */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 60% 50% at 50% 60%, hsl(262 83% 41% / 0.35) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: 'hsl(262 83% 60%)' }}
        />
        {/* Grade sutil */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(hsl(0 0% 100%) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 100%) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Conteúdo */}
        <div className="relative z-10 text-center px-10">
          <div className="flex items-center justify-center gap-2.5 mb-6">
            <span
              className="w-3 h-3 rounded-full animate-pulse"
              style={{ backgroundColor: 'hsl(262 83% 65%)' }}
            />
            <span className="font-display font-extrabold text-6xl text-white tracking-tight">
              Fina
            </span>
          </div>
          <p className="text-white/50 text-sm font-display font-medium tracking-widest uppercase">
            Gestão financeira pessoal
          </p>

          {/* Feature chips */}
          <div className="mt-12 flex flex-col gap-3">
            {[
              'Controle de transações',
              'Cartões de crédito',
              'Metas e economia',
              'Relatórios inteligentes',
            ].map((feat) => (
              <div
                key={feat}
                className="flex items-center gap-2.5 text-white/40 text-sm"
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: 'hsl(262 83% 65%)' }}
                />
                {feat}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Painel direito — formulário */}
      <div className="lg:col-span-3 flex flex-col items-center justify-center bg-background px-6 py-12 min-h-screen lg:min-h-0">

        {/* Logo mobile */}
        <div className="lg:hidden mb-10 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: 'hsl(var(--accent-violet))' }}
            />
            <span className="font-display font-extrabold text-4xl text-foreground tracking-tight">
              Fina
            </span>
          </div>
          <p className="text-xs text-muted-foreground font-display font-medium uppercase tracking-widest">
            Gestão financeira pessoal
          </p>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="font-display font-bold text-2xl text-foreground mb-1">
              Acesse sua conta
            </h1>
            <p className="text-sm text-muted-foreground">
              Entre com suas credenciais para continuar
            </p>
          </div>

          <form onSubmit={handleSignIn} className="space-y-5">
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block font-display font-semibold text-[10px] uppercase tracking-widest text-muted-foreground"
              >
                E-mail
              </label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="h-11 rounded-xl border-border/60 bg-muted/30 focus-visible:ring-0 focus-visible:border-[hsl(var(--accent-violet))] transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block font-display font-semibold text-[10px] uppercase tracking-widest text-muted-foreground"
              >
                Senha
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="h-11 rounded-xl border-border/60 bg-muted/30 focus-visible:ring-0 focus-visible:border-[hsl(var(--accent-violet))] transition-colors"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 rounded-xl font-display font-semibold text-sm text-white border-0 mt-2"
              disabled={isSubmitting}
              style={{
                backgroundColor: 'hsl(var(--accent-violet))',
                boxShadow: '0 4px 14px hsl(var(--accent-violet) / 0.35)',
              }}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {isSubmitting ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          <p className="text-xs text-muted-foreground/60 text-center mt-8">
            Ao continuar, você concorda com nossos termos de uso.
          </p>
        </div>
      </div>
    </div>
  );
}
