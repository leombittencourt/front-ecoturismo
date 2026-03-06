import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { fetchAtrativosPage, criarAtrativo } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import PaginationControls from '@/components/PaginationControls';
import { type Atrativo } from '@/services/apiClient';
import { serializarDescricaoDetalhada, type AtrativoDescricaoDetalhada } from '@/utils/atrativoDescricao';
import { ITEMS_PER_PAGE } from '@/constants/pagination';
import { MapPin, Users, Droplets, Mountain, TreePine, Tent, Plus } from 'lucide-react';

const tipoIcons: Record<string, React.ElementType> = {
  balneario: Droplets,
  cachoeira: Mountain,
  trilha: TreePine,
  parque: Tent,
  'fazenda-ecoturismo': Tent,
};

function formatTipo(tipo: Atrativo['tipo']): string {
  if (tipo === 'balneario') return 'Balneario';
  if (tipo === 'cachoeira') return 'Cachoeira';
  if (tipo === 'trilha') return 'Trilha';
  if (tipo === 'parque') return 'Parque';
  return 'Fazenda Ecoturismo';
}

function OcupacaoBadge({ ocupacao, capacidade }: { ocupacao: number; capacidade: number }) {
  const pct = Math.round((ocupacao / capacidade) * 100);
  let className = 'bg-success text-success-foreground';
  if (pct >= 80) className = 'bg-destructive text-destructive-foreground';
  else if (pct >= 50) className = 'bg-warning text-warning-foreground';
  return <Badge className={className}>{pct}% ocupado</Badge>;
}

function StatusBadge({ status }: { status: Atrativo['status'] }) {
  const map: Record<string, string> = {
    ativo: 'bg-success text-success-foreground',
    inativo: 'bg-muted text-muted-foreground',
    manutencao: 'bg-warning text-warning-foreground',
  };
  const labels: Record<string, string> = { ativo: 'Ativo', inativo: 'Inativo', manutencao: 'Manutencao' };
  return <Badge className={map[status]}>{labels[status]}</Badge>;
}

function imagemPrincipal(atrativo: Atrativo): string {
  const principal = (atrativo.imagens ?? []).find((img) => img.principal)?.url;
  if (principal) return principal;

  const primeira = (atrativo.imagens ?? [])
    .slice()
    .sort((a, b) => a.ordem - b.ordem)[0]?.url;
  if (primeira) return primeira;

  return atrativo.imagem ?? '';
}

function buildMapUrl(params: {
  termoBusca?: string;
  nome?: string;
  endereco?: string;
  latitude?: number;
  longitude?: number;
}): string {
  const termoBusca = String(params.termoBusca ?? '').trim();
  const nome = String(params.nome ?? '').trim();
  const endereco = String(params.endereco ?? '').trim();
  const latitude = params.latitude;
  const longitude = params.longitude;

  const queryParts = [termoBusca || nome, endereco].filter(Boolean);
  if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
    queryParts.push(`${Number(latitude).toFixed(6)},${Number(longitude).toFixed(6)}`);
  }

  const query = queryParts.join(', ').trim();
  if (query) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }

  return '';
}

function parseCoordinateInput(value: string): number | undefined {
  const normalized = String(value ?? '').trim().replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export default function Atrativos() {
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const canCreateAtrativo = hasRole(['admin', 'prefeitura']);

  const [atrativos, setAtrativos] = useState<Atrativo[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [newForm, setNewForm] = useState<{
    nome: string;
    termoBusca: string;
    tipo: Atrativo['tipo'];
    status: Atrativo['status'];
    descricaoDetalhada: AtrativoDescricaoDetalhada;
    capacidadeMaxima: number;
    endereco: string;
    latitude: string;
    longitude: string;
  }>({
    nome: '',
    termoBusca: '',
    tipo: 'balneario',
    status: 'ativo',
    descricaoDetalhada: {
      oQueE: '',
      experiencia: '',
      historia: '',
      sustentabilidade: '',
    },
    capacidadeMaxima: 1,
    endereco: '',
    latitude: '',
    longitude: '',
  });
  useEffect(() => {
    if (!user?.municipioId) {
      setAtrativos([]);
      setTotalItems(0);
      setTotalPages(1);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchAtrativosPage({ MunicipioId: user.municipioId, page: currentPage, pageSize: ITEMS_PER_PAGE })
      .then((response) => {
        setAtrativos(response.items);
        setTotalItems(response.totalItems);
        setTotalPages(response.totalPages);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [currentPage, user?.municipioId]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleCreateAtrativo = async () => {
    if (!user?.municipioId) return;
    if (!newForm.endereco.trim()) {
      toast({
        title: 'Endereco obrigatorio',
        description: 'Informe o endereco do atrativo.',
        variant: 'destructive',
      });
      return;
    }

    setCreating(true);
    try {
      await criarAtrativo({
        nome: newForm.nome.trim(),
        tipo: newForm.tipo,
        municipioId: user.municipioId,
        status: newForm.status,
        descricao: serializarDescricaoDetalhada(newForm.descricaoDetalhada),
        capacidadeMaxima: Math.max(1, Number(newForm.capacidadeMaxima) || 1),
        ocupacaoAtual: 0,
        endereco: newForm.endereco.trim(),
        latitude: parseCoordinateInput(newForm.latitude),
        longitude: parseCoordinateInput(newForm.longitude),
        mapUrl: buildMapUrl({
          termoBusca: newForm.termoBusca,
          nome: newForm.nome,
          endereco: newForm.endereco,
          latitude: parseCoordinateInput(newForm.latitude),
          longitude: parseCoordinateInput(newForm.longitude),
        }),
      });

      setCreateOpen(false);
      setCurrentPage(1);
      setNewForm({
        nome: '',
        termoBusca: '',
        tipo: 'balneario',
        status: 'ativo',
        descricaoDetalhada: {
          oQueE: '',
          experiencia: '',
          historia: '',
          sustentabilidade: '',
        },
        capacidadeMaxima: 1,
        endereco: '',
        latitude: '',
        longitude: '',
      });

      toast({ title: 'Atrativo criado', description: 'Novo atrativo cadastrado com sucesso.' });
    } catch (error) {
      toast({
        title: 'Erro ao criar atrativo',
        description: error instanceof Error ? error.message : 'Nao foi possivel cadastrar o atrativo.',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: 'Geolocalizacao indisponivel', description: 'Seu navegador nao suporta geolocalizacao.', variant: 'destructive' });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        setNewForm((prev) => ({ ...prev, latitude: lat, longitude: lng }));
      },
      () => {
        toast({ title: 'Nao foi possivel obter localizacao', variant: 'destructive' });
      }
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-heading font-bold">Atrativos</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48 rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold">Atrativos Turisticos</h1>
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground">{totalItems} cadastrados</p>
          {canCreateAtrativo && (
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Novo atrativo
            </Button>
          )}
        </div>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Novo atrativo</DialogTitle>
            <DialogDescription>Preencha os dados para cadastrar um novo atrativo turistico.</DialogDescription>
          </DialogHeader>

          <div className="max-h-[68vh] overflow-y-auto pr-1">
            <Tabs defaultValue="dados" className="space-y-4">
              <TabsList className="grid h-auto w-full grid-cols-1 gap-1 bg-muted/70 p-1 sm:grid-cols-3">
                <TabsTrigger value="dados" className="h-auto w-full whitespace-normal px-3 py-2 text-center data-[state=active]:bg-background data-[state=active]:shadow-sm">Dados</TabsTrigger>
                <TabsTrigger value="descricao" className="h-auto w-full whitespace-normal px-3 py-2 text-center data-[state=active]:bg-background data-[state=active]:shadow-sm">Descricao</TabsTrigger>
                <TabsTrigger value="localizacao" className="h-auto w-full whitespace-normal px-3 py-2 text-center data-[state=active]:bg-background data-[state=active]:shadow-sm">Localizacao</TabsTrigger>
              </TabsList>

            <TabsContent value="dados" className="space-y-4">
              <div className="rounded-md border border-border p-3 sm:p-4">
                <p className="mb-3 text-sm font-medium">Dados basicos</p>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="novo-nome">Nome</Label>
                    <Input
                      id="novo-nome"
                      value={newForm.nome}
                      onChange={(e) => setNewForm((p) => ({ ...p, nome: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="novo-capacidade">Capacidade maxima</Label>
                    <Input
                      id="novo-capacidade"
                      type="number"
                      min={1}
                      value={newForm.capacidadeMaxima}
                      onChange={(e) => setNewForm((p) => ({ ...p, capacidadeMaxima: Math.max(1, Number(e.target.value) || 1) }))}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Tipo</Label>
                    <Select value={newForm.tipo} onValueChange={(v) => setNewForm((p) => ({ ...p, tipo: v as Atrativo['tipo'] }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="balneario">Balneario</SelectItem>
                        <SelectItem value="cachoeira">Cachoeira</SelectItem>
                        <SelectItem value="trilha">Trilha</SelectItem>
                        <SelectItem value="parque">Parque</SelectItem>
                        <SelectItem value="fazenda-ecoturismo">Fazenda Ecoturismo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Status</Label>
                    <Select value={newForm.status} onValueChange={(v) => setNewForm((p) => ({ ...p, status: v as Atrativo['status'] }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="inativo">Inativo</SelectItem>
                        <SelectItem value="manutencao">Manutencao</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </TabsContent>

              <TabsContent value="descricao" className="space-y-4">
                <div className="space-y-3 rounded-md border border-border p-3">
                  <p className="text-sm font-medium">Descricao detalhada</p>
                  <div className="space-y-2">
                    <Label htmlFor="novo-oquee">O que e</Label>
                    <p className="text-xs text-muted-foreground">
                      Descreva o atrativo em ate 2 paragrafos.
                    </p>
                    <Textarea
                      id="novo-oquee"
                      rows={3}
                      value={newForm.descricaoDetalhada.oQueE}
                      onChange={(e) => setNewForm((p) => ({
                        ...p,
                        descricaoDetalhada: { ...p.descricaoDetalhada, oQueE: e.target.value },
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="novo-experiencia">Experiencia</Label>
                    <p className="text-xs text-muted-foreground">
                      O que o visitante pode fazer no local.
                    </p>
                    <Textarea
                      id="novo-experiencia"
                      rows={3}
                      value={newForm.descricaoDetalhada.experiencia}
                      onChange={(e) => setNewForm((p) => ({
                        ...p,
                        descricaoDetalhada: { ...p.descricaoDetalhada, experiencia: e.target.value },
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="novo-historia">Historia</Label>
                    <p className="text-xs text-muted-foreground">
                      Origem do atrativo.
                    </p>
                    <Textarea
                      id="novo-historia"
                      rows={3}
                      value={newForm.descricaoDetalhada.historia}
                      onChange={(e) => setNewForm((p) => ({
                        ...p,
                        descricaoDetalhada: { ...p.descricaoDetalhada, historia: e.target.value },
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="novo-sustentabilidade">Sustentabilidade</Label>
                    <p className="text-xs text-muted-foreground">
                      Praticas ambientais do local.
                    </p>
                    <Textarea
                      id="novo-sustentabilidade"
                      rows={3}
                      value={newForm.descricaoDetalhada.sustentabilidade}
                      onChange={(e) => setNewForm((p) => ({
                        ...p,
                        descricaoDetalhada: { ...p.descricaoDetalhada, sustentabilidade: e.target.value },
                      }))}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="localizacao" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="novo-endereco">Endereco</Label>
                <Input
                  id="novo-endereco"
                  value={newForm.endereco}
                  onChange={(e) => setNewForm((p) => ({ ...p, endereco: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="novo-termo-busca">Termo de busca no Google Maps</Label>
                <Input
                  id="novo-termo-busca"
                  placeholder="Ex: Balneario 7 Quedas do Didi"
                  value={newForm.termoBusca}
                  onChange={(e) => setNewForm((p) => ({ ...p, termoBusca: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Este termo e usado na pesquisa ao abrir o Google Maps.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="novo-latitude">Latitude</Label>
                  <Input
                    id="novo-latitude"
                    placeholder="-17.745391"
                    value={newForm.latitude}
                    onChange={(e) => setNewForm((p) => ({ ...p, latitude: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="novo-longitude">Longitude</Label>
                  <Input
                    id="novo-longitude"
                    placeholder="-54.556194"
                    value={newForm.longitude}
                    onChange={(e) => setNewForm((p) => ({ ...p, longitude: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={handleUseCurrentLocation}>
                  Usar localizacao atual
                </Button>
              </div>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={creating}>
              Cancelar
            </Button>
            <Button onClick={handleCreateAtrativo} disabled={creating || !newForm.nome.trim() || !newForm.endereco.trim()}>
              {creating ? 'Criando...' : 'Cadastrar atrativo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {atrativos.map((a) => {
          const Icon = tipoIcons[a.tipo] || MapPin;
          const thumb = imagemPrincipal(a);
          return (
            <Card key={a.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/gestao/atrativos/${a.id}`)}>
              <div className="h-36 bg-muted">
                {thumb ? (
                  <img src={thumb} alt={a.nome} className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-primary/5">
                    <Icon className="h-8 w-8 text-primary/60" />
                  </div>
                )}
              </div>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-heading font-semibold text-sm">{a.nome}</h3>
                      <p className="text-xs text-muted-foreground capitalize">{formatTipo(a.tipo)}</p>
                    </div>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{a.descricao}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{a.ocupacaoAtual}/{a.capacidadeMaxima}</span>
                  </div>
                  {a.status === 'ativo' && (
                    <OcupacaoBadge ocupacao={a.ocupacaoAtual} capacidade={a.capacidadeMaxima} />
                  )}
                </div>
                {a.status === 'ativo' && (
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-primary transition-all"
                      style={{ width: `${Math.min(100, (a.ocupacaoAtual / a.capacidadeMaxima) * 100)}%` }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
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
  );
}
