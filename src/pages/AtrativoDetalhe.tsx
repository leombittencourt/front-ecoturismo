import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import PaginationControls from '@/components/PaginationControls';
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
import { apiClient } from '@/services/apiClient';
import { atrativoDetalheData } from '@/data/mock-data';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useClientPagination } from '@/hooks/useClientPagination';
import { serializarDescricaoDetalhada, type AtrativoDescricaoDetalhada } from '@/utils/atrativoDescricao';
import { ITEMS_PER_PAGE } from '@/constants/pagination';
import {
  ArrowLeft, Users, Droplets, Mountain, TreePine, Tent, MapPin,
  BarChart3, Clock, Star, Upload, Trash2, ImageIcon, CheckCircle2, Move, ChevronDown,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import Cropper from 'react-easy-crop';
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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

type CropPixels = { x: number; y: number; width: number; height: number };
type AtrativoImagem = NonNullable<Atrativo['imagens']>[number];

async function getCroppedImageBlob(imageSrc: string, pixelCrop: CropPixels): Promise<Blob> {
  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.src = imageSrc;

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error('Falha ao carregar imagem para recorte.'));
  });

  const canvas = document.createElement('canvas');
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Nao foi possivel criar o contexto de recorte.');

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Nao foi possivel gerar a imagem recortada.'));
        return;
      }
      resolve(blob);
    }, 'image/jpeg', 0.92);
  });
}

function SortableImageCard({
  id,
  canDrag = true,
  children,
}: {
  id: string;
  canDrag?: boolean;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? 'opacity-70' : ''}>
      <div className="mb-2 flex items-center justify-end">
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Arrastar para reordenar"
          disabled={!canDrag}
          {...(canDrag ? attributes : {})}
          {...(canDrag ? listeners : {})}
        >
          <Move className="h-3 w-3" />
          Arrastar
        </button>
      </div>
      {children}
    </div>
  );
}

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
  const [municipioLabel, setMunicipioLabel] = useState('');
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [editForm, setEditForm] = useState<{
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
  const detalhe: AtrativoDetalheData = atrativoDetalheData;

  const imagensOrdenadas = useMemo(
    () => [...(atrativo?.imagens ?? [])].sort((a, b) => a.ordem - b.ordem),
    [atrativo?.imagens]
  );
  const [imagensDnD, setImagensDnD] = useState<AtrativoImagem[]>([]);
  const [cropOpen, setCropOpen] = useState(false);
  const [cropTarget, setCropTarget] = useState<AtrativoImagem | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [cropPixels, setCropPixels] = useState<CropPixels | null>(null);
  const [cropping, setCropping] = useState(false);
  const [replaceOriginalOnCrop, setReplaceOriginalOnCrop] = useState(false);
  const {
    currentPage: galleryPage,
    paginatedItems: paginatedImages,
    setCurrentPage: setGalleryPage,
    totalItems: galleryTotalItems,
    totalPages: galleryTotalPages,
  } = useClientPagination(imagensDnD, ITEMS_PER_PAGE, imagensDnD.length);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
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
    setImagensDnD(imagensOrdenadas);
  }, [imagensOrdenadas]);

  useEffect(() => {
    if (!atrativo) return;
    setEditForm({
      nome: atrativo.nome,
      termoBusca: atrativo.nome,
      tipo: atrativo.tipo,
      status: atrativo.status,
      descricaoDetalhada: {
        oQueE: atrativo.descricaoDetalhada?.oQueE ?? atrativo.descricao ?? '',
        experiencia: atrativo.descricaoDetalhada?.experiencia ?? '',
        historia: atrativo.descricaoDetalhada?.historia ?? '',
        sustentabilidade: atrativo.descricaoDetalhada?.sustentabilidade ?? '',
      },
      capacidadeMaxima: atrativo.capacidadeMaxima,
      endereco: atrativo.endereco ?? '',
      latitude: atrativo.latitude ? String(atrativo.latitude) : '',
      longitude: atrativo.longitude ? String(atrativo.longitude) : '',
    });
  }, [atrativo]);

  useEffect(() => {
    let active = true;

    if (!atrativo?.municipioId) {
      setMunicipioLabel('');
      return;
    }

    apiClient.getMunicipio(String(atrativo.municipioId))
      .then((m) => {
        if (!active) return;
        const nome = String(m?.nome ?? '').trim();
        const uf = String(m?.uf ?? '').trim();
        setMunicipioLabel(nome ? `${nome}${uf ? ` - ${uf}` : ''}` : '');
      })
      .catch(() => {
        if (!active) return;
        setMunicipioLabel('');
      });

    return () => {
      active = false;
    };
  }, [atrativo?.municipioId]);

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
        <p className="text-muted-foreground">Atrativo nao encontrado.</p>
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
        title: 'Capacidade invalida',
        description: `A capacidade maxima deve ser maior ou igual a ocupacao atual (${capacidadeMinima}).`,
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
        descricao: serializarDescricaoDetalhada(editForm.descricaoDetalhada),
        capacidadeMaxima: capacidade,
        endereco: editForm.endereco.trim(),
        latitude: parseCoordinateInput(editForm.latitude),
        longitude: parseCoordinateInput(editForm.longitude),
        mapUrl: buildMapUrl({
          termoBusca: editForm.termoBusca,
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
        descricao: editForm.descricaoDetalhada.oQueE.trim(),
        descricaoDetalhada: { ...editForm.descricaoDetalhada },
        capacidadeMaxima: capacidade,
        endereco: editForm.endereco.trim(),
        latitude: parseCoordinateInput(editForm.latitude),
        longitude: parseCoordinateInput(editForm.longitude),
        mapUrl: buildMapUrl({
          termoBusca: editForm.termoBusca,
          nome: editForm.nome,
          endereco: editForm.endereco,
          latitude: parseCoordinateInput(editForm.latitude),
          longitude: parseCoordinateInput(editForm.longitude),
        }),
      } : prev);

      setIsEditing(false);
      toast({ title: 'Atrativo atualizado', description: 'As alteracoes foram salvas com sucesso.' });
    } catch {
      toast({ title: 'Erro', description: 'Nao foi possivel salvar as alteracoes.', variant: 'destructive' });
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

  const handleDragEndImagem = async (event: DragEndEvent) => {
    if (!id || reordering) return;

    const { active, over } = event;
    if (!over) return;
    if (String(active.id) === String(over.id)) return;

    const oldIndex = imagensDnD.findIndex((img) => img.id === String(active.id));
    const newIndex = imagensDnD.findIndex((img) => img.id === String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;

    const reordered = arrayMove(imagensDnD, oldIndex, newIndex).map((img, idx) => ({
      ...img,
      ordem: idx + 1,
    }));

    setImagensDnD(reordered);
    setReordering(true);
    try {
      await reordenarImagensAtrativo(
        id,
        reordered.map((img, idx) => ({ id: img.id, ordem: idx + 1 }))
      );
      await loadAtrativo();
    } catch (error) {
      setImagensDnD(imagensOrdenadas);
      toast({
        title: 'Erro ao reordenar',
        description: error instanceof Error ? error.message : 'Nao foi possivel atualizar a ordem das imagens.',
        variant: 'destructive',
      });
    } finally {
      setReordering(false);
    }
  };

  const handleAbrirCrop = (imagem: AtrativoImagem) => {
    setCropTarget(imagem);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCropPixels(null);
    setReplaceOriginalOnCrop(false);
    setCropOpen(true);
  };

  const handleSalvarCropComoPrincipal = async () => {
    if (!id || !cropTarget || !cropPixels) return;

    setCropping(true);
    try {
      const idsAntes = new Set((atrativo.imagens ?? []).map((img) => img.id));
      const blob = await getCroppedImageBlob(cropTarget.url, cropPixels);
      const file = new File([blob], `capa-${cropTarget.id}.jpg`, { type: 'image/jpeg' });

      const upload = await uploadImagensAtrativo(id, {
        imagens: [file],
        descricoes: [cropTarget.descricao ?? `Capa de ${atrativo.nome}`],
      });

      const root = (upload && typeof upload === 'object')
        ? (upload as Record<string, unknown>)
        : {};
      const dataCandidate = root.data ?? root.Data ?? root;
      const dataNode = (dataCandidate && typeof dataCandidate === 'object')
        ? (dataCandidate as Record<string, unknown>)
        : {};

      const imagensAdicionadasRaw =
        dataNode.imagensAdicionadas
        ?? dataNode.ImagensAdicionadas
        ?? [];
      const imagensAdicionadas = Array.isArray(imagensAdicionadasRaw)
        ? (imagensAdicionadasRaw as Array<{ id?: string; Id?: string }>)
        : [];

      let novaImagemId =
        imagensAdicionadas[0]?.id
        ?? imagensAdicionadas[0]?.Id;

      if (!novaImagemId) {
        const atualizado = await fetchAtrativo(id);
        const imagensAtualizadas = [...(atualizado?.imagens ?? [])].sort((a, b) => b.ordem - a.ordem);
        const novaImagem = imagensAtualizadas.find((img) => !idsAntes.has(img.id));
        novaImagemId = novaImagem?.id;
      }

      if (!novaImagemId) {
        throw new Error('Nao foi possivel identificar a imagem apos o upload.');
      }

      await definirImagemPrincipalAtrativo(id, novaImagemId);

      if (replaceOriginalOnCrop && cropTarget.id !== novaImagemId) {
        try {
          await removerImagemAtrativo(id, cropTarget.id);
        } catch {
          toast({
            title: 'Capa atualizada',
            description: 'A capa foi atualizada, mas nao foi possivel remover a imagem original.',
            variant: 'destructive',
          });
        }
      }

      await loadAtrativo();
      setCropOpen(false);
      setCropTarget(null);
      setCropPixels(null);

      toast({
        title: 'Capa atualizada',
        description: 'A imagem recortada foi definida como principal.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao ajustar capa',
        description: error instanceof Error ? error.message : 'Nao foi possivel ajustar a capa.',
        variant: 'destructive',
      });
    } finally {
      setCropping(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="sticky top-0 z-20 -mx-2 rounded-md border border-border/70 bg-background/95 px-2 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="shrink-0" onClick={() => navigate('/gestao/atrativos')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-base sm:text-lg font-heading font-bold truncate">{atrativo.nome}</h1>
          </div>
          <Badge className={`hidden sm:inline-flex ${
            atrativo.status === 'ativo' ? 'bg-success text-success-foreground' :
            atrativo.status === 'manutencao' ? 'bg-warning text-warning-foreground' :
            'bg-muted text-muted-foreground'
          }`}>
            {atrativo.status === 'ativo' ? 'Ativo' : atrativo.status === 'manutencao' ? 'Manutencao' : 'Inativo'}
          </Badge>
          {canEditAtrativo && !isEditing && (
            <Button variant="default" size="sm" onClick={() => setIsEditing(true)}>
              Editar atrativo
            </Button>
          )}
          {canEditAtrativo && isEditing && (
            <>
              <Button variant="outline" size="sm" onClick={() => setIsEditing(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving || !editForm.nome.trim() || !editForm.endereco.trim() || capacidadeInvalida}
              >
                {saving ? 'Salvando...' : 'Salvar alteracoes'}
              </Button>
            </>
          )}
        </div>
        <div className="mt-2 flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-heading font-bold truncate">{atrativo.nome}</h1>
            <p className="text-xs sm:text-sm text-muted-foreground capitalize line-clamp-1">
              {formatTipo(atrativo.tipo)}
              {municipioLabel ? ` • ${municipioLabel}` : ''}
            </p>
          </div>
        </div>
      </div>


      {!isEditing && atrativo.descricao && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-heading">Descricao</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-line">{atrativo.descricao}</p>
          </CardContent>
        </Card>
      )}

      {canEditAtrativo && isEditing && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-heading">Edicao do Atrativo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs defaultValue="dados" className="space-y-4">
              <TabsList className="grid h-auto w-full grid-cols-1 gap-1 bg-muted/70 p-1 sm:grid-cols-2 lg:grid-cols-4">
                <TabsTrigger value="dados" className="h-auto w-full whitespace-normal px-3 py-2 text-center data-[state=active]:bg-background data-[state=active]:shadow-sm">Dados</TabsTrigger>
                <TabsTrigger value="descricao" className="h-auto w-full whitespace-normal px-3 py-2 text-center data-[state=active]:bg-background data-[state=active]:shadow-sm">Descricao</TabsTrigger>
                <TabsTrigger value="localizacao" className="h-auto w-full whitespace-normal px-3 py-2 text-center data-[state=active]:bg-background data-[state=active]:shadow-sm">Localizacao</TabsTrigger>
                <TabsTrigger value="galeria" className="h-auto w-full whitespace-normal px-3 py-2 text-center data-[state=active]:bg-background data-[state=active]:shadow-sm">Galeria</TabsTrigger>
              </TabsList>

              <TabsContent value="dados" className="space-y-4">
                <div className="rounded-md border border-border p-3 sm:p-4">
                  <p className="mb-3 text-sm font-medium">Dados basicos</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="nome">Nome</Label>
                      <Input
                        id="nome"
                        value={editForm.nome}
                        onChange={(e) => setEditForm((p) => ({ ...p, nome: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="capacidade">Capacidade Maxima</Label>
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
                          Capacidade deve ser maior ou igual a ocupacao atual ({capacidadeMinima}).
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label>Tipo</Label>
                      <Select value={editForm.tipo} onValueChange={(v) => setEditForm((p) => ({ ...p, tipo: v as Atrativo['tipo'] }))}>
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
                      <Select value={editForm.status} onValueChange={(v) => setEditForm((p) => ({ ...p, status: v as Atrativo['status'] }))}>
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
                    <Label htmlFor="edit-oquee">O que e</Label>
                    <p className="text-xs text-muted-foreground">
                      Descreva o atrativo em ate 2 paragrafos.
                    </p>
                    <Textarea
                      id="edit-oquee"
                      rows={3}
                      value={editForm.descricaoDetalhada.oQueE}
                      onChange={(e) => setEditForm((p) => ({
                        ...p,
                        descricaoDetalhada: { ...p.descricaoDetalhada, oQueE: e.target.value },
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-experiencia">Experiencia</Label>
                    <p className="text-xs text-muted-foreground">
                      O que o visitante pode fazer no local.
                    </p>
                    <Textarea
                      id="edit-experiencia"
                      rows={3}
                      value={editForm.descricaoDetalhada.experiencia}
                      onChange={(e) => setEditForm((p) => ({
                        ...p,
                        descricaoDetalhada: { ...p.descricaoDetalhada, experiencia: e.target.value },
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-historia">Historia</Label>
                    <p className="text-xs text-muted-foreground">
                      Origem do atrativo.
                    </p>
                    <Textarea
                      id="edit-historia"
                      rows={3}
                      value={editForm.descricaoDetalhada.historia}
                      onChange={(e) => setEditForm((p) => ({
                        ...p,
                        descricaoDetalhada: { ...p.descricaoDetalhada, historia: e.target.value },
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-sustentabilidade">Sustentabilidade</Label>
                    <p className="text-xs text-muted-foreground">
                      Praticas ambientais do local.
                    </p>
                    <Textarea
                      id="edit-sustentabilidade"
                      rows={3}
                      value={editForm.descricaoDetalhada.sustentabilidade}
                      onChange={(e) => setEditForm((p) => ({
                        ...p,
                        descricaoDetalhada: { ...p.descricaoDetalhada, sustentabilidade: e.target.value },
                      }))}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="localizacao" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="endereco">Endereco</Label>
                  <Input
                    id="endereco"
                    value={editForm.endereco}
                    onChange={(e) => setEditForm((p) => ({ ...p, endereco: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="termo-busca">Termo de busca no Google Maps</Label>
                  <Input
                    id="termo-busca"
                    placeholder="Ex: Balneario 7 Quedas do Didi"
                    value={editForm.termoBusca}
                    onChange={(e) => setEditForm((p) => ({ ...p, termoBusca: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Este termo e usado na pesquisa ao abrir o Google Maps.
                  </p>
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
                </div>
              </TabsContent>

              <TabsContent value="galeria" className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Gerencie as imagens na secao de galeria logo abaixo.
                </p>
                <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('galeria-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                  Ir para galeria
                </Button>
              </TabsContent>
            </Tabs>

          </CardContent>
        </Card>
      )}

      <Collapsible open={galleryOpen} onOpenChange={setGalleryOpen}>
        <Card id="galeria-section">
          <CardHeader>
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 text-left"
                aria-expanded={galleryOpen}
              >
                <div>
                  <CardTitle className="text-lg font-heading">Galeria de Imagens</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {galleryOpen ? 'Ocultar galeria' : 'Expandir galeria'}
                  </p>
                </div>
                <ChevronDown className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${galleryOpen ? 'rotate-180' : ''}`} />
              </button>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              {canEditAtrativo && (
                <div className="space-y-3 rounded-lg border border-dashed border-border p-4">
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
                        <div key={file.name} className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_2fr]">
                          <p className="truncate text-xs text-muted-foreground">
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
                          <Upload className="mr-2 h-4 w-4" />
                          {uploading ? 'Enviando...' : 'Enviar imagens'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {imagensOrdenadas.length === 0 ? (
                <div className="space-y-2 rounded-lg border border-border p-10 text-center">
                  <ImageIcon className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Este atrativo ainda nao possui imagens.</p>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={canEditAtrativo ? handleDragEndImagem : undefined}
                >
                  <SortableContext items={paginatedImages.map((img) => img.id)} strategy={rectSortingStrategy}>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {paginatedImages.map((imagem, index) => (
                        <SortableImageCard key={imagem.id} id={imagem.id} canDrag={canEditAtrativo && !reordering}>
                          <div className="overflow-hidden rounded-lg border border-border bg-card">
                            <div className="aspect-video bg-muted">
                              <img
                                src={imagem.url}
                                alt={imagem.descricao || `Imagem ${(galleryPage - 1) * ITEMS_PER_PAGE + index + 1}`}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div className="space-y-2 p-3">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-xs text-muted-foreground">Ordem: {imagem.ordem}</p>
                                {imagem.principal && (
                                  <Badge className="bg-success text-success-foreground">
                                    <CheckCircle2 className="mr-1 h-3 w-3" />
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
                                    onClick={() => handleAbrirCrop(imagem)}
                                  >
                                    Ajustar capa
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    disabled={removingImageId === imagem.id}
                                    onClick={() => handleRemoverImagem(imagem.id)}
                                  >
                                    <Trash2 className="mr-1 h-4 w-4" />
                                    {removingImageId === imagem.id ? 'Removendo...' : 'Remover'}
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </SortableImageCard>
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}

              <PaginationControls
                currentPage={galleryPage}
                pageSize={ITEMS_PER_PAGE}
                totalItems={galleryTotalItems}
                totalPages={galleryTotalPages}
                onPageChange={setGalleryPage}
                itemLabel="imagens"
              />
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <Dialog
        open={cropOpen}
        onOpenChange={(open) => {
          if (cropping) return;
          setCropOpen(open);
          if (!open) {
            setCropTarget(null);
            setCropPixels(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ajustar capa principal</DialogTitle>
            <DialogDescription>
              Ajuste o enquadramento e salve para criar uma nova capa principal.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative h-[320px] w-full overflow-hidden rounded-md bg-muted">
              {cropTarget?.url && (
                <Cropper
                  image={cropTarget.url}
                  crop={crop}
                  zoom={zoom}
                  aspect={16 / 9}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={(_, pixels) => setCropPixels(pixels as CropPixels)}
                />
              )}
            </div>
            <div className="space-y-2">
              <Label>Zoom</Label>
              <Slider
                value={[zoom]}
                min={1}
                max={3}
                step={0.1}
                onValueChange={(value) => setZoom(value[0] ?? 1)}
              />
            </div>
            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <div className="space-y-1">
                <p className="text-sm font-medium">Substituir original</p>
                <p className="text-xs text-muted-foreground">
                  Remove a imagem original apos salvar a nova capa.
                </p>
              </div>
              <Switch
                checked={replaceOriginalOnCrop}
                onCheckedChange={setReplaceOriginalOnCrop}
                disabled={cropping}
                aria-label="Substituir imagem original"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCropOpen(false)}
              disabled={cropping}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSalvarCropComoPrincipal}
              disabled={cropping || !cropPixels}
            >
              {cropping ? 'Salvando...' : 'Salvar como capa principal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
            <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary/60 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-muted-foreground">Ocupacao Atual</p>
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
              <p className="text-[10px] sm:text-xs text-muted-foreground">Perm. Media</p>
              <p className="text-lg sm:text-xl font-heading font-bold">3.8h</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
            <Star className="h-5 w-5 sm:h-6 sm:w-6 text-warning/60 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-muted-foreground">Satisfacao</p>
              <p className="text-lg sm:text-xl font-heading font-bold">4.2/5</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Heatmap Calendar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-heading">Calendario de Ocupacao - Fevereiro</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'].map(d => (
              <span key={d} className="text-[10px] font-medium text-muted-foreground text-center">{d}</span>
            ))}
            {/* offset: Feb 2026 starts on Sunday -> 6 empty cells */}
            {[...Array(6)].map((_, i) => <div key={`e${i}`} />)}
            {detalhe.heatmapMensal.map(cell => (
              <Tooltip key={cell.dia}>
                <TooltipTrigger asChild>
                  <div className={`aspect-square rounded sm:rounded-md flex items-center justify-center text-[10px] sm:text-[11px] font-medium cursor-default transition-colors ${heatColor(cell.ocupacao)} ${cell.ocupacao >= 70 ? 'text-white' : 'text-foreground'}`}>
                    {cell.dia}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Dia {cell.dia}: {cell.ocupacao}% ocupacao</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-3 sm:mt-4 text-[10px] sm:text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-primary/25" /> {'<40%'}</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-primary/70" /> 40-69%</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-warning" /> 70-89%</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-destructive" /> {'>=90%'}</span>
          </div>
        </CardContent>
      </Card>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ocupacao Historica */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-heading">Ocupacao Historica (%)</CardTitle>
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
            <CardTitle className="text-lg font-heading">Fluxo por Horario (Hoje)</CardTitle>
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

        {/* Satisfacao */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-heading">Pesquisa de Satisfacao</CardTitle>
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





