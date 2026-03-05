import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import SEOHead from '@/components/SEOHead';
import { apiClient } from '@/services/apiClient';
import { PUBLIC_ATRATIVOS, slugifyAtrativo, type PublicAtrativo } from '@/data/publicAtrativos';
import { CalendarCheck, Clock3, Gauge, MapPin, ShieldCheck, Users, X, ChevronLeft, ChevronRight, PlayCircle, Map } from 'lucide-react';

type DestinoStatus = 'disponivel' | 'quase-cheio' | 'lotado';

function formatTipo(tipo: string): string {
  const normalized = tipo.toLowerCase().trim();
  if (normalized === '1') return 'Balneário';
  if (normalized === '2') return 'Cachoeira';
  if (normalized === '3') return 'Trilha';
  if (normalized === '4') return 'Parque';
  if (normalized === '5') return 'Fazenda Ecoturismo';
  if (normalized === 'balneario') return 'Balneário';
  if (normalized === 'cachoeira') return 'Cachoeira';
  if (normalized === 'trilha') return 'Trilha';
  if (normalized === 'parque') return 'Parque';
  if (
    normalized === 'fazenda-ecoturismo' ||
    normalized === 'fazenda ecoturismo' ||
    normalized === 'fazendaecoturismo' ||
    normalized === 'fazenda'
  ) {
    return 'Fazenda Ecoturismo';
  }
  return tipo ? `${tipo.charAt(0).toUpperCase()}${tipo.slice(1)}` : 'Atrativo';
}

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function buildGoogleMapsExternalUrl(params: {
  nome?: string;
  endereco?: string;
  latitude?: number;
  longitude?: number;
}) {
  const nome = String(params.nome ?? '').trim();
  const endereco = String(params.endereco ?? '').trim();
  const latitude = params.latitude;
  const longitude = params.longitude;

  const query = [nome, endereco].filter(Boolean).join(', ').trim();
  if (query) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }

  if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${latitude},${longitude}`)}`;
  }

  return '';
}

function getStatus(ocupacaoAtual: number, capacidadeTotal: number): DestinoStatus {
  if (capacidadeTotal <= 0) return 'disponivel';
  const pct = Math.round((ocupacaoAtual / capacidadeTotal) * 100);
  if (pct >= 100) return 'lotado';
  if (pct >= 80) return 'quase-cheio';
  return 'disponivel';
}

function statusUi(status: DestinoStatus) {
  if (status === 'lotado') return { label: 'Lotado', className: 'bg-destructive text-destructive-foreground' };
  if (status === 'quase-cheio') return { label: 'Quase cheio', className: 'bg-warning text-warning-foreground' };
  return { label: 'Disponível', className: 'bg-success text-success-foreground' };
}

function contextualStatusMessage(status: DestinoStatus) {
  if (status === 'lotado') return 'Capacidade esgotada para o momento. Verifique novas datas disponiveis.';
  if (status === 'quase-cheio') return 'Alta procura para este fim de semana. Recomendamos reservar com antecedencia.';
  return 'Bom momento para visitacao com fluxo estavel de visitantes.';
}

type DestinoViewModel = {
  id?: string;
  slug: string;
  nome: string;
  municipio: string;
  categoria: string;
  bannerUrl: string;
  galeria: string[];
  videoUrl?: string;
  endereco?: string;
  latitude?: number;
  longitude?: number;
  descricao: PublicAtrativo['descricao'];
  tecnico: PublicAtrativo['tecnico'];
  ocupacaoAtual: number;
  capacidadeTotal: number;
  ocupacaoTexto: string;
  status: DestinoStatus;
};

function buildFromPublicAtrativo(spot: PublicAtrativo): DestinoViewModel {
  return {
    slug: spot.slug,
    nome: spot.nome,
    municipio: spot.municipio,
    categoria: spot.categoria,
    bannerUrl: spot.imagemUrl,
    galeria: [spot.imagemUrl, ...PUBLIC_ATRATIVOS.filter((x) => x.slug !== spot.slug).slice(0, 3).map((x) => x.imagemUrl)],
    videoUrl: spot.videoUrl,
    endereco: '',
    latitude: undefined,
    longitude: undefined,
    descricao: spot.descricao,
    tecnico: spot.tecnico,
    ocupacaoAtual: 0,
    capacidadeTotal: 0,
    ocupacaoTexto: spot.ocupacaoAtual,
    status: 'disponivel',
  };
}

export default function AtrativoDestino() {
  const { slug } = useParams<{ slug: string }>();
  const [loading, setLoading] = useState(true);
  const [destino, setDestino] = useState<DestinoViewModel | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const municipioId = (import.meta.env.VITE_MUNICIPIO_ID as string | undefined)?.trim();

  const goToPhoto = (index: number) => {
    if (!destino?.galeria?.length) return;
    const total = destino.galeria.length;
    const next = ((index % total) + total) % total;
    setActivePhotoIndex(next);
  };

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const data = await apiClient.listarAtrativosPublicos(municipioId || undefined);
        if (!active) return;

        const found = (data ?? [])
          .filter((a: any) => (a.status ?? a.Status ?? 'ativo').toString().toLowerCase() === 'ativo')
          .find((a: any) => slugifyAtrativo(String(a.nome ?? '')) === slug);

        if (found) {
          const atrativoId = String(found.id ?? '');
          const detalheAtrativo = atrativoId ? await apiClient.obterAtrativo(atrativoId).catch(() => null) : null;
          const nome = String(detalheAtrativo?.nome ?? found.nome ?? 'Atrativo');
          const tipo = String(detalheAtrativo?.tipo ?? found.tipo ?? found.Tipo ?? 'Atrativo');
          const capacidadeTotal = Math.max(
            0,
            toNumber(detalheAtrativo?.capacidadeMaxima ?? found.capacidadeMaxima ?? found.capacidade_maxima ?? found.CapacidadeMaxima)
          );
          const ocupacaoAtual = Math.max(
            0,
            toNumber(detalheAtrativo?.ocupacaoAtual ?? found.ocupacaoAtual ?? found.ocupacao_atual ?? found.OcupacaoAtual)
          );
          const status = getStatus(ocupacaoAtual, capacidadeTotal);
          const fallbackBySlug = PUBLIC_ATRATIVOS.find((x) => x.slug === slugifyAtrativo(nome)) ?? PUBLIC_ATRATIVOS[0];
          let municipioNome = String(found.municipioNome ?? found.municipio_nome ?? found.municipio ?? '');
          if (!municipioNome && detalheAtrativo?.municipioId) {
            try {
              const municipio = await apiClient.getMunicipio(String(detalheAtrativo.municipioId));
              municipioNome = `${municipio.nome}${municipio.uf ? ` - ${municipio.uf}` : ''}`;
            } catch {
              municipioNome = 'Rio Verde de Mato Grosso - MS';
            }
          }
          if (!municipioNome) municipioNome = 'Rio Verde de Mato Grosso - MS';

          const imagensDetalhe = (detalheAtrativo?.imagens ?? [])
            .slice()
            .sort((a, b) => {
              if (a.principal && !b.principal) return -1;
              if (!a.principal && b.principal) return 1;
              return a.ordem - b.ordem;
            })
            .map((img) => img.url)
            .filter(Boolean);

          const imagemPrincipal = imagensDetalhe[0]
            || String(detalheAtrativo?.imagem ?? found.imagemUrl ?? found.imagem_url ?? found.imagem ?? fallbackBySlug.imagemUrl);

          setDestino({
            id: atrativoId || String(detalheAtrativo?.id ?? ''),
            slug: slugifyAtrativo(nome),
            nome,
            municipio: municipioNome,
            categoria: formatTipo(tipo),
            bannerUrl: imagemPrincipal,
            galeria: imagensDetalhe.length > 0 ? imagensDetalhe : [imagemPrincipal],
            videoUrl: fallbackBySlug.videoUrl,
            endereco: detalheAtrativo?.endereco || '',
            latitude: detalheAtrativo?.latitude,
            longitude: detalheAtrativo?.longitude,
            descricao: {
              oQueE: String(detalheAtrativo?.descricao ?? found.descricao ?? found.Descricao ?? fallbackBySlug.descricao.oQueE),
              experiencia: fallbackBySlug.descricao.experiencia,
              historia: fallbackBySlug.descricao.historia,
              sustentabilidade: fallbackBySlug.descricao.sustentabilidade,
            },
            tecnico: {
              ...fallbackBySlug.tecnico,
              capacidadeTotal: capacidadeTotal > 0 ? `${capacidadeTotal} visitantes por período` : fallbackBySlug.tecnico.capacidadeTotal,
            },
            ocupacaoAtual,
            capacidadeTotal,
            ocupacaoTexto:
              capacidadeTotal > 0
                ? `${ocupacaoAtual}/${capacidadeTotal} (${Math.min(100, Math.round((ocupacaoAtual / capacidadeTotal) * 100))}%)`
                : 'Nao informado',
            status,
          });
          setLoading(false);
          return;
        }
      } catch {
        // fallback local below
      }

      if (!active) return;
      const local = PUBLIC_ATRATIVOS.find((x) => x.slug === slug);
      setDestino(local ? buildFromPublicAtrativo(local) : null);
      setLoading(false);
    };

    load();
    return () => {
      active = false;
    };
  }, [municipioId, slug]);

  useEffect(() => {
    setActivePhotoIndex(0);
    setLightboxOpen(false);
  }, [destino?.slug]);

  useEffect(() => {
    if (!lightboxOpen || !destino) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLightboxOpen(false);
      if (event.key === 'ArrowRight') goToPhoto(activePhotoIndex + 1);
      if (event.key === 'ArrowLeft') goToPhoto(activePhotoIndex - 1);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lightboxOpen, activePhotoIndex, destino]);

  const status = useMemo(() => statusUi(destino?.status ?? 'disponivel'), [destino?.status]);
  const googleMapsUrl = useMemo(
    () =>
      buildGoogleMapsExternalUrl({
        nome: destino?.nome,
        endereco: destino?.endereco,
        latitude: destino?.latitude,
        longitude: destino?.longitude,
      }),
    [destino?.nome, destino?.endereco, destino?.latitude, destino?.longitude]
  );
  const reservaHref = destino?.id ? `/reservar?atrativo=${encodeURIComponent(destino.id)}` : '/reservar';
  const ocupacaoPercent = useMemo(() => {
    if (!destino) return 0;
    if (destino.capacidadeTotal > 0) {
      return Math.min(100, Math.max(0, Math.round((destino.ocupacaoAtual / destino.capacidadeTotal) * 100)));
    }
    if (destino.status === 'lotado') return 100;
    if (destino.status === 'quase-cheio') return 86;
    return 48;
  }, [destino]);
  const vagasPercent = Math.max(0, 100 - ocupacaoPercent);
  const statusMensagem = contextualStatusMessage(destino?.status ?? 'disponivel');

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 py-10 space-y-6">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!destino) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-heading font-bold text-foreground">Atrativo não encontrado</h1>
          <p className="mt-2 text-foreground/70">Este destino não está disponível no momento.</p>
          <Link to="/" className="inline-block mt-6">
            <Button variant="outline">Voltar para início</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <SEOHead
        title={`${destino.nome} - Atrativo Turístico`}
        description={`${destino.nome} em ${destino.municipio}. Veja informações técnicas, status em tempo real e reserve sua visita.`}
      />

      <header className="relative overflow-hidden">
        <img src={destino.bannerUrl} alt={destino.nome} className="h-[46vh] min-h-[320px] w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/72" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/25" />
        <div className="absolute inset-0">
          <div className="max-w-6xl mx-auto px-4 h-full flex flex-col justify-end pb-10">
            <Badge className="w-fit bg-white/15 border border-white/30 text-white">{destino.categoria}</Badge>
            <h1 className="mt-3 text-3xl sm:text-5xl font-heading font-extrabold text-white drop-shadow-lg">{destino.nome}</h1>
            <p className="mt-2 text-white/95 font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)] flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {destino.municipio}
            </p>
            <p className="mt-3 max-w-2xl text-sm sm:text-base text-white/95 drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]">
              {destino.descricao.experiencia}
            </p>
            <p className="mt-2 text-sm sm:text-base italic text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]">
              Refugio natural ideal para familias e amantes da natureza.
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10 space-y-10">
        <section>
          <h2 className="text-2xl font-heading font-bold text-foreground mb-4">Galeria do atrativo</h2>
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              className="relative block w-full overflow-hidden rounded-xl border border-border bg-muted group"
            >
              <img
                src={destino.galeria[activePhotoIndex]}
                alt={`${destino.nome} - foto ${activePhotoIndex + 1}`}
                className="h-[22rem] w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute top-3 right-3 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white">
                {activePhotoIndex + 1}/{destino.galeria.length}
              </div>
            </button>

            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              {destino.galeria.map((img, idx) => (
                <button
                  key={`${img}-${idx}`}
                  type="button"
                  onClick={() => goToPhoto(idx)}
                  className={`relative overflow-hidden rounded-lg border transition-all ${
                    idx === activePhotoIndex
                      ? 'border-primary ring-2 ring-primary/25'
                      : 'border-border hover:border-primary/40'
                  }`}
                >
                  <img
                    src={img}
                    alt={`${destino.nome} miniatura ${idx + 1}`}
                    className="h-20 w-full object-cover transition-transform duration-300 hover:scale-105"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            <Card>
              <CardContent className="p-4 h-full min-h-[18rem] flex flex-col">
                <div className="mb-3 flex items-center gap-2 text-foreground/70">
                  <PlayCircle className="h-4 w-4 text-primary/80" />
                  <p className="text-xs font-medium tracking-wide uppercase">Vídeo</p>
                </div>
                {destino.videoUrl ? (
                  <div className="aspect-video overflow-hidden rounded-lg mt-auto">
                    <iframe
                      src={destino.videoUrl}
                      title={`Video ${destino.nome}`}
                      className="w-full h-full"
                      loading="lazy"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <div className="mt-auto rounded-lg border border-dashed border-border p-4">
                    <p className="text-sm text-muted-foreground">Vídeo não informado para este atrativo.</p>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 h-full min-h-[18rem] flex flex-col">
                <div className="mb-3 flex items-center gap-2 text-foreground/70">
                  <Map className="h-4 w-4 text-primary/80" />
                  <p className="text-xs font-medium tracking-wide uppercase">Mapa</p>
                </div>
                <div className="mt-auto rounded-lg border border-border p-4 space-y-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Nome</p>
                    <p className="text-sm text-foreground">{destino.nome}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Endereco</p>
                    <p className="text-sm text-foreground">{destino.endereco || 'Nao informado'}</p>
                  </div>
                  {googleMapsUrl ? (
                    <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="inline-block">
                      <Button size="sm" variant="outline">Abrir no Google Maps</Button>
                    </a>
                  ) : (
                    <p className="text-sm text-muted-foreground">Localizacao nao disponivel para abrir no mapa.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-heading font-bold text-foreground mb-4">Descrição detalhada</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card><CardContent className="p-5"><p className="font-semibold mb-2">O que é</p><p className="text-sm text-foreground/75">{destino.descricao.oQueE}</p></CardContent></Card>
            <Card><CardContent className="p-5"><p className="font-semibold mb-2">Experiência</p><p className="text-sm text-foreground/75">{destino.descricao.experiencia}</p></CardContent></Card>
            <Card><CardContent className="p-5"><p className="font-semibold mb-2">História</p><p className="text-sm text-foreground/75">{destino.descricao.historia}</p></CardContent></Card>
            <Card><CardContent className="p-5"><p className="font-semibold mb-2">Sustentabilidade</p><p className="text-sm text-foreground/75">{destino.descricao.sustentabilidade}</p></CardContent></Card>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-heading font-bold text-foreground mb-4">Informações técnicas</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-5 space-y-3">
                <p className="font-semibold">Dados gerais</p>
                <div className="rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-3">
                  <p className="text-[11px] uppercase tracking-wide text-foreground/60">Capacidade total</p>
                  <p className="mt-1 text-base font-bold text-foreground flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    {destino.tecnico.capacidadeTotal}
                  </p>
                </div>
                <div className="h-px bg-border/70" />
                <p className="text-sm text-foreground/75 flex items-center gap-2"><Clock3 className="h-4 w-4 text-primary/80" /> Horários: {destino.tecnico.horarios}</p>
                {destino.tecnico.dificuldade && (
                  <p className="text-sm text-foreground/75 flex items-center gap-2"><Gauge className="h-4 w-4 text-primary/80" /> Nível: {destino.tecnico.dificuldade}</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="font-semibold mb-2 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary/80" />
                  Regras
                </p>
                <div className="h-px bg-border/70 mb-3" />
                <ul className="space-y-1 text-sm text-foreground/75 list-disc pl-5">
                  {destino.tecnico.regras.map((rule) => <li key={rule}>{rule}</li>)}
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="font-semibold mb-2 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary/80" />
                  O que levar
                </p>
                <div className="h-px bg-border/70 mb-3" />
                <ul className="space-y-1 text-sm text-foreground/75 list-disc pl-5">
                  {destino.tecnico.oQueLevar.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-heading font-bold text-foreground mb-4">Status em tempo real</h2>
          <Card>
            <CardContent className="p-5">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="text-sm text-foreground/70">Situação de visitação</p>
                    <p className="mt-1 text-lg font-semibold text-foreground">{destino.ocupacaoTexto}</p>
                  </div>
                  <Badge className={status.className}>{status.label}</Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground/70">Ocupação</span>
                    <span className="font-semibold text-foreground">{ocupacaoPercent}%</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-muted">
                    <div
                      className={`h-2.5 rounded-full transition-all ${
                        destino.status === 'lotado'
                          ? 'bg-destructive'
                          : destino.status === 'quase-cheio'
                            ? 'bg-warning'
                            : 'bg-success'
                      }`}
                      style={{ width: `${ocupacaoPercent}%` }}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    Vagas disponíveis: {vagasPercent}%
                  </span>
                  <span className="text-sm text-foreground/75">{statusMensagem}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm">
          <button
            type="button"
            className="absolute top-4 right-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            onClick={() => setLightboxOpen(false)}
            aria-label="Fechar galeria"
          >
            <X className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            onClick={() => goToPhoto(activePhotoIndex - 1)}
            aria-label="Foto anterior"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            onClick={() => goToPhoto(activePhotoIndex + 1)}
            aria-label="Próxima foto"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          <div className="h-full w-full flex items-center justify-center px-6 py-12">
            <img
              src={destino.galeria[activePhotoIndex]}
              alt={`${destino.nome} - foto ${activePhotoIndex + 1}`}
              className="max-h-full max-w-full rounded-lg object-contain"
            />
          </div>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-white">
            {activePhotoIndex + 1}/{destino.galeria.length}
          </div>
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-foreground">{destino.nome}</p>
            <p className="text-sm font-medium text-foreground/80">Pronto para reservar sua visita?</p>
          </div>
          <Link to={reservaHref} className="ml-auto">
            <Button size="lg" className="font-semibold bg-success text-success-foreground hover:brightness-95">
              <CalendarCheck className="mr-2 h-5 w-5" />
              Reservar visita neste atrativo
            </Button>
          </Link>
          <a href={destino.mediaUrl} target="_blank" rel="noopener noreferrer" className="hidden sm:block">
            <Button size="lg" variant="outline" className="border-border/70 text-foreground/80 hover:text-foreground hover:bg-muted/60">
              <ShieldCheck className="mr-2 h-4 w-4" />
              Site oficial
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}



