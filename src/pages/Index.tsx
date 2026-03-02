import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Trees,
  Waves,
  MapPin,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Compass,
  CalendarDays,
  Sparkles,
  Building2,
  Landmark,
  ShieldCheck,
  BadgeCheck,
} from 'lucide-react';
import { useConfiguracoes } from '@/hooks/useConfiguracoes';
import SEOHead from '@/components/SEOHead';
import { apiClient, type BannerDto } from '@/services/apiClient';
import { PUBLIC_ATRATIVOS, slugifyAtrativo } from '@/data/publicAtrativos';

interface AtrativoCard {
  id: string;
  nome: string;
  municipio: string;
  tipo: string;
  imagemUrl: string;
  ocupacaoAtual: number;
  capacidadeMaxima: number;
}

interface HeroBanner {
  id: string;
  imagemUrl: string;
  titulo: string | null;
  subtitulo: string | null;
}

function toNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatTipo(tipo: string): string {
  const normalized = tipo.toLowerCase().trim();
  if (normalized === 'balneario') return 'Balneário';
  if (normalized === 'cachoeira') return 'Cachoeira';
  if (normalized === 'trilha') return 'Trilha';
  if (normalized === 'parque') return 'Parque';
  return tipo ? `${tipo.charAt(0).toUpperCase()}${tipo.slice(1)}` : 'Atrativo';
}

function getOcupacaoBadge(pct: number) {
  if (pct >= 100) return { label: 'Lotado', className: 'bg-destructive text-destructive-foreground' };
  if (pct >= 80) return { label: 'Quase cheio', className: 'bg-warning text-warning-foreground' };
  return { label: 'Disponível', className: 'bg-success text-success-foreground' };
}

export default function Index() {
  const { configs } = useConfiguracoes();
  const [atrativos, setAtrativos] = useState<AtrativoCard[]>([]);
  const [heroBanners, setHeroBanners] = useState<HeroBanner[]>([]);
  const [heroIndex, setHeroIndex] = useState(0);
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
            tipo: String(a.tipo ?? a.Tipo ?? 'atrativo'),
            imagemUrl: String(a.imagemUrl ?? a.imagem_url ?? a.imagem ?? ''),
            ocupacaoAtual: toNumber(a.ocupacaoAtual ?? a.ocupacao_atual ?? a.OcupacaoAtual),
            capacidadeMaxima: Math.max(0, toNumber(a.capacidadeMaxima ?? a.capacidade_maxima ?? a.CapacidadeMaxima)),
          }))
          .filter((a) => Boolean(a.id))
          .slice(0, 3);

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

  useEffect(() => {
    let active = true;

    apiClient
      .listarBanners(true)
      .then((data) => {
        if (!active) return;

        const mapped = (data ?? [])
          .map((b: BannerDto) => ({
            id: String(b.id ?? ''),
            imagemUrl: String(b.imagem_url ?? b.imagemUrl ?? ''),
            titulo: b.titulo ?? null,
            subtitulo: b.subtitulo ?? null,
            ordem: Number(b.ordem ?? 0),
          }))
          .filter((b) => Boolean(b.id) && Boolean(b.imagemUrl))
          .sort((a, b) => a.ordem - b.ordem)
          .map(({ ordem: _ordem, ...banner }) => banner);

        setHeroBanners(mapped);
      })
      .catch(() => {
        if (!active) return;
        setHeroBanners([]);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setHeroIndex(0);
  }, [heroBanners.length]);

  useEffect(() => {
    if (heroBanners.length <= 1) return;

    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroBanners.length);
    }, 5500);

    return () => clearInterval(interval);
  }, [heroBanners.length]);

  const currentBanner = heroBanners[heroIndex] ?? null;
  const heroImagemUrl =
    currentBanner?.imagemUrl ||
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1920&q=80';
  const heroTitulo = currentBanner?.titulo?.trim() || 'Explore as belezas naturais de Rio Verde - MS';
  const heroSubtitulo =
    currentBanner?.subtitulo?.trim() ||
    'Viva experiencias unicas em meio a natureza e cultura local.';

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="EcoTurismo - Gestão Inteligente do Ecoturismo Municipal"
        description="Reserve visitas a balneários, cachoeiras e trilhas. Acompanhe ocupação em tempo real e garanta sustentabilidade ambiental."
      />
      {/* Hero */}
      <header className="relative overflow-hidden text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-secondary to-accent/80" />
        <>
          <img
            src={heroImagemUrl}
            alt={heroTitulo}
            className="absolute inset-0 h-full w-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-black/60" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.16),transparent_35%)]" />
        </>
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
        <div className="relative z-10 max-w-6xl mx-auto px-4 pt-8 pb-12 sm:pt-14 sm:pb-20 lg:pt-20 lg:pb-28">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-black/20 px-3 py-1 text-xs font-semibold tracking-wide text-white/90 backdrop-blur-sm">
              <MapPin className="h-3.5 w-3.5" />
              Portal oficial de ecoturismo
            </span>
            <h1 className="mt-4 text-3xl sm:text-5xl lg:text-6xl font-heading font-extrabold tracking-tight leading-tight drop-shadow-[0_2px_14px_rgba(0,0,0,0.45)]">
              {heroTitulo}
            </h1>
            <p className="mt-4 text-base sm:text-xl text-white/95 max-w-2xl drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]">
              {heroSubtitulo}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link to="/atrativos">
                <Button
                  size="lg"
                  className="bg-white text-primary hover:bg-white/90 font-heading font-semibold px-8 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                >
                  Explorar Atrativos
                </Button>
              </Link>
              <Link to="/reservar">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/55 bg-transparent text-white/95 font-medium hover:bg-black/20 hover:text-white transition-all duration-200 hover:-translate-y-0.5"
                >
                  <CalendarCheck className="mr-2 h-5 w-5" />
                  Reservar Visita
                </Button>
              </Link>
            </div>
          </div>

          {heroBanners.length > 1 && (
            <div className="mt-8 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setHeroIndex((prev) => (prev - 1 + heroBanners.length) % heroBanners.length)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/35 bg-black/25 text-white/90 transition-colors hover:bg-black/40"
                aria-label="Banner anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-2">
                {heroBanners.map((banner, idx) => (
                  <button
                    key={banner.id}
                    type="button"
                    onClick={() => setHeroIndex(idx)}
                    className={`h-2.5 rounded-full transition-all ${
                      idx === heroIndex ? 'w-8 bg-white' : 'w-2.5 bg-white/50 hover:bg-white/70'
                    }`}
                    aria-label={`Ir para banner ${idx + 1}`}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => setHeroIndex((prev) => (prev + 1) % heroBanners.length)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/35 bg-black/25 text-white/90 transition-colors hover:bg-black/40"
                aria-label="Proximo banner"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Sobre o Ecoturismo */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="rounded-2xl border border-border bg-gradient-to-br from-emerald-50/60 via-background to-cyan-50/40 px-6 py-8 sm:px-8 sm:py-10">
          <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6 lg:gap-8 items-center">
            <div className="max-w-2xl">
              <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">
                Sobre o Ecoturismo no Município
              </h2>
              <p className="mt-3 text-sm sm:text-base text-foreground/75">
                Rio Verde de Mato Grosso fortalece o turismo de natureza com experiências seguras, acolhimento local e
                valorização do patrimônio ambiental. O município promove visitas responsáveis, conectando lazer, cultura
                regional e conservação dos recursos naturais.
              </p>
              <p className="mt-3 text-sm sm:text-base text-foreground/75">
                A sustentabilidade é um eixo central da gestão turística, com foco em uso consciente dos atrativos,
                preservação de fauna e flora e incentivo ao desenvolvimento econômico local de forma equilibrada.
              </p>
            </div>
            <div className="rounded-xl border border-primary/15 bg-background/90 p-6 sm:p-7 flex flex-col items-center justify-center text-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
              <p className="mt-4 text-sm font-semibold text-foreground">Portal institucional de ecoturismo</p>
              <p className="mt-1 text-xs text-foreground/65">Gestão pública, sustentabilidade e visitação responsável.</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: 'Pontos turísticos em destaque', value: '6' },
              { label: 'Modalidades de experiência', value: '8+' },
              { label: 'Foco estratégico', value: 'Sustentabilidade' },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-border bg-background px-4 py-4">
                <p className="text-2xl font-heading font-extrabold text-foreground">{item.value}</p>
                <p className="text-xs text-foreground/70 mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Página do Destino */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">
              Descubra seu próximo destino
            </h2>
            <p className="text-sm sm:text-base text-foreground/70 mt-1">
              Conheça os atrativos locais com imagem, localização e destaques da experiência.
            </p>
          </div>
          <Link to="/atrativos" className="hidden sm:block">
            <Button variant="outline">Ver todos os destinos</Button>
          </Link>
        </div>

        {atrativos.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {PUBLIC_ATRATIVOS.slice(0, 3).map((spot, idx) => (
              <article
                key={idx}
                className="group rounded-xl overflow-hidden border border-border bg-card/90 opacity-90 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="h-44 relative overflow-hidden bg-muted">
                  <img
                    src={spot.imagemUrl}
                    alt={spot.nome}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <span className="absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded-full bg-background/90 text-foreground/70 border border-border">
                    Oficial
                  </span>
                </div>
                <div className="p-4 space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-heading font-bold text-lg text-foreground leading-tight line-clamp-2">{spot.nome}</h3>
                    <div className="flex flex-wrap gap-2">
                      {spot.tipo?.trim() && (
                        <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-foreground/80">
                          {spot.tipo}
                        </span>
                      )}
                      <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                        Ocupação: {spot.ocupacaoAtual}
                      </span>
                    </div>
                  </div>

                  <Link to={`/atrativos/${spot.slug}`} className="block">
                    <Button variant="outline" className="w-full font-medium">Conhecer atrativo</Button>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {atrativos.map((a) => (
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
                <div className="p-4 space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-heading font-bold text-lg text-foreground leading-tight line-clamp-2">{a.nome}</h3>
                    <div className="flex flex-wrap gap-2">
                      {formatTipo(a.tipo)?.trim() && (
                        <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-foreground/80">
                          {formatTipo(a.tipo)}
                        </span>
                      )}
                      {a.capacidadeMaxima > 0 ? (
                        (() => {
                          const pct = Math.min(100, Math.round((a.ocupacaoAtual / a.capacidadeMaxima) * 100));
                          const badge = getOcupacaoBadge(pct);
                          return (
                            <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${badge.className}`}>
                              Ocupação: {a.ocupacaoAtual}/{a.capacidadeMaxima} ({pct}%)
                            </span>
                          );
                        })()
                      ) : (
                        <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-foreground/75">
                          Ocupação: Não informada
                        </span>
                      )}
                    </div>
                  </div>

                  <Link to={`/atrativos/${slugifyAtrativo(a.nome)}`} className="block">
                    <Button variant="outline" className="w-full font-medium">Conhecer atrativo</Button>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Como funciona a visita */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">
            Como funciona a visita
          </h2>
          <p className="mt-2 text-sm sm:text-base text-foreground/70">
            Um processo simples para organizar sua experiência de ecoturismo no município.
          </p>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                step: '1',
                title: 'Escolha o atrativo',
                desc: 'Veja os principais destinos, conheça o tipo de experiência e confira a ocupação atual.',
                icon: Compass,
              },
              {
                step: '2',
                title: 'Planeje sua ida',
                desc: 'Defina a melhor data para visita e prepare-se para aproveitar o passeio com mais tranquilidade.',
                icon: CalendarDays,
              },
              {
                step: '3',
                title: 'Viva a experiência',
                desc: 'Aproveite o contato com a natureza e siga as orientações locais para uma visita responsável.',
                icon: Sparkles,
              },
            ].map((item) => (
              <article
                key={item.step}
                className="rounded-xl border border-border bg-background p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(15,23,42,0.08)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-primary/12 px-2 text-sm font-extrabold text-primary">
                    {item.step}
                  </span>
                  <item.icon className="h-8 w-8 text-primary/75" />
                </div>
                <h3 className="mt-4 font-heading font-semibold text-foreground">{item.title}</h3>
                <p className="mt-1 text-sm text-foreground/70">{item.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Confianca institucional */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-emerald-50 via-background to-cyan-50/60 p-6 sm:p-8">
          <div className="absolute -top-24 -right-16 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-14 h-52 w-52 rounded-full bg-emerald-400/10 blur-3xl" />
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">
            Confianca institucional
          </h2>
          <p className="mt-2 text-sm sm:text-base text-foreground/70">
            Plataforma oficial com governanca publica, seguranca de dados e compromisso com a transparencia.
          </p>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <BadgeCheck className="h-3.5 w-3.5" />
            Portal Oficial
          </div>

          <div className="relative mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Prefeitura', icon: Building2 },
              { label: 'Secretaria', icon: Landmark },
              { label: 'LGPD', icon: ShieldCheck },
              { label: 'Transparencia', icon: BadgeCheck },
            ].map((item) => (
              <div
                key={item.label}
                className="h-20 rounded-xl border border-border/70 bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center gap-1 text-sm font-semibold text-foreground transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_18px_rgba(15,23,42,0.08)]"
              >
                <item.icon className="h-4.5 w-4.5 text-primary/80" />
                <span>{item.label}</span>
              </div>
            ))}
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






