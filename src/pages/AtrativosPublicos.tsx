import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import SEOHead from '@/components/SEOHead';
import PublicPageHeader from '@/components/PublicPageHeader';
import PaginationControls from '@/components/PaginationControls';
import { useClientPagination } from '@/hooks/useClientPagination';
import { ITEMS_PER_PAGE } from '@/constants/pagination';
import { apiClient } from '@/services/apiClient';
import { MapPin, Waves, ArrowRight } from 'lucide-react';

interface AtrativoPublicoCard {
  nome: string;
  tipo: string;
  municipio: string;
  imagemUrl: string;
  slug: string;
  disponibilidade: 'disponivel' | 'quase-cheio' | 'lotado' | 'indisponivel' | 'nao-informado';
  experiencias: string[];
  ocupacaoPercent: number;
  resumo: string;
}

function formatTipo(tipo: string): string {
  const normalized = tipo.toLowerCase().trim();
  if (normalized === '1' || normalized === 'balneario') return 'Balneario';
  if (normalized === '2' || normalized === 'cachoeira') return 'Cachoeira';
  if (normalized === '3' || normalized === 'trilha') return 'Trilha';
  if (normalized === '4' || normalized === 'parque') return 'Parque';
  if (normalized === '5' || normalized === 'fazendaecoturismo' || normalized === 'fazenda-ecoturismo') return 'Fazenda Ecoturismo';
  return tipo ? `${tipo.charAt(0).toUpperCase()}${tipo.slice(1)}` : 'Atrativo';
}

function inferExperiencias(textoBase: string): string[] {
  const texto = textoBase.toLowerCase();
  const experiencias: string[] = [];

  if (texto.includes('famil') || texto.includes('balne') || texto.includes('day-use')) experiencias.push('Familia');
  if (texto.includes('trilha') || texto.includes('aventura') || texto.includes('rapel')) experiencias.push('Trilha');
  if (
    texto.includes('hosped') ||
    texto.includes('pousada') ||
    texto.includes('chale') ||
    texto.includes('chale') ||
    texto.includes('camping')
  ) {
    experiencias.push('Hospedagem');
  }

  return experiencias.length > 0 ? Array.from(new Set(experiencias)) : ['Familia'];
}

function mapDisponibilidade(
  status: unknown,
  ocupacaoAtual: unknown,
  capacidadeMaxima: unknown
): AtrativoPublicoCard['disponibilidade'] {
  const rawStatus = String(status ?? '').toLowerCase();
  if (rawStatus.includes('manut') || rawStatus.includes('inativ')) return 'indisponivel';

  const capacidade = Number(capacidadeMaxima);
  const ocupacao = Number(ocupacaoAtual);
  if (Number.isFinite(capacidade) && capacidade > 0 && Number.isFinite(ocupacao) && ocupacao >= 0) {
    const pct = Math.round((ocupacao / capacidade) * 100);
    if (pct >= 100) return 'lotado';
    if (pct >= 80) return 'quase-cheio';
    return 'disponivel';
  }

  return 'nao-informado';
}

function disponibilidadeLabel(value: AtrativoPublicoCard['disponibilidade']) {
  if (value === 'lotado') return 'Lotado';
  if (value === 'quase-cheio') return 'Quase cheio';
  if (value === 'disponivel') return 'Disponivel';
  if (value === 'indisponivel') return 'Indisponivel';
  return 'Nao informado';
}

function disponibilidadeTone(value: AtrativoPublicoCard['disponibilidade']) {
  if (value === 'lotado') return 'bg-destructive text-destructive-foreground';
  if (value === 'quase-cheio') return 'bg-warning text-warning-foreground';
  if (value === 'disponivel') return 'bg-success text-success-foreground';
  if (value === 'indisponivel') return 'bg-muted text-muted-foreground';
  return 'bg-muted text-muted-foreground';
}

function estimateOcupacaoPercent(
  disponibilidade: AtrativoPublicoCard['disponibilidade'],
  ocupacaoAtual?: unknown,
  capacidadeMaxima?: unknown
) {
  const capacidade = Number(capacidadeMaxima);
  const ocupacao = Number(ocupacaoAtual);
  if (Number.isFinite(capacidade) && capacidade > 0 && Number.isFinite(ocupacao) && ocupacao >= 0) {
    return Math.min(100, Math.max(0, Math.round((ocupacao / capacidade) * 100)));
  }
  if (disponibilidade === 'lotado') return 100;
  if (disponibilidade === 'quase-cheio') return 86;
  if (disponibilidade === 'disponivel') return 54;
  return 48;
}

function inferResumo(nome: string, tipo: string, experiencias: string[]) {
  const ex = experiencias.slice(0, 2).join(' e ').toLowerCase();
  return `${tipo} com experiencia de ${ex} em ${nome}.`;
}

function slugifyAtrativo(value: string) {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseImagens(raw: any): Array<{ url: string; ordem: number; principal: boolean }> {
  const candidates = [
    raw?.imagens,
    raw?.Imagens,
    raw?.imagensAtrativo,
    raw?.ImagensAtrativo,
    raw?.atrativoImagens,
    raw?.AtrativoImagens,
    raw?.fotos,
    raw?.Fotos,
  ];

  const firstArray = candidates.find((item) => Array.isArray(item));
  if (!Array.isArray(firstArray)) return [];

  return firstArray
    .map((img: any) => ({
      url: String(img?.url ?? img?.Url ?? img?.imagem ?? img?.Imagem ?? img?.imagemUrl ?? img?.ImagemUrl ?? ''),
      ordem: toNumber(img?.ordem ?? img?.Ordem),
      principal: Boolean(img?.principal ?? img?.Principal),
    }))
    .filter((img) => Boolean(img.url));
}

function getImagemPrincipal(raw: any): string {
  const imagens = parseImagens(raw);
  const principal = imagens.find((img) => img.principal)?.url;
  if (principal) return principal;

  const porOrdem = imagens.slice().sort((a, b) => a.ordem - b.ordem)[0]?.url;
  if (porOrdem) return porOrdem;

  return String(raw?.imagemUrl ?? raw?.imagem_url ?? raw?.imagem ?? raw?.Imagem ?? '');
}

export default function AtrativosPublicos() {
  const [atrativos, setAtrativos] = useState<AtrativoPublicoCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tipoFiltro, setTipoFiltro] = useState<'todos' | 'Balneario' | 'Fazenda' | 'Aventura'>('todos');
  const [disponibilidadeFiltro, setDisponibilidadeFiltro] = useState<'todos' | 'disponivel' | 'quase-cheio' | 'lotado'>('todos');
  const [experienciaFiltro, setExperienciaFiltro] = useState<'todas' | 'Familia' | 'Trilha' | 'Hospedagem'>('todas');
  const municipioId = (import.meta.env.VITE_MUNICIPIO_ID as string | undefined)?.trim();

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        setLoadError(null);

        const response = await apiClient.listarAtrativosPublicos({ municipioId: municipioId || undefined, page: 1, pageSize: 500 });
        if (!active) return;
        const data = response.items;

        const missingMunicipioIds = Array.from(
          new Set(
            (data ?? [])
              .filter((a: any) => !(a.municipioNome ?? a.municipio_nome ?? a.municipio))
              .map((a: any) => String(a.municipioId ?? a.municipio_id ?? a.MunicipioId ?? ''))
              .filter(Boolean)
          )
        );

        const municipiosMap = new Map<string, string>();
        if (missingMunicipioIds.length > 0) {
          const municipioPairs = await Promise.all(
            missingMunicipioIds.map(async (id) => {
              try {
                const m = await apiClient.getMunicipio(id);
                return [id, `${m.nome}${m.uf ? ` - ${m.uf}` : ''}`] as const;
              } catch {
                return [id, 'Municipio'] as const;
              }
            })
          );
          municipioPairs.forEach(([id, nome]) => municipiosMap.set(id, nome));
        }

        const mapped: AtrativoPublicoCard[] = (data ?? [])
          .filter((a: any) => (a.status ?? a.Status ?? 'ativo').toString().toLowerCase() === 'ativo')
          .map((a: any) => {
            const nome = String(a.nome ?? 'Atrativo');
            const tipo = formatTipo(String(a.tipo ?? a.Tipo ?? 'atrativo'));
            const experiencias = inferExperiencias(`${a.nome ?? ''} ${a.tipo ?? ''} ${a.descricao ?? ''} ${a.nome_categoria ?? ''}`);
            const disponibilidade = mapDisponibilidade(
              a.status ?? a.Status ?? 'ativo',
              a.ocupacaoAtual ?? a.ocupacao_atual ?? a.OcupacaoAtual,
              a.capacidadeMaxima ?? a.capacidade_maxima ?? a.CapacidadeMaxima
            );
            return {
              nome,
              tipo,
              municipio: String(
                a.municipioNome ??
                a.municipio_nome ??
                a.municipio ??
                municipiosMap.get(String(a.municipioId ?? a.municipio_id ?? a.MunicipioId ?? '')) ??
                'Municipio'
              ),
              imagemUrl: getImagemPrincipal(a),
              slug: slugifyAtrativo(nome),
              disponibilidade,
              experiencias,
              ocupacaoPercent: estimateOcupacaoPercent(
                disponibilidade,
                a.ocupacaoAtual ?? a.ocupacao_atual ?? a.OcupacaoAtual,
                a.capacidadeMaxima ?? a.capacidade_maxima ?? a.CapacidadeMaxima
              ),
              resumo: inferResumo(nome, tipo, experiencias),
            };
          })
          .filter((a) => Boolean(a.nome));

        setAtrativos(mapped);
      } catch {
        if (!active) return;
        setAtrativos([]);
        setLoadError('Nao foi possivel carregar os atrativos no momento.');
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [municipioId]);

  const listaFiltrada = useMemo(() => {
    return atrativos.filter((item) => {
      const tipoOk = tipoFiltro === 'todos' ? true : item.tipo.toLowerCase().includes(tipoFiltro.toLowerCase());
      const disponibilidadeOk = disponibilidadeFiltro === 'todos' ? true : item.disponibilidade === disponibilidadeFiltro;
      const experienciaOk = experienciaFiltro === 'todas' ? true : item.experiencias.some((x) => x === experienciaFiltro);
      return tipoOk && disponibilidadeOk && experienciaOk;
    });
  }, [atrativos, tipoFiltro, disponibilidadeFiltro, experienciaFiltro]);
  const {
    currentPage,
    paginatedItems: paginatedAtrativos,
    setCurrentPage,
    totalItems,
    totalPages,
  } = useClientPagination(
    listaFiltrada,
    ITEMS_PER_PAGE,
    `${atrativos.length}-${tipoFiltro}-${disponibilidadeFiltro}-${experienciaFiltro}`
  );

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Atrativos Turisticos - Rio Verde de Mato Grosso"
        description="Explore os atrativos turisticos e acesse os detalhes de cada destino para planejar sua visita."
      />
      <PublicPageHeader
        title="Atrativos turisticos"
        subtitle="Escolha um destino para ver informacoes completas e reservar sua visita."
      />

      <section className="max-w-6xl mx-auto px-4 py-12">

        <div className="mb-6 rounded-xl border border-border bg-card p-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div>
              <p className="text-xs font-semibold text-foreground/70 mb-2">Tipo</p>
              <div className="flex flex-wrap gap-2">
                {(['todos', 'Balneario', 'Fazenda', 'Aventura'] as const).map((tipo) => (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => setTipoFiltro(tipo)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
                      tipoFiltro === tipo
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-foreground/75 border-border hover:border-primary/40'
                    }`}
                  >
                    {tipo === 'todos' ? 'Todos' : tipo}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-foreground/70 mb-2">Disponibilidade</p>
              <div className="flex flex-wrap gap-2">
                {([
                  { key: 'todos', label: 'Todas' },
                  { key: 'disponivel', label: 'Disponivel' },
                  { key: 'quase-cheio', label: 'Quase cheio' },
                  { key: 'lotado', label: 'Lotado' },
                ] as const).map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setDisponibilidadeFiltro(item.key)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
                      disponibilidadeFiltro === item.key
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-foreground/75 border-border hover:border-primary/40'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-foreground/70 mb-2">Experiencia</p>
              <div className="flex flex-wrap gap-2">
                {(['todas', 'Familia', 'Trilha', 'Hospedagem'] as const).map((exp) => (
                  <button
                    key={exp}
                    type="button"
                    onClick={() => setExperienciaFiltro(exp)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
                      experienciaFiltro === exp
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-foreground/75 border-border hover:border-primary/40'
                    }`}
                  >
                    {exp === 'todas' ? 'Todas' : exp}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <p className="mt-3 text-xs text-foreground/60">Exibindo {listaFiltrada.length} de {atrativos.length} atrativos</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-72 rounded-xl border border-border bg-muted/30 animate-pulse" />
            ))}
          </div>
        ) : loadError ? (
          <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-6 text-center text-destructive">
            {loadError}
          </div>
        ) : listaFiltrada.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center text-foreground/70">
            Nenhum atrativo encontrado para os filtros selecionados.
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {paginatedAtrativos.map((item) => (
                <Link key={`${item.slug}-${item.nome}`} to={`/atrativos/${item.slug}`} className="block">
                  <Card className="overflow-hidden group transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
                    <div className="h-44 bg-muted relative">
                      {item.imagemUrl ? (
                        <img src={item.imagemUrl} alt={item.nome} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10">
                          <Waves className="h-8 w-8 text-primary/70" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4 space-y-3">
                      <h2 className="font-heading font-bold text-foreground text-lg leading-tight line-clamp-2">{item.nome}</h2>
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="secondary">{item.tipo}</Badge>
                        {item.disponibilidade !== 'nao-informado' && (
                          <Badge className={disponibilidadeTone(item.disponibilidade)}>
                            {disponibilidadeLabel(item.disponibilidade)}
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-foreground/65">Ocupacao</span>
                          <span className="font-semibold text-foreground">{item.ocupacaoPercent}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted">
                          <div
                            className={`h-2 rounded-full ${
                              item.disponibilidade === 'lotado'
                                ? 'bg-destructive'
                                : item.disponibilidade === 'quase-cheio'
                                  ? 'bg-warning'
                                  : 'bg-success'
                            }`}
                            style={{ width: `${item.ocupacaoPercent}%` }}
                          />
                        </div>
                      </div>
                      <p className="text-sm text-foreground/70 line-clamp-1">{item.resumo}</p>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-foreground/70 flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {item.municipio}
                        </p>
                        <p className="text-[11px] text-foreground/70">{item.experiencias.slice(0, 2).join(' • ')}</p>
                      </div>
                      <div className="flex items-center justify-end pt-1">
                        <span className="inline-flex items-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm">
                          Explorar destino
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            <PaginationControls
              currentPage={currentPage}
              pageSize={ITEMS_PER_PAGE}
              totalItems={totalItems}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemLabel="atrativos"
            />
          </div>
        )}
      </section>
    </div>
  );
}

