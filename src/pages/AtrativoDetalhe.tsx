import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  fetchAtrativo,
  atualizarAtrativo,
  uploadImagensAtrativo,
  removerImagemAtrativo,
  definirImagemPrincipalAtrativo,
  reordenarImagensAtrativo,
  type Atrativo,
  type AtrativoDetalheData,
} from '@/services/api';
import { atrativoDetalheData } from '@/data/mock-data';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft, Users, Droplets, Mountain, TreePine, Tent, MapPin,
  BarChart3, Clock, Star, Upload, Trash2, ChevronUp, ChevronDown, ImageIcon, CheckCircle2,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';

const COLORS = [
  'hsl(120, 56%, 24%)',
  'hsl(204, 98%, 37%)',
  'hsl(45, 100%, 51%)',
  'hsl(0, 84%, 60%)',
];

const tipoIcons: Record<string, React.ElementType> = {
  balneario: Droplets, cachoeira: Mountain, trilha: TreePine, parque: Tent, 'fazenda-ecoturismo': Tent,
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_UPLOAD_FILES = 10;
const MAX_TOTAL_FILES = 20;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

function heatColor(pct: number) {
  if (pct >= 90) return 'bg-destructive';
  if (pct >= 70) return 'bg-warning';
  if (pct >= 40) return 'bg-primary/70';
  return 'bg-primary/25';
}

function formatTipo(tipo: Atrativo['tipo']): string {
  if (tipo === 'balneario') return 'Balneario';
  if (tipo === 'cachoeira') return 'Cachoeira';
  if (tipo === 'trilha') return 'Trilha';
  if (tipo === 'parque') return 'Parque';
  return 'Fazenda Ecoturismo';
}

function buildMapUrl(params: {
  nome?: string;
  endereco?: string;
  latitude?: number;
  longitude?: number;
}): string {
  const nome = String(params.nome ?? '').trim();
  const endereco = String(params.endereco ?? '').trim();
  const latitude = params.latitude;
  const longitude = params.longitude;

  const queryParts = [nome, endereco].filter(Boolean);
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

export default function AtrativoDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const { toast } = useToast();
  const canEditAtrativo = hasRole(['admin', 'prefeitura']);
  const [atrativo, setAtrativo] = useState<Atrativo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [descricoes, setDescricoes] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [removingImageId, setRemovingImageId] = useState<string | null>(null);
  const [settingPrincipalId, setSettingPrincipalId] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);
  const [editForm, setEditForm] = useState<{
    nome: string;
    tipo: Atrativo['tipo'];
    status: Atrativo['status'];
    descricao: string;
    capacidadeMaxima: number;
    endereco: string;
    latitude: string;
    longitude: string;
  }>({
    nome: '',
    tipo: 'balneario',
    status: 'ativo',
    descricao: '',
    capacidadeMaxima: 1,
    endereco: '',
    latitude: '',
    longitude: '',
  });
  const detalhe: AtrativoDetalheData = atrativoDetalheData;

  const imagensOrdenadas = useMemo(
    () => [...(atrativo?.imagens ?? [])].sort((a, b) => a.ordem - b.ordem),
    [atrativo?.imagens]
  );

  const loadAtrativo = useCallback(async (showErrorToast = false, resetOnError = false) => {
    if (!id) {
      setLoading(false);
      return;
    }
    try {
      const data = await fetchAtrativo(id);
      setAtrativo(data ?? null);
    } catch {
      if (showErrorToast) {
        toast({
          title: 'Erro',
          description: 'Nao foi possivel carregar os dados do atrativo.',
          variant: 'destructive',
        });
      }
      if (resetOnError) setAtrativo(null);
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    void loadAtrativo(true, true);
  }, [loadAtrativo]);

  useEffect(() => {
    setSelectedFiles([]);
    setDescricoes({});
  }, [id]);

  useEffect(() => {
    if (!atrativo) return;
    setEditForm({
      nome: atrativo.nome,
      tipo: atrativo.tipo,
      status: atrativo.status,
      descricao: atrativo.descricao,
      capacidadeMaxima: atrativo.capacidadeMaxima,
      endereco: atrativo.endereco ?? '',
      latitude: atrativo.latitude ? String(atrativo.latitude) : '',
      longitude: atrativo.longitude ? String(atrativo.longitude) : '',
    });
  }, [atrativo]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-72 rounded-lg" />)}
        </div>
      </div>
    );
  }

  if (!atrativo) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-muted-foreground">Atrativo não encontrado.</p>
        <Button variant="outline" onClick={() => navigate('/gestao/atrativos')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>
      </div>
    );
  }

  const Icon = tipoIcons[atrativo.tipo] || MapPin;
  const pctOcupacao = Math.round((atrativo.ocupacaoAtual / atrativo.capacidadeMaxima) * 100);
  const capacidadeMinima = Math.max(1, atrativo.ocupacaoAtual);
  const capacidadeInvalida = Number(editForm.capacidadeMaxima) < capacidadeMinima;

  const handleSave = async () => {
    if (!id) return;
    if (!canEditAtrativo) {
      toast({
        title: 'Sem permissao',
        description: 'Apenas admin ou prefeitura podem editar atrativos.',
        variant: 'destructive',
      });
      return;
    }
    if (capacidadeInvalida) {
      toast({
        title: 'Capacidade inválida',
        description: `A capacidade máxima deve ser maior ou igual à ocupação atual (${capacidadeMinima}).`,
        variant: 'destructive',
      });
      return;
    }
    if (!editForm.endereco.trim()) {
      toast({
        title: 'Endereco obrigatorio',
        description: 'Informe o endereco do atrativo.',
        variant: 'destructive',
      });
      return;
    }
    const capacidade = Math.max(1, Number(editForm.capacidadeMaxima) || 1);
    setSaving(true);
    try {
      await atualizarAtrativo(id, {
        nome: editForm.nome.trim(),
        tipo: editForm.tipo,
        status: editForm.status,
        descricao: editForm.descricao.trim(),
        capacidadeMaxima: capacidade,
        endereco: editForm.endereco.trim(),
        latitude: parseCoordinateInput(editForm.latitude),
        longitude: parseCoordinateInput(editForm.longitude),
        mapUrl: buildMapUrl({
          nome: editForm.nome,
          endereco: editForm.endereco,
          latitude: parseCoordinateInput(editForm.latitude),
          longitude: parseCoordinateInput(editForm.longitude),
        }),
      });

      setAtrativo((prev) => prev ? {
        ...prev,
        nome: editForm.nome.trim(),
        tipo: editForm.tipo,
        status: editForm.status,
        descricao: editForm.descricao.trim(),
        capacidadeMaxima: capacidade,
        endereco: editForm.endereco.trim(),
        latitude: parseCoordinateInput(editForm.latitude),
        longitude: parseCoordinateInput(editForm.longitude),
        mapUrl: buildMapUrl({
          nome: editForm.nome,
          endereco: editForm.endereco,
          latitude: parseCoordinateInput(editForm.latitude),
          longitude: parseCoordinateInput(editForm.longitude),
        }),
      } : prev);

      setIsEditing(false);
      toast({ title: 'Atrativo atualizado', description: 'As alterações foram salvas com sucesso.' });
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível salvar as alterações.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleFileSelection = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';

    if (files.length === 0) {
      setSelectedFiles([]);
      setDescricoes({});
      return;
    }

    if (files.length > MAX_UPLOAD_FILES) {
      toast({
        title: 'Limite por upload',
        description: `Selecione no maximo ${MAX_UPLOAD_FILES} imagens por envio.`,
        variant: 'destructive',
      });
      return;
    }

    const invalidType = files.find((file) => !ACCEPTED_TYPES.includes(file.type));
    if (invalidType) {
      toast({
        title: 'Formato invalido',
        description: 'Use arquivos JPG, PNG, GIF ou WEBP.',
        variant: 'destructive',
      });
      return;
    }

    const invalidSize = files.find((file) => file.size > MAX_FILE_SIZE);
    if (invalidSize) {
      toast({
        title: 'Arquivo grande demais',
        description: 'Cada imagem deve ter no maximo 5MB.',
        variant: 'destructive',
      });
      return;
    }

    if ((imagensOrdenadas.length + files.length) > MAX_TOTAL_FILES) {
      toast({
        title: 'Limite total excedido',
        description: `Este atrativo suporta no maximo ${MAX_TOTAL_FILES} imagens.`,
        variant: 'destructive',
      });
      return;
    }

    setSelectedFiles(files);
    setDescricoes(
      files.reduce<Record<string, string>>((acc, file) => {
        acc[file.name] = '';
        return acc;
      }, {})
    );
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: 'Geolocalizacao indisponivel', variant: 'destructive' });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setEditForm((prev) => ({
          ...prev,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
        }));
      },
      () => {
        toast({ title: 'Nao foi possivel obter localizacao', variant: 'destructive' });
      }
    );
  };

  const handleUploadImagens = async () => {
    if (!id || selectedFiles.length === 0) return;
    setUploading(true);
    try {
      await uploadImagensAtrativo(id, {
        imagens: selectedFiles,
        descricoes: selectedFiles.map((file) => descricoes[file.name] ?? ''),
      });
      setSelectedFiles([]);
      setDescricoes({});
      await loadAtrativo();
      toast({ title: 'Imagens enviadas', description: 'Upload concluido com sucesso.' });
    } catch (error) {
      toast({
        title: 'Erro no upload',
        description: error instanceof Error ? error.message : 'Nao foi possivel enviar as imagens.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDefinirPrincipal = async (imagemId: string) => {
    if (!id) return;
    setSettingPrincipalId(imagemId);
    try {
      await definirImagemPrincipalAtrativo(id, imagemId);
      await loadAtrativo();
      toast({ title: 'Imagem principal atualizada' });
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Nao foi possivel definir imagem principal.',
        variant: 'destructive',
      });
    } finally {
      setSettingPrincipalId(null);
    }
  };

  const handleRemoverImagem = async (imagemId: string) => {
    if (!id) return;
    if (!window.confirm('Deseja remover esta imagem?')) return;

    setRemovingImageId(imagemId);
    try {
      await removerImagemAtrativo(id, imagemId);
      await loadAtrativo();
      toast({ title: 'Imagem removida com sucesso' });
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Nao foi possivel remover a imagem.',
        variant: 'destructive',
      });
    } finally {
      setRemovingImageId(null);
    }
  };

  const handleMoverImagem = async (imagemId: string, direction: -1 | 1) => {
    if (!id || reordering) return;

    const index = imagensOrdenadas.findIndex((img) => img.id === imagemId);
    if (index < 0) return;
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= imagensOrdenadas.length) return;

    const reordered = [...imagensOrdenadas];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(nextIndex, 0, moved);

    setReordering(true);
    try {
      await reordenarImagensAtrativo(
        id,
        reordered.map((img, idx) => ({ id: img.id, ordem: idx + 1 }))
      );
      await loadAtrativo();
    } catch (error) {
      toast({
        title: 'Erro ao reordenar',
        description: error instanceof Error ? error.message : 'Nao foi possivel atualizar a ordem das imagens.',
        variant: 'destructive',
      });
    } finally {
      setReordering(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="shrink-0" onClick={() => navigate('/gestao/atrativos')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          {canEditAtrativo && (
            <Button
              variant={isEditing ? 'outline' : 'default'}
              size="sm"
              onClick={() => setIsEditing((v) => !v)}
            >
              {isEditing ? 'Cancelar edição' : 'Editar atrativo'}
            </Button>
          )}
          <Badge className={`ml-auto ${
            atrativo.status === 'ativo' ? 'bg-success text-success-foreground' :
            atrativo.status === 'manutencao' ? 'bg-warning text-warning-foreground' :
            'bg-muted text-muted-foreground'
          }`}>
            {atrativo.status === 'ativo' ? 'Ativo' : atrativo.status === 'manutencao' ? 'Manutenção' : 'Inativo'}
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-heading font-bold truncate">{atrativo.nome}</h1>
            <p className="text-xs sm:text-sm text-muted-foreground capitalize line-clamp-1">{formatTipo(atrativo.tipo)} · {atrativo.descricao}</p>
          </div>
        </div>
      </div>

      {canEditAtrativo && isEditing && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-heading">Edição do Atrativo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  value={editForm.nome}
                  onChange={(e) => setEditForm((p) => ({ ...p, nome: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacidade">Capacidade Máxima</Label>
                <Input
                  id="capacidade"
                  type="number"
                  min={capacidadeMinima}
                  value={editForm.capacidadeMaxima}
                  className={capacidadeInvalida ? 'border-destructive focus-visible:ring-destructive' : undefined}
                  onChange={(e) => setEditForm((p) => ({ ...p, capacidadeMaxima: Number(e.target.value) || 1 }))}
                />
                {capacidadeInvalida && (
                  <p className="text-xs text-destructive">
                    Capacidade deve ser maior ou igual Ã  ocupaÃ§Ã£o atual ({capacidadeMinima}).
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={editForm.tipo} onValueChange={(v) => setEditForm((p) => ({ ...p, tipo: v as Atrativo['tipo'] }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="balneario">Balneário</SelectItem>
                    <SelectItem value="cachoeira">Cachoeira</SelectItem>
                    <SelectItem value="trilha">Trilha</SelectItem>
                    <SelectItem value="parque">Parque</SelectItem>
                    <SelectItem value="fazenda-ecoturismo">Fazenda Ecoturismo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={editForm.status} onValueChange={(v) => setEditForm((p) => ({ ...p, status: v as Atrativo['status'] }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                    <SelectItem value="manutencao">Manutenção</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                rows={3}
                value={editForm.descricao}
                onChange={(e) => setEditForm((p) => ({ ...p, descricao: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endereco">Endereco</Label>
              <Input
                id="endereco"
                value={editForm.endereco}
                onChange={(e) => setEditForm((p) => ({ ...p, endereco: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  placeholder="-17.745391"
                  value={editForm.latitude}
                  onChange={(e) => setEditForm((p) => ({ ...p, latitude: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  placeholder="-54.556194"
                  value={editForm.longitude}
                  onChange={(e) => setEditForm((p) => ({ ...p, longitude: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={handleUseCurrentLocation}>
                Usar localizacao atual
              </Button>
              {buildMapUrl({
                nome: editForm.nome,
                endereco: editForm.endereco,
                latitude: parseCoordinateInput(editForm.latitude),
                longitude: parseCoordinateInput(editForm.longitude),
              }) && (
                <a
                  href={buildMapUrl({
                    nome: editForm.nome,
                    endereco: editForm.endereco,
                    latitude: parseCoordinateInput(editForm.latitude),
                    longitude: parseCoordinateInput(editForm.longitude),
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary underline"
                >
                  Visualizar no mapa
                </a>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditing(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving || !editForm.nome.trim() || !editForm.endereco.trim() || capacidadeInvalida}>
                {saving ? 'Salvando...' : 'Salvar alterações'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-heading">Galeria de Imagens</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {canEditAtrativo && (
            <div className="rounded-lg border border-dashed border-border p-4 space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium">Upload de imagens</p>
                  <p className="text-xs text-muted-foreground">
                    Limites: ate 10 por envio, 5MB por arquivo e maximo de 20 por atrativo.
                  </p>
                </div>
                <Input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleFileSelection}
                  disabled={uploading}
                  className="max-w-sm"
                />
              </div>

              {selectedFiles.length > 0 && (
                <div className="space-y-3">
                  {selectedFiles.map((file) => (
                    <div key={file.name} className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-2">
                      <p className="text-xs text-muted-foreground truncate">
                        {file.name} ({Math.round(file.size / 1024)}KB)
                      </p>
                      <Input
                        placeholder="Descricao opcional"
                        value={descricoes[file.name] ?? ''}
                        onChange={(event) =>
                          setDescricoes((prev) => ({
                            ...prev,
                            [file.name]: event.target.value,
                          }))
                        }
                      />
                    </div>
                  ))}
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedFiles([]);
                        setDescricoes({});
                      }}
                      disabled={uploading}
                    >
                      Limpar
                    </Button>
                    <Button onClick={handleUploadImagens} disabled={uploading}>
                      <Upload className="h-4 w-4 mr-2" />
                      {uploading ? 'Enviando...' : 'Enviar imagens'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {imagensOrdenadas.length === 0 ? (
            <div className="rounded-lg border border-border p-10 text-center space-y-2">
              <ImageIcon className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">Este atrativo ainda nao possui imagens.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {imagensOrdenadas.map((imagem, index) => (
                <div key={imagem.id} className="rounded-lg border border-border overflow-hidden bg-card">
                  <div className="aspect-video bg-muted">
                    <img src={imagem.url} alt={imagem.descricao || `Imagem ${index + 1}`} className="h-full w-full object-cover" />
                  </div>
                  <div className="p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-muted-foreground">Ordem: {imagem.ordem}</p>
                      {imagem.principal && (
                        <Badge className="bg-success text-success-foreground">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Principal
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm line-clamp-2">{imagem.descricao || 'Sem descricao'}</p>

                    {canEditAtrativo && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {!imagem.principal && (
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={settingPrincipalId === imagem.id}
                            onClick={() => handleDefinirPrincipal(imagem.id)}
                          >
                            {settingPrincipalId === imagem.id ? 'Atualizando...' : 'Definir principal'}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={index === 0 || reordering}
                          onClick={() => handleMoverImagem(imagem.id, -1)}
                        >
                          <ChevronUp className="h-4 w-4 mr-1" />
                          Subir
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={index === imagensOrdenadas.length - 1 || reordering}
                          onClick={() => handleMoverImagem(imagem.id, 1)}
                        >
                          <ChevronDown className="h-4 w-4 mr-1" />
                          Descer
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={removingImageId === imagem.id}
                          onClick={() => handleRemoverImagem(imagem.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          {removingImageId === imagem.id ? 'Removendo...' : 'Remover'}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
            <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary/60 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-muted-foreground">Ocupação Atual</p>
              <p className="text-lg sm:text-xl font-heading font-bold">{pctOcupacao}%</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
            <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-accent/60 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-muted-foreground">Capacidade</p>
              <p className="text-lg sm:text-xl font-heading font-bold">{atrativo.ocupacaoAtual}/{atrativo.capacidadeMaxima}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
            <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-secondary/60 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-muted-foreground">Perm. Média</p>
              <p className="text-lg sm:text-xl font-heading font-bold">3.8h</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
            <Star className="h-5 w-5 sm:h-6 sm:w-6 text-warning/60 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-muted-foreground">Satisfação</p>
              <p className="text-lg sm:text-xl font-heading font-bold">4.2/5</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Heatmap Calendar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-heading">Calendário de Ocupação — Fevereiro</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(d => (
              <span key={d} className="text-[10px] font-medium text-muted-foreground text-center">{d}</span>
            ))}
            {/* offset: Feb 2026 starts on Sunday → 6 empty cells */}
            {[...Array(6)].map((_, i) => <div key={`e${i}`} />)}
            {detalhe.heatmapMensal.map(cell => (
              <Tooltip key={cell.dia}>
                <TooltipTrigger asChild>
                  <div className={`aspect-square rounded sm:rounded-md flex items-center justify-center text-[10px] sm:text-[11px] font-medium cursor-default transition-colors ${heatColor(cell.ocupacao)} ${cell.ocupacao >= 70 ? 'text-white' : 'text-foreground'}`}>
                    {cell.dia}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Dia {cell.dia}: {cell.ocupacao}% ocupação</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-3 sm:mt-4 text-[10px] sm:text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-primary/25" /> {'<40%'}</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-primary/70" /> 40-69%</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-warning" /> 70-89%</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-destructive" /> ≥90%</span>
          </div>
        </CardContent>
      </Card>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ocupação Histórica */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-heading">Ocupação Histórica (%)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={detalhe.ocupacaoHistorica}>
                <defs>
                  <linearGradient id="gradOcup" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS[0]} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS[0]} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(120,10%,85%)" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <RechartsTooltip />
                <Area type="monotone" dataKey="ocupacao" stroke={COLORS[0]} strokeWidth={2} fill="url(#gradOcup)" dot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Visitantes por Hora */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-heading">Fluxo por Horário (Hoje)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={detalhe.visitantesPorHora}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(120,10%,85%)" />
                <XAxis dataKey="hora" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <RechartsTooltip />
                <Bar dataKey="visitantes" fill={COLORS[1]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Satisfação */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-heading">Pesquisa de Satisfação</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={detalhe.satisfacao}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  dataKey="quantidade"
                  nameKey="nota"
                  label={({ nota, percent }) => `${nota} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {detalhe.satisfacao.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}



