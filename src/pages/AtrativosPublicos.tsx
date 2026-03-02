import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import SEOHead from '@/components/SEOHead';
import { apiClient } from '@/services/apiClient';
import { PUBLIC_ATRATIVOS, slugifyAtrativo } from '@/data/publicAtrativos';
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
  if (normalized === 'balneario') return 'Balneário';
  if (normalized === 'cachoeira') return 'Cachoeira';
  if (normalized === 'trilha') return 'Trilha';
  if (normalized === 'parque') return 'Parque';
  return tipo ? `${tipo.charAt(0).toUpperCase()}${tipo.slice(1)}` : 'Atrativo';
}

function inferExperiencias(textoBase: string): string[] {
  const texto = textoBase.toLowerCase();
  const experiencias: string[] = [];

  if (texto.includes('famil') || texto.includes('balne') || texto.includes('day-use')) experiencias.push('Família');
  if (texto.includes('trilha') || texto.includes('aventura') || texto.includes('rapel')) experiencias.push('Trilha');
  if (
    texto.includes('hosped') ||
    texto.includes('pousada') ||
    texto.includes('chale') ||
    texto.includes('chalé') ||
    texto.includes('camping')
  ) {
    experiencias.push('Hospedagem');
  }

  return experiencias.length > 0 ? Array.from(new Set(experiencias)) : ['Família'];
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
  if (value === 'disponivel') return 'Disponível';
  if (value === 'indisponivel') return 'Indisponível';
  return 'Não informado';
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
  return `${tipo} com experiência de ${ex} em ${nome}.`;
}

export default function AtrativosPublicos() {
  const [atrativos, setAtrativos] = useState<AtrativoPublicoCard[]>([]);
  const [tipoFiltro, setTipoFiltro] = useState<'todos' | 'Balneário' | 'Fazenda' | 'Aventura'>('todos');
  const [disponibilidadeFiltro, setDisponibilidadeFiltro] = useState<'todos' | 'disponivel' | 'quase-cheio' | 'lotado'>('todos');
  const [experienciaFiltro, setExperienciaFiltro] = useState<'todas' | 'Família' | 'Trilha' | 'Hospedagem'>('todas');
  const municipioId = (import.meta.env.VITE_MUNICIPIO_ID as string | undefined)?.trim();

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const data = await apiClient.listarAtrativosPublicos(municipioId || undefined);
        if (!active) return;

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
              municipio: String(a.municipioNome ?? a.municipio_nome ?? a.municipio ?? 'Rio Verde de Mato Grosso - MS'),
              imagemUrl: String(a.imagemUrl ?? a.imagem_url ?? a.imagem ?? ''),
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
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [municipioId]);

  const fallback: AtrativoPublicoCard[] = PUBLIC_ATRATIVOS.map((item) => {
    const experiencias = inferExperiencias(`${item.nome} ${item.categoria} ${item.descricao.oQueE} ${item.descricao.experiencia}`);
    const disponibilidade: AtrativoPublicoCard['disponibilidade'] = 'nao-informado';
    return {
      nome: item.nome,
      tipo: item.categoria,
      municipio: item.municipio,
      imagemUrl: item.imagemUrl,
      slug: item.slug,
      disponibilidade,
      experiencias,
      ocupacaoPercent: estimateOcupacaoPercent(disponibilidade),
      resumo: inferResumo(item.nome, item.categoria, experiencias),
    };
  });

  const lista = atrativos.length > 0 ? atrativos : fallback;

  const listaFiltrada = useMemo(() => {
    return lista.filter((item) => {
      const tipoOk = tipoFiltro === 'todos' ? true : item.tipo.toLowerCase().includes(tipoFiltro.toLowerCase());
      const disponibilidadeOk = disponibilidadeFiltro === 'todos' ? true : item.disponibilidade === disponibilidadeFiltro;
      const experienciaOk = experienciaFiltro === 'todas' ? true : item.experiencias.some((x) => x === experienciaFiltro);
      return tipoOk && disponibilidadeOk && experienciaOk;
    });
  }, [lista, tipoFiltro, disponibilidadeFiltro, experienciaFiltro]);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Atrativos Turísticos - Rio Verde de Mato Grosso"
        description="Explore os atrativos turísticos e acesse os detalhes de cada destino para planejar sua visita."
      />

      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-heading font-extrabold text-foreground">Atrativos turísticos</h1>
            <p className="text-sm sm:text-base text-foreground/70 mt-1">
              Escolha um destino para ver informações completas e reservar sua visita.
            </p>
          </div>
        </div>

        <div className="mb-6 rounded-xl border border-border bg-card p-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div>
              <p className="text-xs font-semibold text-foreground/70 mb-2">Tipo</p>
              <div className="flex flex-wrap gap-2">
                {(['todos', 'Balneário', 'Fazenda', 'Aventura'] as const).map((tipo) => (
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
                  { key: 'disponivel', label: 'Disponível' },
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
              <p className="text-xs font-semibold text-foreground/70 mb-2">Experiência</p>
              <div className="flex flex-wrap gap-2">
                {(['todas', 'Família', 'Trilha', 'Hospedagem'] as const).map((exp) => (
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

          <p className="mt-3 text-xs text-foreground/60">Exibindo {listaFiltrada.length} de {lista.length} atrativos</p>
        </div>

        {listaFiltrada.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center text-foreground/70">
            Nenhum atrativo encontrado para os filtros selecionados.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {listaFiltrada.map((item) => (
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
                      <span className="text-foreground/65">Ocupação</span>
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
        )}
      </section>
    </div>
  );
}
