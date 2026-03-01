import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Trees, Waves, MapPin, CalendarCheck, Shield, BarChart3, Leaf, Users, Building2 } from 'lucide-react';
import { useConfiguracoes } from '@/hooks/useConfiguracoes';
import SEOHead from '@/components/SEOHead';
import { apiClient } from '@/services/apiClient';

interface AtrativoCard {
  id: string;
  nome: string;
  municipio: string;
  ocupacaoAtual: number;
  capacidadeMaxima: number;
  imagemUrl: string;
}

function toNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function getOcupacaoStyle(pct: number) {
  if (pct >= 80) return { bar: 'bg-destructive', text: 'text-destructive' };
  if (pct >= 50) return { bar: 'bg-warning', text: 'text-yellow-600' };
  return { bar: 'bg-success', text: 'text-success' };
}

export default function Index() {
  const { configs } = useConfiguracoes();
  const [atrativos, setAtrativos] = useState<AtrativoCard[]>([]);
  const municipioId = (import.meta.env.VITE_MUNICIPIO_ID as string | undefined)?.trim();

  useEffect(() => {
    let active = true;

    const loadAtrativos = async () => {
      try {
        const data = await apiClient.listarAtrativosPublicos(municipioId || undefined);
        if (!active) return;

        const mapped: AtrativoCard[] = (data ?? [])
          .filter((a: any) => (a.status ?? a.Status ?? 'ativo').toString().toLowerCase() === 'ativo')
          .map((a: any) => ({
            id: String(a.id ?? ''),
            nome: String(a.nome ?? 'Atrativo'),
            municipio: String(a.municipioNome ?? a.municipio_nome ?? a.municipio ?? ''),
            ocupacaoAtual: toNumber(a.ocupacaoAtual ?? a.ocupacao_atual ?? a.OcupacaoAtual),
            capacidadeMaxima: Math.max(1, toNumber(a.capacidadeMaxima ?? a.capacidade_maxima ?? a.CapacidadeMaxima)),
            imagemUrl: String(a.imagemUrl ?? a.imagem_url ?? a.imagem ?? ''),
          }))
          .filter((a) => Boolean(a.id))
          .slice(0, 6);

        const missingMunicipioIds = Array.from(
          new Set(
            (data ?? [])
              .filter((a: any) => !(a.municipioNome ?? a.municipio_nome ?? a.municipio))
              .map((a: any) => String(a.municipioId ?? a.municipio_id ?? ''))
              .filter(Boolean)
          )
        );

        if (missingMunicipioIds.length === 0) {
          setAtrativos(mapped);
          return;
        }

        const municipioPairs = await Promise.all(
          missingMunicipioIds.map(async (id) => {
            try {
              const m = await apiClient.getMunicipio(id);
              return [id, `${m.nome}${m.uf ? ` - ${m.uf}` : ''}`] as const;
            } catch {
              return [id, 'Município'] as const;
            }
          })
        );

        if (!active) return;
        const municipiosMap = new Map<string, string>(municipioPairs);

        setAtrativos(
          mapped.map((a, idx) => {
            if (a.municipio) return a;
            const raw = data?.[idx] as any;
            const mId = String(raw?.municipioId ?? raw?.municipio_id ?? '');
            return { ...a, municipio: municipiosMap.get(mId) || 'Município' };
          })
        );
      } catch {
        if (!active) return;
        setAtrativos([]);
      }
    };

    loadAtrativos();
    return () => {
      active = false;
    };
  }, [municipioId]);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="EcoTurismo - Gestão Inteligente do Ecoturismo Municipal"
        description="Reserve visitas a balneários, cachoeiras e trilhas. Acompanhe ocupação em tempo real e garanta sustentabilidade ambiental."
      />
      {/* Hero */}
      <header className="relative overflow-hidden bg-gradient-to-br from-primary via-secondary to-accent/80 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djZoLTZ2LTZoNnptMC0zMHY2aC02VjRoNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
        <nav className="relative z-10 max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {configs.logo_publica ? (
              <img src={configs.logo_publica} alt={configs.nome_sistema} className="h-8 object-contain" />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                <Trees className="h-6 w-6 text-white" />
              </div>
            )}
            <span className="text-lg font-heading font-bold">{configs.nome_sistema}</span>
          </div>
          <div className="flex items-center gap-4 sm:gap-5 text-sm font-medium">
            <Link to="/" className="text-white/90 hover:text-white transition-all duration-200 hover:-translate-y-0.5">
              Início
            </Link>
            <Link to="/atrativos" className="text-white/80 hover:text-white transition-all duration-200 hover:-translate-y-0.5">
              Atrativos
            </Link>
            <Link to="/reservar" className="text-white/80 hover:text-white transition-all duration-200 hover:-translate-y-0.5">
              Reservas
            </Link>
            <Link to="/login" className="text-white/80 hover:text-white transition-all duration-200 hover:-translate-y-0.5">
              Área Administrativa
            </Link>
          </div>
        </nav>
        <div className="relative z-10 max-w-6xl mx-auto px-4 pt-3 pb-8 sm:pt-5 sm:pb-11">
          <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-8 lg:gap-10 items-center">
            <div>
              <h1 className="text-3xl sm:text-5xl font-heading font-extrabold tracking-tight leading-tight">
                Gestão Inteligente do Ecoturismo Municipal
              </h1>
              <p className="mt-4 text-base sm:text-lg text-white/95 max-w-xl drop-shadow-[0_1px_1px_rgba(0,0,0,0.35)]">
                Controle ambiental, reservas digitais e monitoramento em tempo real para decisões públicas baseadas em dados.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Link to="/reservar">
                  <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-heading font-semibold px-8 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
                    <CalendarCheck className="mr-2 h-5 w-5" />
                    Reservar Visita
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
                    Área Administrativa
                  </Button>
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-white/30 bg-white/12 backdrop-blur-xl p-4 sm:p-5 shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
              <div className="rounded-xl bg-background/94 text-foreground border border-white/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Painel Operacional</p>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-success/15 text-success">Online</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg bg-muted p-2.5">
                    <p className="text-[11px] text-foreground/70">Visitas Hoje</p>
                    <p className="text-base font-semibold">186</p>
                  </div>
                  <div className="rounded-lg bg-muted p-2.5">
                    <p className="text-[11px] text-foreground/70">Taxa Média</p>
                    <p className="text-base font-semibold">74%</p>
                  </div>
                  <div className="rounded-lg bg-muted p-2.5">
                    <p className="text-[11px] text-foreground/70">Alertas</p>
                    <p className="text-base font-semibold">2</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {[
                    { label: 'Balneário Central', value: 82 },
                    { label: 'Cachoeira Azul', value: 67 },
                    { label: 'Trilha do Sol', value: 49 },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-foreground/70">{item.label}</span>
                        <span className="font-medium">{item.value}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted">
                        <div className="h-1.5 rounded-full bg-primary" style={{ width: `${item.value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Indicadores */}
      <section className="max-w-6xl mx-auto px-4 -mt-6 sm:-mt-8 pt-4 sm:pt-6 pb-16 relative z-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            { icon: Leaf, label: 'Atrativos Monitorados', value: '12' },
            { icon: Users, label: 'Visitantes este mês', value: '1.284' },
            { icon: BarChart3, label: 'Taxa de Controle Ambiental', value: '98%' },
            { icon: Building2, label: 'Municípios Integrados', value: '3' },
          ].map((item, idx) => (
            <div
              key={idx}
              className="rounded-[12px] border border-border/60 bg-white px-4 py-3 shadow-[0_4px_12px_rgba(15,23,42,0.06)] animate-in fade-in-0 slide-in-from-bottom-1 duration-500 transition-all hover:-translate-y-1 hover:shadow-[0_8px_18px_rgba(15,23,42,0.10)]"
              style={{ animationDelay: `${idx * 90}ms` }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[10px] bg-primary/15 border border-primary/20 flex items-center justify-center shadow-sm">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xl font-heading font-extrabold text-foreground leading-none">{item.value}</p>
                  <p className="text-[11px] text-foreground/65 mt-1">{item.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Como Funciona */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">
            Como funciona a plataforma?
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              step: '01',
              icon: Shield,
              title: 'Controle de Capacidade Ambiental',
              desc: 'Defina limites por atrativo e mantenha a ocupação dentro dos parâmetros de sustentabilidade.',
            },
            {
              step: '02',
              icon: CalendarCheck,
              title: 'Gestão de Reservas Inteligente',
              desc: 'Centralize as reservas, evite sobrecarga e organize a visitação com regras por período.',
            },
            {
              step: '03',
              icon: BarChart3,
              title: 'Monitoramento em Tempo Real',
              desc: 'Acompanhe indicadores operacionais e ambientais para decisões rápidas e seguras.',
            },
          ].map((item, idx) => (
            <article
              key={idx}
              className="rounded-xl border border-border bg-card p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <span className="text-lg sm:text-2xl font-extrabold tracking-wide text-primary/80 leading-none">
                  PASSO {item.step}
                </span>
              </div>
              <h3 className="font-heading font-semibold text-foreground mb-2">{item.title}</h3>
              <p className="text-sm text-foreground/70">{item.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Bloco Visual de Reservas */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">
              Explore e reserve seu próximo destino
            </h2>
            <p className="text-sm sm:text-base text-foreground/70 mt-1">
              Confira os atrativos disponíveis e faça sua reserva em poucos cliques.
            </p>
          </div>
          <Link to="/reservar" className="hidden sm:block">
            <Button variant="outline">Ver todos</Button>
          </Link>
        </div>

        {atrativos.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { nome: 'Balneário Modelo', municipio: 'Município Exemplo - MT', ocupacao: 58 },
              { nome: 'Cachoeira Modelo', municipio: 'Município Exemplo - MT', ocupacao: 72 },
              { nome: 'Trilha Modelo', municipio: 'Município Exemplo - MT', ocupacao: 41 },
            ].map((m, idx) => (
              <article
                key={idx}
                className="group rounded-xl overflow-hidden border border-border bg-card/90 opacity-90 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="h-44 relative bg-gradient-to-br from-primary/15 via-secondary/15 to-accent/20 flex items-center justify-center overflow-hidden">
                  <Waves className="h-8 w-8 text-primary/70 transition-transform duration-300 group-hover:scale-110" />
                  <span className="absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded-full bg-background/90 text-foreground/70 border border-border">
                    Exemplo
                  </span>
                </div>
                <div className="p-4 space-y-3">
                  {(() => {
                    const tone = getOcupacaoStyle(m.ocupacao);
                    return (
                      <>
                  <div>
                    <h3 className="font-heading font-semibold text-foreground line-clamp-1">{m.nome}</h3>
                    <p className="text-xs text-foreground/70 flex items-center gap-1 mt-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {m.municipio}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-foreground/70">Ocupação atual</span>
                      <span className={`text-sm font-extrabold ${tone.text}`}>{m.ocupacao}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-muted">
                      <div className={`h-2 rounded-full ${tone.bar}`} style={{ width: `${m.ocupacao}%` }} />
                    </div>
                  </div>

                  <Link to="/reservar" className="block">
                    <Button className="w-full">Reservar</Button>
                  </Link>
                      </>
                    );
                  })()}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {atrativos.map((a) => {
              const pct = Math.min(100, Math.round((a.ocupacaoAtual / a.capacidadeMaxima) * 100));
              const tone = getOcupacaoStyle(pct);
              return (
                <article key={a.id} className="group rounded-xl overflow-hidden border border-border bg-card transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
                  <div className="h-44 bg-muted relative">
                    {a.imagemUrl ? (
                      <img src={a.imagemUrl} alt={a.nome} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10">
                        <Waves className="h-8 w-8 text-primary/70 transition-transform duration-300 group-hover:scale-110" />
                      </div>
                    )}
                  </div>
                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="font-heading font-semibold text-foreground line-clamp-1">{a.nome}</h3>
                      <p className="text-xs text-foreground/70 flex items-center gap-1 mt-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {a.municipio || 'Município'}
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-foreground/70">Ocupação atual</span>
                        <span className={`text-sm font-extrabold ${tone.text}`}>
                          {a.ocupacaoAtual}/{a.capacidadeMaxima} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-muted">
                        <div className={`h-2 rounded-full ${tone.bar}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>

                    <Link to="/reservar" className="block">
                      <Button className="w-full">Reservar</Button>
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <p className="text-center text-sm sm:text-base text-foreground/80 font-medium mb-3">
          Tecnologia aplicada à sustentabilidade e governança baseada em dados.
        </p>
        <h2 className="text-2xl sm:text-3xl font-heading font-extrabold tracking-tight text-center mb-12 text-foreground">
          Modernização da Gestão Pública
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7 sm:gap-8">
          {[
            { icon: MapPin, title: 'Atrativos Naturais', desc: 'Monitoramento em tempo real da capacidade e ocupação dos atrativos turísticos.' },
            { icon: CalendarCheck, title: 'Reservas Online', desc: 'Sistema de reservas sem necessidade de cadastro, com QR Code para validação.' },
            { icon: Shield, title: 'Controle Ambiental', desc: 'Indicadores de pressão turística e sustentabilidade territorial.' },
            { icon: BarChart3, title: 'Dados & Relatórios', desc: 'Dashboard executivo com analytics avançados para tomada de decisão.' },
          ].map((f, i) => (
            <div key={i} className="p-6 rounded-xl bg-card border border-border transition-all duration-200 hover:-translate-y-1 hover:shadow-xl">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <f.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-heading font-bold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-foreground/70">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Final */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 p-6 sm:p-10 text-center">
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">
            Pronto para organizar o turismo sustentável do seu município?
          </h2>
          <p className="mt-2 text-sm sm:text-base text-foreground/70">
            Implante uma plataforma oficial de controle ambiental e reservas inteligentes.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/login">
              <Button size="lg" className="min-w-52 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
                Solicitar Demonstração
              </Button>
            </Link>
            <Link to="/reservar">
              <Button size="lg" variant="outline" className="min-w-52 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
                Reservar Visita
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Seção de Confiança */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/6 via-emerald-50/60 to-background p-6 sm:p-8">
          <div className="text-center">
            <p className="text-sm sm:text-base text-foreground/70">
              Plataforma utilizada pela Prefeitura de <span className="font-semibold text-foreground">Rio Verde de Mato Grosso</span>
            </p>
          </div>

          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {['Prefeitura', 'Turismo', 'Meio Ambiente', 'Controladoria'].map((logo) => (
              <div key={logo} className="h-14 rounded-lg border border-dashed border-border bg-muted/40 flex items-center justify-center text-xs text-foreground/70 font-medium transition-all duration-200 hover:bg-muted/70 hover:-translate-y-0.5">
                {logo}
              </div>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-lg border border-border bg-background px-4 py-3">
              <p className="text-sm font-semibold text-foreground">Selo de Transparência</p>
              <p className="text-xs text-foreground/70 mt-1">
                Indicadores públicos de ocupação, reservas e capacidade ambiental com atualização contínua.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-background px-4 py-3">
              <p className="text-sm font-semibold text-foreground">Conformidade com LGPD</p>
              <p className="text-xs text-foreground/70 mt-1">
                Coleta mínima de dados, consentimento explícito e governança de dados pessoais.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/50 py-8 text-center space-y-2">
        <p className="text-sm text-foreground/70">
          © {new Date().getFullYear()} {configs.footer_texto}
        </p>
        {configs.footer_links.length > 0 && (
          <div className="flex justify-center gap-4">
            {configs.footer_links.map((link, i) => (
              <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                {link.label}
              </a>
            ))}
          </div>
        )}
      </footer>
    </div>
  );
}






