import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Trees, Waves, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useConfiguracoes } from "@/hooks/useConfiguracoes";

export default function Login() {
  const { configs } = useConfiguracoes();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const ok = await login(email, senha);

    setLoading(false);

    if (!ok) {
      toast({
        title: "Erro ao entrar",
        description: "Credenciais inválidas. Verifique e-mail e senha.",
        variant: "destructive",
      });
      return;
    }

    // user pode ainda não estar atualizado no mesmo tick; então buscamos do localStorage como fonte imediata
    const saved = localStorage.getItem("eco_auth");
    const role =
      (saved ? (() => { try { return JSON.parse(saved)?.user?.role; } catch { return undefined; } })() : undefined) ??
      user?.role;

    // Redirect based on role
    if (role === "balneario" || role === "Balneario") {
      navigate("/balneario");
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel - Nature visual */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-nature-dark items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-secondary/60 to-water/40" />
        <div className="relative z-10 text-center px-12 space-y-6">
          <div className="flex justify-center gap-4 mb-4">
            <Trees className="h-16 w-16 text-nature-light" />
            <Waves className="h-16 w-16 text-accent" />
          </div>
          <h1 className="text-4xl font-heading font-bold text-white leading-tight">
            Gestão Inteligente do Ecoturismo
          </h1>
          <p className="text-lg text-white/80 max-w-md mx-auto">
            Plataforma integrada para monitoramento, reservas e sustentabilidade dos atrativos naturais do seu município.
          </p>
          <div className="flex justify-center gap-8 pt-8">
            <div className="text-center">
              <p className="text-3xl font-heading font-bold text-white">479</p>
              <p className="text-sm text-white/70">Visitantes Hoje</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-heading font-bold text-white">5</p>
              <p className="text-sm text-white/70">Atrativos</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-heading font-bold text-white">72%</p>
              <p className="text-sm text-white/70">Ocupação</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel - Login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-sand">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardHeader className="text-center space-y-2">
            {configs.logo_login ? (
              <img
                src={configs.logo_login}
                alt={configs.nome_sistema}
                className="mx-auto w-16 h-16 object-contain mb-2"
              />
            ) : (
              <div className="mx-auto w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-2">
                <Trees className="h-6 w-6 text-primary-foreground" />
              </div>
            )}
            <CardTitle className="text-2xl font-heading">{configs.nome_sistema}</CardTitle>
            <CardDescription>Acesse o painel de gestão do município</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.gov.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="senha">Senha</Label>
                <Input
                  id="senha"
                  type="password"
                  placeholder="••••••••"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                <LogIn className="mr-2 h-4 w-4" />
                {loading ? "Entrando..." : "Entrar"}
              </Button>

              <div className="text-center text-xs text-muted-foreground mt-4 space-y-1">
                <p className="font-medium">Usuários demo:</p>
                <p>admin@eco.gov.br (Admin)</p>
                <p>prefeitura@eco.gov.br (Prefeitura)</p>
                <p>balneario@eco.gov.br (Balneário)</p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}