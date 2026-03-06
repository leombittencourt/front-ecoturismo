import { useState, useEffect, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Image, Upload, Plus, Trash2, Pencil, Check, X, Settings, Type, Link2, Info, Eye, Palette, RotateCcw } from 'lucide-react';
import { apiClient, type BannerDto } from '@/services/apiClient';
import { useConfiguracoes } from '@/hooks/useConfiguracoes';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function hslToHex(hslStr: string): string {
  const parts = hslStr.match(/[\d.]+/g);
  if (!parts || parts.length < 3) return '#000000';
  const h = parseFloat(parts[0]) / 360;
  const s = parseFloat(parts[1]) / 100;
  const l = parseFloat(parts[2]) / 100;
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  let r, g, b;
  if (s === 0) { r = g = b = l; } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  const toHex = (x: number) => Math.round(x * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

interface Banner {
  id: string;
  titulo: string | null;
  subtitulo: string | null;
  imagem_url: string;
  thumbnail_url: string;
  link: string | null;
  ordem: number;
  ativo: boolean;
}

function inferImageMimeFromBase64(raw: string): string {
  const sample = raw.slice(0, 16);
  if (sample.startsWith('/9j/')) return 'image/jpeg';
  if (sample.startsWith('iVBOR')) return 'image/png';
  if (sample.startsWith('R0lGOD')) return 'image/gif';
  if (sample.startsWith('UklGR')) return 'image/webp';
  return 'image/jpeg';
}

function normalizeImageValue(value: unknown): string {
  const raw = String(value ?? '').trim().replace(/^"+|"+$/g, '');
  if (!raw) return '';
  if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('data:') || raw.startsWith('blob:')) {
    return raw;
  }
  if (raw.startsWith('www.')) return `https://${raw}`;

  if (raw.startsWith('/')) return raw;
  if (raw.startsWith('api/')) return `/${raw}`;
  if (raw.startsWith('uploads/')) return `/${raw}`;
  if (raw.startsWith('banners/')) return `/${raw}`;
  if (raw.startsWith('images/')) return `/${raw}`;

  const compact = raw.replace(/\s+/g, '');
  const maybeBase64 =
    compact.length > 80 &&
    !compact.includes('/') &&
    /^[A-Za-z0-9+/=]+$/.test(compact);
  if (maybeBase64) {
    const mime = inferImageMimeFromBase64(compact);
    return `data:${mime};base64,${compact}`;
  }

  return raw;
}

function resolveBannerImageNode(dto: Partial<BannerDto> & Record<string, unknown>): Record<string, unknown> {
  const node =
    (dto.imagem as Record<string, unknown> | undefined) ??
    (dto.Imagem as Record<string, unknown> | undefined) ??
    {};
  return node;
}

function resolveBannerImage(dto: Partial<BannerDto> & Record<string, unknown>, fallbackUploadUrl?: string): string {
  const imageNode = resolveBannerImageNode(dto);
  const nestedImage =
    imageNode.imagemUrl ??
    imageNode.ImagemUrl ??
    imageNode.imageUrl ??
    imageNode.ImageUrl ??
    imageNode.url ??
    imageNode.Url ??
    '';
  const direct =
    dto.imagem_url ??
    dto.imagemUrl ??
    dto.ImagemUrl ??
    dto.ImageUrl ??
    dto.Imagem_url ??
    dto.imageUrl ??
    dto.image_url ??
    dto.url ??
    dto.Url ??
    nestedImage ??
    dto.imagem ??
    dto.Imagem ??
    dto.imagemBase64 ??
    dto.ImagemBase64 ??
    dto.base64 ??
    dto.Base64 ??
    fallbackUploadUrl ??
    '';

  return normalizeImageValue(direct);
}

function resolveBannerThumbnail(dto: Partial<BannerDto> & Record<string, unknown>): string {
  const imageNode = resolveBannerImageNode(dto);
  const direct =
    dto.thumbnail_url ??
    dto.thumbnailUrl ??
    dto.ThumbnailUrl ??
    dto.thumbnail ??
    dto.Thumbnail ??
    imageNode.thumbnailUrl ??
    imageNode.ThumbnailUrl ??
    imageNode.thumbnail_url ??
    imageNode.Thumbnail_url ??
    imageNode.thumbnail ??
    imageNode.Thumbnail ??
    '';

  return normalizeImageValue(direct);
}

function mapBannerDto(dto: BannerDto): Banner {
  const raw = dto as unknown as Record<string, unknown>;
  return {
    id: String(dto.id ?? raw.Id ?? ''),
    titulo: (dto.titulo ?? (raw.Titulo as string | null) ?? null) as string | null,
    subtitulo: (dto.subtitulo ?? (raw.Subtitulo as string | null) ?? null) as string | null,
    imagem_url: resolveBannerImage(raw),
    thumbnail_url: resolveBannerThumbnail(raw),
    link: (dto.link ?? (raw.Link as string | null) ?? null) as string | null,
    ordem: Number(dto.ordem ?? raw.Ordem ?? 0),
    ativo: Boolean(dto.ativo ?? raw.Ativo ?? true),
  };
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function toDataUrl(base64: string, mimeType?: string | null): string {
  const raw = String(base64 ?? '').trim();
  if (!raw) return '';
  if (raw.startsWith('data:')) return raw;
  const mime = String(mimeType ?? '').trim() || 'image/png';
  return `data:${mime};base64,${raw}`;
}

function resolveLogoValue(uploaded: unknown): string | null {
  if (typeof uploaded === 'string') {
    const normalized = normalizeImageValue(uploaded);
    return normalized || null;
  }

  const obj = (uploaded ?? {}) as Record<string, unknown>;
  const nested = (obj.upload ?? {}) as Record<string, unknown>;
  const imageNode =
    (obj.imagem as Record<string, unknown> | undefined) ??
    (obj.Imagem as Record<string, unknown> | undefined) ??
    {};

  const urlCandidates = [
    nested.url,
    nested.Url,
    nested.imagemUrl,
    nested.ImagemUrl,
    nested.imageUrl,
    nested.ImageUrl,
    obj.url,
    obj.Url,
    obj.logoUrl,
    obj.LogoUrl,
    obj.imagemUrl,
    obj.ImagemUrl,
    obj.imageUrl,
    obj.ImageUrl,
    imageNode.imagemUrl,
    imageNode.ImagemUrl,
    imageNode.imageUrl,
    imageNode.ImageUrl,
    imageNode.url,
    imageNode.Url,
    obj.logoTelaLogin,
    obj.LogoTelaLogin,
    obj.logoTelaPublica,
    obj.LogoTelaPublica,
  ];

  for (const candidate of urlCandidates) {
    const normalized = normalizeImageValue(candidate);
    if (normalized) return normalized;
  }

  const base64 = String(
    obj.base64 ??
    obj.Base64 ??
    obj.imagemBase64 ??
    obj.ImagemBase64 ??
    imageNode.base64 ??
    imageNode.Base64 ??
    imageNode.imagemBase64 ??
    imageNode.ImagemBase64 ??
    ''
  ).trim();
  if (!base64) return null;

  const mimeType = String(obj.mimeType ?? obj.MimeType ?? '').trim() || null;
  return toDataUrl(base64, mimeType);
}

function ColorPickerField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={hslToHex(value)}
          onChange={e => onChange(hexToHsl(e.target.value))}
          className="w-10 h-9 rounded border border-input cursor-pointer shrink-0"
        />
        <Input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 text-xs h-9"
        />
      </div>
    </div>
  );
}

function BannerPreviewCarousel({ banners }: { banners: Banner[] }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    onSelect();
  }, [emblaApi, onSelect]);

  // Re-init when banners change
  useEffect(() => {
    if (emblaApi) emblaApi.reInit();
  }, [emblaApi, banners]);

  if (banners.length === 0) return null;

  return (
    <div className="relative rounded-xl overflow-hidden border border-border">
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {banners.map((b) => (
            <div key={b.id} className="flex-[0_0_100%] min-w-0 relative">
              <div className="relative aspect-[21/9] sm:aspect-[3/1]">
                <img
                  src={b.imagem_url}
                  alt={b.titulo || 'Banner'}
                  className="w-full h-full object-cover"
                />
                {(b.titulo || b.subtitulo) && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4 sm:p-6">
                    <div>
                      {b.titulo && (
                        <h2 className="text-lg sm:text-2xl font-heading font-bold text-white drop-shadow-md">
                          {b.titulo}
                        </h2>
                      )}
                      {b.subtitulo && (
                        <p className="text-sm sm:text-base text-white/90 mt-1 drop-shadow-md">
                          {b.subtitulo}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      {banners.length > 1 && (
        <>
          <button
            onClick={() => emblaApi?.scrollPrev()}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => emblaApi?.scrollNext()}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => emblaApi?.scrollTo(i)}
                className={`w-2 h-2 rounded-full transition-all ${i === selectedIndex ? 'bg-white w-5' : 'bg-white/50'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function Parametros() {
  const { configs, loading, updateConfig, updateConfigs } = useConfiguracoes();
  const { toast } = useToast();
  const { user } = useAuth();

  // Local state for editable fields
  const [nomeSistema, setNomeSistema] = useState('');
  const [sobreEcoturismoTitulo, setSobreEcoturismoTitulo] = useState('');
  const [sobreEcoturismoTexto1, setSobreEcoturismoTexto1] = useState('');
  const [sobreEcoturismoTexto2, setSobreEcoturismoTexto2] = useState('');
  const [footerTexto, setFooterTexto] = useState('');
  const [footerLinks, setFooterLinks] = useState<{ label: string; url: string }[]>([]);
  const [bannerLargura, setBannerLargura] = useState('');
  const [bannerAltura, setBannerAltura] = useState('');
  const [corPrimaria, setCorPrimaria] = useState('');
  const [corSecundaria, setCorSecundaria] = useState('');
  const [corAccent, setCorAccent] = useState('');
  const [corSidebarBg, setCorSidebarBg] = useState('');
  const [corSucesso, setCorSucesso] = useState('');
  const [corWarning, setCorWarning] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState<string | null>(null);

  // Banners state (moved from Admin)
  const [banners, setBanners] = useState<Banner[]>([]);
  const [uploading, setUploading] = useState(false);
  const [newBanner, setNewBanner] = useState({ titulo: '', subtitulo: '', link: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ titulo: '', subtitulo: '', link: '' });

  useEffect(() => {
    if (!loading) {
      setNomeSistema(configs.nome_sistema);
      setSobreEcoturismoTitulo(configs.sobre_ecoturismo_titulo);
      setSobreEcoturismoTexto1(configs.sobre_ecoturismo_texto_1);
      setSobreEcoturismoTexto2(configs.sobre_ecoturismo_texto_2);
      setFooterTexto(configs.footer_texto);
      setFooterLinks(configs.footer_links);
      setBannerLargura(configs.banner_largura);
      setBannerAltura(configs.banner_altura);
      setCorPrimaria(configs.cor_primaria);
      setCorSecundaria(configs.cor_secundaria);
      setCorAccent(configs.cor_accent);
      setCorSidebarBg(configs.cor_sidebar_bg);
      setCorSucesso(configs.cor_sucesso);
      setCorWarning(configs.cor_warning);
    }
  }, [loading, configs]);

  const fetchBanners = useCallback(async () => {
    try {
      const data = await apiClient.listarBanners(false);
      setBanners(data.map(mapBannerDto).sort((a, b) => a.ordem - b.ordem));
    } catch (error: unknown) {
      setBanners([]);
      toast({ title: 'Erro ao carregar banners', description: getErrorMessage(error, 'Falha ao carregar.'), variant: 'destructive' });
    }
  }, [toast]);

  useEffect(() => { fetchBanners(); }, [fetchBanners]);

  // Logo upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, chave: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const municipioId = String(user?.municipioId ?? '').trim();
    if (!municipioId) {
      toast({
        title: 'Municipio nao informado',
        description: 'Nao foi possivel identificar o municipio para enviar a logo.',
        variant: 'destructive'
      });
      e.target.value = '';
      return;
    }
    setUploadingLogo(chave);
    try {
      const uploaded = chave === 'logo_login'
        ? await apiClient.uploadLogoLoginMunicipio(municipioId, file)
        : await apiClient.uploadLogoPublicoMunicipio(municipioId, file);

      const logoValue = resolveLogoValue(uploaded);
      if (!logoValue) throw new Error('Upload sem URL/Base64 retornado.');

      const err = await updateConfig(chave, logoValue);
      if (err) {
        toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' });
      } else {
        toast({ title: 'Logo atualizado!' });
      }
    } catch (error: unknown) {
      toast({ title: 'Erro no upload', description: getErrorMessage(error, 'Falha no envio da imagem.'), variant: 'destructive' });
    } finally {
      setUploadingLogo(null);
      e.target.value = '';
    }
  };

  const removeLogo = async (chave: string) => {
    const logoAtual = chave === 'logo_login' ? configs.logo_login : configs.logo_publica;
    try {
      if (logoAtual && isHttpUrl(logoAtual)) {
        await apiClient.deletarUploadPorUrl(logoAtual);
      }
    } catch {
      // Nao bloqueia a limpeza da configuracao se o arquivo ja nao existir no storage.
    }
    const err = await updateConfig(chave, null);
    if (!err) toast({ title: 'Logo removido' });
  };

  // Save general configs
  const saveGeneral = async () => {
    const errors = await updateConfigs([
      { chave: 'nome_sistema', valor: nomeSistema },
      { chave: 'sobre_ecoturismo_titulo', valor: sobreEcoturismoTitulo },
      { chave: 'sobre_ecoturismo_texto_1', valor: sobreEcoturismoTexto1 },
      { chave: 'sobre_ecoturismo_texto_2', valor: sobreEcoturismoTexto2 },
      { chave: 'banner_largura', valor: bannerLargura },
      { chave: 'banner_altura', valor: bannerAltura },
    ]);
    if (errors.some(Boolean)) {
      toast({ title: 'Erro ao salvar', variant: 'destructive' });
    } else {
      toast({ title: 'Configurações salvas!' });
    }
  };

  const saveFooter = async () => {
    const errors = await updateConfigs([
      { chave: 'footer_texto', valor: footerTexto },
      { chave: 'footer_links', valor: JSON.stringify(footerLinks) },
    ]);
    if (errors.some(Boolean)) {
      toast({ title: 'Erro ao salvar', variant: 'destructive' });
    } else {
      toast({ title: 'Footer salvo!' });
    }
  };

  // Banner handlers (from Admin.tsx)
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const municipioId = String(user?.municipioId ?? '').trim();
    if (!municipioId) {
      toast({ title: 'Municipio nao informado', description: 'Nao foi possivel identificar o municipio para criar o banner.', variant: 'destructive' });
      e.target.value = '';
      return;
    }
    setUploading(true);
    try {
      const created = await apiClient.uploadBannerECreate(file, {
        municipioId,
        titulo: newBanner.titulo || '',
      });

      toast({ title: 'Banner adicionado!' });
      setNewBanner({ titulo: '', subtitulo: '', link: '' });
      const response = (created ?? {}) as Record<string, unknown>;
      const rawBanner = ((response.banner ?? response.Banner ?? null) as Record<string, unknown> | null) ?? null;
      const uploadNode = (response.upload ?? response.Upload ?? {}) as Record<string, unknown>;
      const uploadUrl = String(uploadNode.url ?? uploadNode.Url ?? '').trim();

      if (rawBanner) {
        const normalized = mapBannerDto(rawBanner as unknown as BannerDto);
        const patched: Banner = {
          ...normalized,
          imagem_url: normalized.imagem_url || normalizeImageValue(uploadUrl),
          thumbnail_url: normalized.thumbnail_url || normalized.imagem_url || normalizeImageValue(uploadUrl),
        };
        if (patched.id && patched.imagem_url) {
          setBanners((prev) => {
            if (prev.some((item) => item.id === patched.id)) return prev;
            return [...prev, patched].sort((a, b) => a.ordem - b.ordem);
          });
        }
      }
      await fetchBanners();
    } catch (error: unknown) {
      toast({ title: 'Erro ao salvar banner', description: getErrorMessage(error, 'Nao foi possivel adicionar o banner.'), variant: 'destructive' });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const startEdit = (b: Banner) => {
    setEditingId(b.id);
    setEditForm({ titulo: b.titulo || '', subtitulo: b.subtitulo || '', link: b.link || '' });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      await apiClient.atualizarBanner(editingId, {
        titulo: editForm.titulo || null,
        subtitulo: editForm.subtitulo || null,
        link: editForm.link || null,
      });
      toast({ title: 'Banner atualizado!' });
      setEditingId(null);
      await fetchBanners();
    } catch (error: unknown) {
      toast({ title: 'Erro ao salvar', description: getErrorMessage(error, 'Nao foi possivel atualizar.'), variant: 'destructive' });
    }
  };

  const toggleAtivo = async (id: string, ativo: boolean) => {
    try {
      await apiClient.atualizarBanner(id, { ativo });
      await fetchBanners();
    } catch (error: unknown) {
      toast({ title: 'Erro ao salvar', description: getErrorMessage(error, 'Nao foi possivel atualizar o status.'), variant: 'destructive' });
    }
  };

  const deleteBanner = async (banner: Banner) => {
    try {
      if (banner.imagem_url) {
        await apiClient.deletarUploadPorUrl(banner.imagem_url);
      }
    } catch {
      // Nao bloqueia a exclusao do registro caso o arquivo nao exista no storage.
    }
    try {
      await apiClient.excluirBanner(banner.id);
      await fetchBanners();
      toast({ title: 'Banner removido' });
    } catch (error: unknown) {
      toast({ title: 'Erro ao excluir', description: getErrorMessage(error, 'Nao foi possivel remover o banner.'), variant: 'destructive' });
    }
  };

  const moveOrder = async (id: string, direction: -1 | 1) => {
    const idx = banners.findIndex(b => b.id === id);
    const swapIdx = idx + direction;
    if (swapIdx < 0 || swapIdx >= banners.length) return;
    const updates = [
      { id: banners[idx].id, ordem: banners[swapIdx].ordem },
      { id: banners[swapIdx].id, ordem: banners[idx].ordem },
    ];
    try {
      await apiClient.reordenarBanners(updates);
      await fetchBanners();
    } catch (error: unknown) {
      toast({ title: 'Erro ao reordenar', description: getErrorMessage(error, 'Nao foi possivel atualizar a ordem.'), variant: 'destructive' });
    }
  };

  const addFooterLink = () => setFooterLinks(prev => [...prev, { label: '', url: '' }]);
  const removeFooterLink = (idx: number) => setFooterLinks(prev => prev.filter((_, i) => i !== idx));
  const updateFooterLink = (idx: number, field: 'label' | 'url', value: string) => {
    setFooterLinks(prev => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l));
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-heading font-bold">Parâmetros do Sistema</h1>

      <Tabs defaultValue="identidade" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="identidade">Identidade Visual</TabsTrigger>
          <TabsTrigger value="cores">Cores</TabsTrigger>
          <TabsTrigger value="banners">Banners</TabsTrigger>
          <TabsTrigger value="footer">Footer</TabsTrigger>
          <TabsTrigger value="geral">Geral</TabsTrigger>
        </TabsList>

        {/* === IDENTIDADE VISUAL === */}
        <TabsContent value="identidade" className="space-y-4">
          {/* Logo Login */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-heading flex items-center gap-2">
                <Image className="h-5 w-5" /> Logo da Tela de Login
              </CardTitle>
              <CardDescription>Recomendado: 200×200px, formato PNG com fundo transparente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {configs.logo_login ? (
                <div className="flex items-center gap-4">
                  <img src={configs.logo_login} alt="Logo Login" className="w-24 h-24 object-contain rounded-lg border border-border bg-muted p-2" />
                  <Button variant="destructive" size="sm" onClick={() => removeLogo('logo_login')}>
                    <Trash2 className="h-4 w-4 mr-1" /> Remover
                  </Button>
                </div>
              ) : (
                <div className="w-24 h-24 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted/50">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <div>
                <label htmlFor="logo-login-file" className="cursor-pointer">
                  <Button variant="outline" size="sm" asChild disabled={uploadingLogo === 'logo_login'}>
                    <span><Upload className="h-4 w-4 mr-1" />{uploadingLogo === 'logo_login' ? 'Enviando...' : 'Enviar Logo'}</span>
                  </Button>
                </label>
                <input id="logo-login-file" type="file" accept="image/*" className="hidden" onChange={e => handleLogoUpload(e, 'logo_login')} />
              </div>
            </CardContent>
          </Card>

          {/* Logo Publica */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-heading flex items-center gap-2">
                <Image className="h-5 w-5" /> Logo da Área Pública
              </CardTitle>
              <CardDescription>Exibido no header das páginas públicas. Recomendado: 160×40px, formato PNG</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {configs.logo_publica ? (
                <div className="flex items-center gap-4">
                  <img src={configs.logo_publica} alt="Logo Pública" className="h-12 object-contain rounded-lg border border-border bg-muted p-2" />
                  <Button variant="destructive" size="sm" onClick={() => removeLogo('logo_publica')}>
                    <Trash2 className="h-4 w-4 mr-1" /> Remover
                  </Button>
                </div>
              ) : (
                <div className="h-12 w-40 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted/50">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div>
                <label htmlFor="logo-publica-file" className="cursor-pointer">
                  <Button variant="outline" size="sm" asChild disabled={uploadingLogo === 'logo_publica'}>
                    <span><Upload className="h-4 w-4 mr-1" />{uploadingLogo === 'logo_publica' ? 'Enviando...' : 'Enviar Logo'}</span>
                  </Button>
                </label>
                <input id="logo-publica-file" type="file" accept="image/*" className="hidden" onChange={e => handleLogoUpload(e, 'logo_publica')} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* === CORES === */}
        <TabsContent value="cores" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-heading flex items-center gap-2">
                <Palette className="h-5 w-5" /> Cores do Tema
              </CardTitle>
              <CardDescription>Configure todas as cores aplicadas no sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Cores principais */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">Cores Principais</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <ColorPickerField label="Cor Primária" value={corPrimaria} onChange={setCorPrimaria} placeholder="120 56% 24%" />
                  <ColorPickerField label="Cor Secundária" value={corSecundaria} onChange={setCorSecundaria} placeholder="120 40% 35%" />
                  <ColorPickerField label="Cor de Destaque (Accent)" value={corAccent} onChange={setCorAccent} placeholder="204 98% 37%" />
                </div>
              </div>

              {/* Interface */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">Interface</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <ColorPickerField label="Fundo da Sidebar" value={corSidebarBg} onChange={setCorSidebarBg} placeholder="120 20% 12%" />
                </div>
              </div>

              {/* Feedback */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">Feedback</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <ColorPickerField label="Cor de Sucesso" value={corSucesso} onChange={setCorSucesso} placeholder="120 40% 44%" />
                  <ColorPickerField label="Cor de Aviso (Warning)" value={corWarning} onChange={setCorWarning} placeholder="45 100% 51%" />
                </div>
              </div>

              {/* Preview */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Eye className="h-4 w-4" /> Preview
                </div>
                <div className="rounded-lg border border-border p-6 space-y-4 bg-background">
                  <div className="flex flex-wrap gap-3">
                    <button className="px-4 py-2 rounded-md text-sm font-medium text-white" style={{ backgroundColor: `hsl(${corPrimaria})` }}>
                      Primário
                    </button>
                    <button className="px-4 py-2 rounded-md text-sm font-medium text-white" style={{ backgroundColor: `hsl(${corSecundaria})` }}>
                      Secundário
                    </button>
                    <button className="px-4 py-2 rounded-md text-sm font-medium text-white" style={{ backgroundColor: `hsl(${corAccent})` }}>
                      Destaque
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold text-white" style={{ backgroundColor: `hsl(${corSucesso})` }}>
                      ✓ Sucesso
                    </span>
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ backgroundColor: `hsl(${corWarning})`, color: '#1a1a00' }}>
                      ⚠ Aviso
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-md" style={{ backgroundColor: `hsl(${corSidebarBg})` }} />
                    <span className="text-xs text-muted-foreground">Fundo da Sidebar</span>
                  </div>
                  <p className="text-sm">
                    <span style={{ color: `hsl(${corPrimaria})` }} className="font-semibold">Primária</span>{' · '}
                    <span style={{ color: `hsl(${corSecundaria})` }} className="font-semibold">Secundária</span>{' · '}
                    <span style={{ color: `hsl(${corAccent})` }} className="font-semibold">Destaque</span>
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={async () => {
                  const errors = await updateConfigs([
                    { chave: 'cor_primaria', valor: corPrimaria },
                    { chave: 'cor_secundaria', valor: corSecundaria },
                    { chave: 'cor_accent', valor: corAccent },
                    { chave: 'cor_sidebar_bg', valor: corSidebarBg },
                    { chave: 'cor_sucesso', valor: corSucesso },
                    { chave: 'cor_warning', valor: corWarning },
                  ]);
                  if (errors.some(Boolean)) {
                    toast({ title: 'Erro ao salvar', variant: 'destructive' });
                  } else {
                    toast({ title: 'Cores salvas!' });
                  }
                }}>Salvar Cores</Button>
                <Button variant="outline" onClick={() => {
                  setCorPrimaria('120 56% 24%');
                  setCorSecundaria('120 40% 35%');
                  setCorAccent('204 98% 37%');
                  setCorSidebarBg('120 20% 12%');
                  setCorSucesso('120 40% 44%');
                  setCorWarning('45 100% 51%');
                }}>
                  <RotateCcw className="h-4 w-4 mr-1" /> Restaurar Padrão
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* === BANNERS === */}
        <TabsContent value="banners" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-heading flex items-center gap-2">
                <Image className="h-5 w-5" /> Banners do Portal de Reservas
              </CardTitle>
              <CardDescription className="flex items-center gap-1">
                <Info className="h-4 w-4" />
                Tamanho recomendado: {configs.banner_largura}×{configs.banner_altura}px
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add banner form */}
              <div className="border border-dashed border-border rounded-lg p-4 space-y-3">
                <p className="text-sm font-medium text-muted-foreground">Novo Banner</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="b-titulo" className="text-xs">Título (opcional)</Label>
                    <Input id="b-titulo" value={newBanner.titulo} onChange={e => setNewBanner(p => ({ ...p, titulo: e.target.value }))} placeholder="Título do banner" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="b-sub" className="text-xs">Subtítulo (opcional)</Label>
                    <Input id="b-sub" value={newBanner.subtitulo} onChange={e => setNewBanner(p => ({ ...p, subtitulo: e.target.value }))} placeholder="Subtítulo" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="b-link" className="text-xs">Link (opcional)</Label>
                    <Input id="b-link" value={newBanner.link} onChange={e => setNewBanner(p => ({ ...p, link: e.target.value }))} placeholder="https://..." />
                  </div>
                </div>
                <div>
                  <Label htmlFor="banner-file" className="text-xs">Imagem *</Label>
                  <div className="mt-1">
                    <label htmlFor="banner-file" className="inline-flex items-center gap-2 cursor-pointer">
                      <Button variant="outline" size="sm" asChild disabled={uploading}>
                        <span><Plus className="h-4 w-4 mr-1" />{uploading ? 'Enviando...' : 'Selecionar Imagem'}</span>
                      </Button>
                    </label>
                    <input id="banner-file" type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} disabled={uploading} />
                  </div>
                </div>
              </div>

              {/* Banner list */}
              {banners.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum banner cadastrado.</p>
              ) : (
                <div className="space-y-2">
                  {banners.map((b, idx) => (
                    <div key={b.id} className="p-3 rounded-lg bg-muted/50 space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col gap-0.5">
                          <button onClick={() => moveOrder(b.id, -1)} disabled={idx === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30">▲</button>
                          <button onClick={() => moveOrder(b.id, 1)} disabled={idx === banners.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-30">▼</button>
                        </div>
                        <img src={b.thumbnail_url || b.imagem_url} alt={b.titulo || 'Banner'} className="w-20 h-12 object-cover rounded" />
                        <div className="flex-1 min-w-0">
                          {editingId === b.id ? (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                              <Input value={editForm.titulo} onChange={e => setEditForm(p => ({ ...p, titulo: e.target.value }))} placeholder="Título" className="h-8 text-xs" />
                              <Input value={editForm.subtitulo} onChange={e => setEditForm(p => ({ ...p, subtitulo: e.target.value }))} placeholder="Subtítulo" className="h-8 text-xs" />
                              <Input value={editForm.link} onChange={e => setEditForm(p => ({ ...p, link: e.target.value }))} placeholder="Link" className="h-8 text-xs" />
                            </div>
                          ) : (
                            <>
                              <p className="text-sm font-medium truncate">{b.titulo || '(sem título)'}</p>
                              {b.subtitulo && <p className="text-xs text-muted-foreground truncate">{b.subtitulo}</p>}
                              {b.link && <p className="text-[10px] text-muted-foreground truncate">{b.link}</p>}
                            </>
                          )}
                        </div>
                        {editingId === b.id ? (
                          <>
                            <Button variant="ghost" size="icon" onClick={saveEdit} className="text-primary hover:text-primary">
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setEditingId(null)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <Button variant="ghost" size="icon" onClick={() => startEdit(b)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        <Switch checked={b.ativo} onCheckedChange={(v) => toggleAtivo(b.id, v)} />
                        <Button variant="ghost" size="icon" onClick={() => deleteBanner(b)} className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Preview do Carrossel */}
          {banners.filter(b => b.ativo).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-heading flex items-center gap-2">
                  <Eye className="h-5 w-5" /> Preview do Carrossel
                </CardTitle>
                <CardDescription>Visualização em tempo real de como os banners ativos aparecerão no portal</CardDescription>
              </CardHeader>
              <CardContent>
                <BannerPreviewCarousel banners={banners.filter(b => b.ativo)} />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* === FOOTER === */}
        <TabsContent value="footer" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-heading flex items-center gap-2">
                <Type className="h-5 w-5" /> Rodapé
              </CardTitle>
              <CardDescription>Configure o texto e links exibidos no rodapé das páginas públicas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Texto do Rodapé</Label>
                <Textarea value={footerTexto} onChange={e => setFooterTexto(e.target.value)} rows={2} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Links do Rodapé</Label>
                  <Button variant="outline" size="sm" onClick={addFooterLink}>
                    <Plus className="h-4 w-4 mr-1" /> Adicionar Link
                  </Button>
                </div>
                {footerLinks.map((link, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      placeholder="Texto do link"
                      value={link.label}
                      onChange={e => updateFooterLink(idx, 'label', e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="https://..."
                      value={link.url}
                      onChange={e => updateFooterLink(idx, 'url', e.target.value)}
                      className="flex-1"
                    />
                    <Button variant="ghost" size="icon" onClick={() => removeFooterLink(idx)} className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <Button onClick={saveFooter}>Salvar Rodapé</Button>

              {/* Preview em tempo real */}
              <div className="space-y-2 pt-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Eye className="h-4 w-4" />
                  Preview do Rodapé
                </div>
                <div className="rounded-lg border border-border overflow-hidden">
                  <div className="border-t bg-muted/50 py-6 text-center space-y-3">
                    <p className="text-sm text-muted-foreground">
                      © {new Date().getFullYear()} {footerTexto || '(texto do rodapé)'}
                    </p>
                    {footerLinks.filter(l => l.label && l.url).length > 0 && (
                      <div className="flex items-center justify-center gap-4 flex-wrap">
                        {footerLinks.filter(l => l.label && l.url).map((link, idx) => (
                          <a
                            key={idx}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                          >
                            {link.label}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* === GERAL === */}
        <TabsContent value="geral" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-heading flex items-center gap-2">
                <Settings className="h-5 w-5" /> Configurações Gerais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nome do Sistema</Label>
                <Input value={nomeSistema} onChange={e => setNomeSistema(e.target.value)} placeholder="EcoTurismo" />
                <p className="text-xs text-muted-foreground">Exibido nos headers e sidebar</p>
              </div>

              <div className="space-y-2">
                <Label>Secao: Sobre o Ecoturismo no Municipio</Label>
                <Input
                  value={sobreEcoturismoTitulo}
                  onChange={e => setSobreEcoturismoTitulo(e.target.value)}
                  placeholder="Titulo da secao"
                />
                <Textarea
                  value={sobreEcoturismoTexto1}
                  onChange={e => setSobreEcoturismoTexto1(e.target.value)}
                  rows={3}
                  placeholder="Primeiro paragrafo"
                />
                <Textarea
                  value={sobreEcoturismoTexto2}
                  onChange={e => setSobreEcoturismoTexto2(e.target.value)}
                  rows={3}
                  placeholder="Segundo paragrafo"
                />
                <p className="text-xs text-muted-foreground">Conteudo exibido na home na secao institucional.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Largura Recomendada dos Banners (px)</Label>
                  <Input value={bannerLargura} onChange={e => setBannerLargura(e.target.value)} type="number" />
                </div>
                <div className="space-y-2">
                  <Label>Altura Recomendada dos Banners (px)</Label>
                  <Input value={bannerAltura} onChange={e => setBannerAltura(e.target.value)} type="number" />
                </div>
              </div>

              <Button onClick={saveGeneral}>Salvar Configurações</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
