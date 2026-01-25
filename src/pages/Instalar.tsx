import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, Smartphone, Monitor, Check, Share, MoreVertical, Plus, ArrowLeft, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function Instalar() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isSafari, setIsSafari] = useState(false);

  useEffect(() => {
    // Detectar plataforma
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);
    setIsAndroid(/android/.test(userAgent));

    // Detectar Safari no iOS
    const isSafariBrowser = isIOSDevice && /safari/.test(userAgent) && !/crios|fxios|opios|mercury/.test(userAgent);
    setIsSafari(isSafariBrowser);

    // Verificar se já está instalado (modo standalone)
    const standalone = window.matchMedia("(display-mode: standalone)").matches || 
                       (window.navigator as any).standalone === true;
    setIsStandalone(standalone);
    setIsInstalled(standalone);

    // Capturar evento de instalação (Android/Desktop)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Detectar quando o app foi instalado
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      toast.success("App instalado com sucesso!");
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      toast.error("Instalação não disponível no momento");
      return;
    }

    try {
      await deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      
      if (result.outcome === "accepted") {
        toast.success("App instalado com sucesso!");
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } catch (error) {
      console.error("Erro ao instalar:", error);
      toast.error("Erro ao instalar o app");
    }
  };

  if (isStandalone) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Você já está usando o app!</CardTitle>
            <CardDescription>
              O AppFinance está instalado e funcionando no seu dispositivo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/dashboard">
              <Button className="w-full" size="lg">
                Ir para o Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container max-w-2xl mx-auto p-4">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Dashboard
          </Link>
        </div>
      </div>

      <div className="container max-w-2xl mx-auto p-4 py-8 space-y-6">
        {/* Alerta para iOS fora do Safari */}
        {isIOS && !isSafari && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Atenção:</strong> No iPhone/iPad, a instalação só funciona pelo <strong>Safari</strong>. 
              Abra este link no Safari para instalar o app.
            </AlertDescription>
          </Alert>
        )}

        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
            <Smartphone className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold">Instale o AppFinance</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Tenha acesso rápido às suas finanças direto da tela inicial do seu celular, 
            como um app nativo.
          </p>
        </div>

        {/* Benefícios */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Por que instalar?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Download className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-medium">Acesso rápido</p>
                <p className="text-sm text-muted-foreground">Abra direto da tela inicial, sem precisar do navegador</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Monitor className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-medium">Tela cheia</p>
                <p className="text-sm text-muted-foreground">Experiência imersiva sem barras do navegador</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Check className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-medium">Funciona offline</p>
                <p className="text-sm text-muted-foreground">Acesse páginas já visitadas mesmo sem internet</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botão de instalação (Android/Desktop) */}
        {deferredPrompt && (
          <Card className="border-primary">
            <CardContent className="pt-6">
              <Button onClick={handleInstall} size="lg" className="w-full gap-2">
                <Download className="w-5 h-5" />
                Instalar AppFinance
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-3">
                Clique para adicionar à tela inicial
              </p>
            </CardContent>
          </Card>
        )}

        {/* Instruções para iOS no Safari */}
        {isIOS && isSafari && !deferredPrompt && (
          <Card className="border-primary bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-primary" />
                Instruções para iPhone/iPad
              </CardTitle>
              <CardDescription>
                Siga os passos abaixo para instalar o app
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center flex-shrink-0 text-lg font-bold">
                  1
                </div>
                <div className="flex-1 pt-1">
                  <p className="font-medium text-lg">Toque no botão Compartilhar</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="p-2 bg-muted rounded-lg">
                      <Share className="w-6 h-6 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      O ícone fica na barra inferior do Safari
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center flex-shrink-0 text-lg font-bold">
                  2
                </div>
                <div className="flex-1 pt-1">
                  <p className="font-medium text-lg">Toque em "Adicionar à Tela de Início"</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="p-2 bg-muted rounded-lg">
                      <Plus className="w-6 h-6 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Role para baixo se necessário
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center flex-shrink-0 text-lg font-bold">
                  3
                </div>
                <div className="flex-1 pt-1">
                  <p className="font-medium text-lg">Confirme tocando em "Adicionar"</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    O ícone do AppFinance aparecerá na sua tela inicial
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instruções para iOS fora do Safari */}
        {isIOS && !isSafari && !deferredPrompt && !isInstalled && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                Como instalar no iPhone/iPad
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Para instalar o AppFinance no seu dispositivo Apple:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Copie o link desta página</li>
                <li>Abra o <strong>Safari</strong></li>
                <li>Cole o link e acesse</li>
                <li>Siga as instruções de instalação</li>
              </ol>
            </CardContent>
          </Card>
        )}

        {/* Instruções para Android (caso não tenha o prompt) */}
        {isAndroid && !deferredPrompt && !isInstalled && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                Instruções para Android
              </CardTitle>
              <CardDescription>
                Instale pelo menu do navegador
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center flex-shrink-0 text-lg font-bold">
                  1
                </div>
                <div className="flex-1 pt-1">
                  <p className="font-medium">Toque no menu do navegador</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="p-2 bg-muted rounded-lg">
                      <MoreVertical className="w-5 h-5" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      No canto superior direito
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center flex-shrink-0 text-lg font-bold">
                  2
                </div>
                <div className="flex-1 pt-1">
                  <p className="font-medium">Toque em "Instalar app"</p>
                  <p className="text-sm text-muted-foreground">
                    Ou "Adicionar à tela inicial"
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center flex-shrink-0 text-lg font-bold">
                  3
                </div>
                <div className="flex-1 pt-1">
                  <p className="font-medium">Confirme a instalação</p>
                  <p className="text-sm text-muted-foreground">
                    O ícone aparecerá na sua tela inicial
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instruções para Desktop */}
        {!isIOS && !isAndroid && !deferredPrompt && !isInstalled && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Monitor className="w-5 h-5" />
                Instruções para Desktop
              </CardTitle>
              <CardDescription>
                Instale pelo navegador Chrome, Edge ou outros
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center flex-shrink-0 text-lg font-bold">
                  1
                </div>
                <div className="flex-1 pt-1">
                  <p className="font-medium">Procure o ícone de instalação</p>
                  <p className="text-sm text-muted-foreground">
                    Na barra de endereço, procure o ícone <Download className="w-4 h-4 inline" /> ou <Plus className="w-4 h-4 inline" />
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center flex-shrink-0 text-lg font-bold">
                  2
                </div>
                <div className="flex-1 pt-1">
                  <p className="font-medium">Clique em "Instalar"</p>
                  <p className="text-sm text-muted-foreground">
                    O app será adicionado aos seus aplicativos
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Já instalado */}
        {isInstalled && !isStandalone && (
          <Card className="border-green-500/50 bg-green-500/5">
            <CardContent className="pt-6">
              <div className="text-center space-y-3">
                <div className="mx-auto w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
                  <Check className="w-6 h-6 text-green-500" />
                </div>
                <p className="font-medium text-green-600 dark:text-green-400">
                  App instalado com sucesso!
                </p>
                <p className="text-sm text-muted-foreground">
                  Procure o ícone do AppFinance na sua tela inicial
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
