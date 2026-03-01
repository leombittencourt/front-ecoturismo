import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trees, Download, Smartphone, Share, PlusSquare, MoreVertical, CheckCircle2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type Platform = 'ios' | 'android' | 'desktop' | 'unknown';

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  if (/Windows|Mac|Linux/.test(ua) && !/Mobile/.test(ua)) return 'desktop';
  return 'unknown';
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function Install() {
  const navigate = useNavigate();
  const [platform] = useState<Platform>(detectPlatform);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setIsInstalled(true);
    setDeferredPrompt(null);
  };

  const iosSteps = [
    { icon: Share, text: 'Toque no botão Compartilhar', detail: 'O ícone de quadrado com seta para cima na barra inferior do Safari' },
    { icon: PlusSquare, text: 'Selecione "Adicionar à Tela de Início"', detail: 'Role a lista de opções até encontrar esta ação' },
    { icon: CheckCircle2, text: 'Toque em "Adicionar"', detail: 'Confirme o nome e o app será instalado na sua tela inicial' },
  ];

  const androidSteps = [
    { icon: MoreVertical, text: 'Toque no menu do navegador', detail: 'Os 3 pontinhos no canto superior direito do Chrome' },
    { icon: Download, text: 'Selecione "Instalar aplicativo"', detail: 'Ou "Adicionar à tela inicial" em versões mais antigas' },
    { icon: CheckCircle2, text: 'Confirme a instalação', detail: 'O app aparecerá como ícone na sua tela inicial' },
  ];

  const steps = platform === 'ios' ? iosSteps : androidSteps;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Trees className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-lg">EcoTurismo</h1>
            <p className="text-xs text-muted-foreground">Gestão de Atrativos</p>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 sm:py-10 space-y-6">
        {isInstalled ? (
          <Card className="text-center">
            <CardContent className="p-8 space-y-4">
              <CheckCircle2 className="h-16 w-16 mx-auto text-success" />
              <h2 className="text-2xl font-heading font-bold">App já instalado!</h2>
              <p className="text-muted-foreground">O EcoTurismo já está na sua tela inicial. Você pode acessá-lo diretamente por lá.</p>
              <Button onClick={() => navigate('/login')}>
                Acessar o App <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Hero */}
            <div className="text-center space-y-3">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <Smartphone className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-heading font-bold">Instale o EcoTurismo</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Tenha acesso rápido ao app direto da tela inicial do seu celular, sem precisar de app store.
              </p>
            </div>

            {/* Native install button (Android/Chrome) */}
            {deferredPrompt && (
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="p-6 text-center space-y-3">
                  <p className="font-medium text-sm">Instalação rápida disponível!</p>
                  <Button size="lg" onClick={handleInstall} className="gap-2">
                    <Download className="h-5 w-5" />
                    Instalar Agora
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Platform badge */}
            <div className="flex justify-center">
              <Badge variant="outline" className="gap-1.5 px-3 py-1">
                <Smartphone className="h-3 w-3" />
                {platform === 'ios' ? 'iPhone / iPad (Safari)' : platform === 'android' ? 'Android (Chrome)' : 'Seu dispositivo'}
              </Badge>
            </div>

            {/* Steps */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-heading">
                  {platform === 'ios' ? 'Como instalar no iPhone' : 'Como instalar no Android'}
                </CardTitle>
                <CardDescription>
                  {platform === 'ios'
                    ? 'Abra esta página no Safari e siga os passos abaixo'
                    : 'Abra esta página no Chrome e siga os passos abaixo'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-1">
                {steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-sm font-heading font-bold text-primary">{i + 1}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm flex items-center gap-2">
                        <step.icon className="h-4 w-4 text-primary shrink-0" />
                        {step.text}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{step.detail}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Benefits */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-heading">Vantagens do app</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { emoji: '⚡', label: 'Acesso instantâneo' },
                    { emoji: '📴', label: 'Funciona offline' },
                    { emoji: '🔔', label: 'Tela cheia' },
                    { emoji: '💾', label: 'Sem app store' },
                  ].map((b, i) => (
                    <div key={i} className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                      <span className="text-lg">{b.emoji}</span>
                      <span className="text-sm font-medium">{b.label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* CTA */}
            <div className="text-center">
              <Button variant="outline" onClick={() => navigate('/login')}>
                Continuar no navegador <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </main>

      <footer className="border-t bg-card py-4 text-center text-xs text-muted-foreground">
        EcoTurismo © {new Date().getFullYear()} — Gestão Inteligente do Ecoturismo
      </footer>
    </div>
  );
}
