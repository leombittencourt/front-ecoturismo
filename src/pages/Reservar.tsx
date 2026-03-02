import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Trees, CalendarCheck, CheckCircle2, Copy, Users, AlertTriangle, Flame, MapPin } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useToast } from '@/hooks/use-toast';
import { ptBR } from 'date-fns/locale';
import { differenceInDays, format } from 'date-fns';
import { Moon } from 'lucide-react';
import { useConfiguracoes } from '@/hooks/useConfiguracoes';
import SEOHead from '@/components/SEOHead';
import { apiClient } from '@/services/apiClient';
import { normalizeQuiosqueStatus } from '@/components/quiosques/types';

interface AtrativoOption {
  id: string;
  nome: string;
  tipo: string;
  capacidade_maxima: number;
  ocupacao_atual: number;
  imagem_url?: string;
  municipio_nome?: string;
  municipio_uf?: string;
}

interface QuiosqueOption {
  id: string;
  numero: number;
  tem_churrasqueira: boolean;
  status: string;
  posicao_x: number;
  posicao_y: number;
}

function getOcupacaoColor(pct: number) {
  if (pct >= 100) return 'bg-destructive text-destructive-foreground';
  if (pct > 90) return 'bg-orange-500 text-white';
  if (pct >= 70) return 'bg-warning text-warning-foreground';
  return 'bg-success text-success-foreground';
}

function toIsoDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().split('T')[0];
}

function isoRange(startIso: string, endIso: string): string[] {
  const out: string[] = [];
  const start = new Date(`${startIso}T00:00:00`);
  const end = new Date(`${endIso}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return out;

  const cur = new Date(start);
  while (cur <= end) {
    out.push(cur.toISOString().split('T')[0]);
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

function isReservaAtiva(status: unknown): boolean {
  return String(status ?? '').toLowerCase() !== 'cancelada';
}

function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

function formatBrazilPhone(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export default function Reservar() {
  const [searchParams] = useSearchParams();
  const [atrativos, setAtrativos] = useState<AtrativoOption[]>([]);
  const [selectedAtrativo, setSelectedAtrativo] = useState('');
  const [date, setDate] = useState<Date | undefined>();
  const [dateFim, setDateFim] = useState<Date | undefined>();
  const [tipoReserva, setTipoReserva] = useState<'day_use' | 'camping'>('day_use');
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [adultos, setAdultos] = useState(1);
  const [criancas, setCriancas] = useState(0);
  const [lgpdAccepted, setLgpdAccepted] = useState(false);
  const [form, setForm] = useState({ nome: '', email: '', celular: '', cidade: '', uf: '' });
  const [loading, setLoading] = useState(false);
  const [confirmacao, setConfirmacao] = useState<{
    token: string; nome: string; data: string; dataFim?: string;
    tipo: string; quantidade: number; atrativoNome: string; quiosqueNumero?: number;
  } | null>(null);
  const [ocupacaoPeriodo, setOcupacaoPeriodo] = useState<number | null>(null);
  const [quiosques, setQuiosques] = useState<QuiosqueOption[]>([]);
  const [selectedQuiosque, setSelectedQuiosque] = useState<string | null>(null);
  const { toast } = useToast();
  const { configs } = useConfiguracoes();
  const municipioId = import.meta.env.VITE_MUNICIPIO_ID as string | undefined;
  const atrativoFromQuery = searchParams.get('atrativo');

  useEffect(() => {
    let ativo = true;

    const loadAtrativos = async () => {
      const municipioIdParam = municipioId?.trim();
      if (!municipioIdParam) {
        setAtrativos([]);
        toast({
          title: 'Configuracao ausente',
          description: 'Defina VITE_MUNICIPIO_ID para carregar os atrativos.',
          variant: 'destructive',
        });
        return;
      }

      try {
        const data = await apiClient.listarAtrativos({ MunicipioId: municipioIdParam });
        if (!ativo) return;

        const mapped = (data ?? [])
          .filter((a: any) => (a.status ?? a.Status ?? '').toString().toLowerCase() === 'ativo')
          .map((a: any) => ({
            id: a.id,
            nome: a.nome,
            tipo: a.tipo,
            capacidade_maxima: Number(a.capacidadeMaxima ?? a.capacidade_maxima ?? a.CapacidadeMaxima ?? 0),
            ocupacao_atual: Number(a.ocupacaoAtual ?? a.ocupacao_atual ?? a.OcupacaoAtual ?? 0),
            imagem_url: (a.imagemUrl ?? a.imagem_url ?? a.imagem ?? '').toString(),
            municipio_nome: (a.municipioNome ?? a.municipio_nome ?? a.municipio ?? '').toString(),
            municipio_uf: (a.uf ?? a.Uf ?? a.municipioUf ?? a.municipio_uf ?? '').toString(),
          }));

        setAtrativos(mapped);
        if (atrativoFromQuery && mapped.some((a) => a.id === atrativoFromQuery)) {
          setSelectedAtrativo(atrativoFromQuery);
        }
      } catch (error: any) {
        if (!ativo) return;
        setAtrativos([]);
        toast({
          title: 'Erro ao carregar atrativos',
          description: error?.message || 'Nao foi possivel carregar os atrativos.',
          variant: 'destructive',
        });
      }
    };

    loadAtrativos();
    return () => {
      ativo = false;
    };
  }, [municipioId, toast, atrativoFromQuery]);

  // Fetch quiosques for selected atrativo
  useEffect(() => {
    let ativo = true;
    setSelectedQuiosque(null);

    if (!selectedAtrativo) {
      setQuiosques([]);
      return () => {
        ativo = false;
      };
    }

    const loadQuiosques = async () => {
      try {
        const data = await apiClient.listarQuiosques(selectedAtrativo);
        if (!ativo) return;

        const mapped: QuiosqueOption[] = (data ?? [])
          .map((q: any) => ({
            id: q.id,
            numero: q.numero,
            tem_churrasqueira: q.temChurrasqueira ?? q.tem_churrasqueira ?? false,
            status: normalizeQuiosqueStatus(q.status),
            posicao_x: q.posicaoX ?? q.posicao_x ?? q.PosicaoX ?? 0,
            posicao_y: q.posicaoY ?? q.posicao_y ?? q.PosicaoY ?? 0,
          }))
          .sort((a, b) => (a.posicao_y - b.posicao_y) || (a.posicao_x - b.posicao_x));

        setQuiosques(mapped);
      } catch (error: any) {
        if (!ativo) return;
        setQuiosques([]);
        toast({
          title: 'Erro ao carregar quiosques',
          description: error?.message || 'Nao foi possivel carregar os quiosques.',
          variant: 'destructive',
        });
      }
    };

    loadQuiosques();
    return () => {
      ativo = false;
    };
  }, [selectedAtrativo, toast]);

  const atrativo = atrativos.find(a => a.id === selectedAtrativo);
  const tituloTopo = atrativo
    ? `Reserve sua visita - ${atrativo.nome}`
    : 'Reserve sua visita ao atrativo';
  const isCamping = tipoReserva === 'camping';
  const quantidade = Math.max(0, adultos) + Math.max(0, criancas);
  const ocupacaoAtual = ocupacaoPeriodo ?? atrativo?.ocupacao_atual ?? 0;
  const vagasRestantes = atrativo ? Math.max(0, atrativo.capacidade_maxima - ocupacaoAtual) : 0;
  const pctOcupacao = atrativo && atrativo.capacidade_maxima > 0
    ? Math.round((ocupacaoAtual / atrativo.capacidade_maxima) * 100)
    : 0;
  const lotado = atrativo ? vagasRestantes <= 0 : false;
  const statusDisponibilidade = lotado
    ? 'Lotado'
    : pctOcupacao >= 90
      ? 'Últimas vagas'
      : 'Disponível';
  const statusClassName = lotado
    ? 'bg-destructive text-destructive-foreground'
    : pctOcupacao >= 90
      ? 'bg-warning text-warning-foreground'
      : 'bg-success text-success-foreground';
  const excedeLimite = quantidade > vagasRestantes;
  const dataFimInvalida = isCamping && dateFim && date && dateFim <= date;

  const disponiveisQuiosques = quiosques.filter(q => q.status === 'disponivel');
  const selectedQ = quiosques.find(q => q.id === selectedQuiosque);
  const step1Valid = Boolean(selectedAtrativo && date && (!isCamping || dateFim) && !dataFimInvalida);
  const step2Valid = quantidade > 0 && !excedeLimite && !lotado;
  const celularDigits = onlyDigits(form.celular);
  const step3Valid = Boolean(
    form.nome.trim() &&
    form.email.trim() &&
    celularDigits.length === 11 &&
    form.cidade.trim() &&
    form.uf.trim() &&
    lgpdAccepted
  );

  useEffect(() => {
    if (!atrativo) {
      setTipoReserva('day_use');
      setDateFim(undefined);
      setStep(1);
      return;
    }
    setTipoReserva(atrativo.tipo === 'camping' ? 'camping' : 'day_use');
    setDateFim(undefined);
    setStep(1);
  }, [selectedAtrativo, atrativos]);

  useEffect(() => {
    if (!isCamping) setDateFim(undefined);
  }, [isCamping]);

  useEffect(() => {
    let ativo = true;

    const calcularOcupacaoPeriodo = async () => {
      if (!selectedAtrativo || !date) {
        setOcupacaoPeriodo(null);
        return;
      }

      try {
        const reservas = await apiClient.listarReservasPorAtrativo(selectedAtrativo);
        if (!ativo) return;

        const inicioIso = date.toISOString().split('T')[0];
        const fimSelecionado = isCamping && dateFim ? dateFim : date;
        const fimIso = fimSelecionado.toISOString().split('T')[0];
        const diasSelecionados = isoRange(inicioIso, fimIso);

        let maiorOcupacao = 0;
        for (const dia of diasSelecionados) {
          const ocupacaoDia = (reservas ?? []).reduce((acc, r: any) => {
            if (!isReservaAtiva(r.status)) return acc;

            const reservaInicio = toIsoDate(r.data);
            const reservaFim = toIsoDate(r.dataFim) ?? reservaInicio;
            if (!reservaInicio || !reservaFim) return acc;

            if (dia >= reservaInicio && dia <= reservaFim) {
              return acc + Number(r.quantidadePessoas ?? r.quantidade_pessoas ?? 1);
            }
            return acc;
          }, 0);

          maiorOcupacao = Math.max(maiorOcupacao, ocupacaoDia);
        }

        setOcupacaoPeriodo(maiorOcupacao);
      } catch {
        if (!ativo) return;
        setOcupacaoPeriodo(null);
      }
    };

    calcularOcupacaoPeriodo();
    return () => {
      ativo = false;
    };
  }, [date, dateFim, isCamping, selectedAtrativo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !selectedAtrativo || !lgpdAccepted || excedeLimite || lotado || (isCamping && !dateFim) || dataFimInvalida) return;

    setLoading(true);
    const fallbackToken = `ECO-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const dataStr = date.toISOString().split('T')[0];
    const dataFimStr = isCamping && dateFim ? dateFim.toISOString().split('T')[0] : null;

    try {
      const created = await apiClient.criarReserva({
        atrativoId: selectedAtrativo,
        nomeVisitante: form.nome,
        email: form.email,
        cpf: 'nao informado',
        cidadeOrigem: form.cidade,
        ufOrigem: form.uf,
        tipo: tipoReserva,
        data: dataStr,
        dataFim: dataFimStr,
        quantidadePessoas: quantidade,
        quiosqueId: selectedQuiosque,
      });

      if (selectedQuiosque) {
        await apiClient.atualizarQuiosque(selectedQuiosque, { status: 'reservado' });
      }

      setConfirmacao({
        token: created?.token || fallbackToken,
        nome: form.nome,
        data: dataStr,
        dataFim: dataFimStr || undefined,
        tipo: tipoReserva,
        quantidade,
        atrativoNome: atrativo?.nome || '',
        quiosqueNumero: selectedQ?.numero,
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao criar reserva',
        description: error?.message || 'Nao foi possivel criar a reserva.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };


  if (confirmacao) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
        <nav className="px-4 py-4 flex items-center justify-between border-b border-border bg-card max-w-6xl mx-auto">
          <Link to="/" className="flex items-center gap-2">
            {configs.logo_publica ? (
              <img src={configs.logo_publica} alt={configs.nome_sistema} className="h-6 object-contain" />
            ) : (
              <Trees className="h-6 w-6 text-primary" />
            )}
            <span className="font-heading font-bold text-foreground">{configs.nome_sistema}</span>
          </Link>
        </nav>
        <div className="max-w-lg mx-auto mt-8 px-4 animate-fade-in">
          <Card className="text-center">
            <CardContent className="p-8 space-y-6">
              <CheckCircle2 className="h-16 w-16 mx-auto text-success" />
              <h2 className="text-2xl font-heading font-bold text-foreground">Reserva Confirmada!</h2>

              <div className="space-y-2 text-sm text-left bg-muted/50 p-4 rounded-lg">
                <p><span className="text-muted-foreground">Nome:</span> <strong>{confirmacao.nome}</strong></p>
                <p><span className="text-muted-foreground">Atrativo:</span> <strong>{confirmacao.atrativoNome}</strong></p>
                <p><span className="text-muted-foreground">Data:</span> <strong>{confirmacao.dataFim ? `${confirmacao.data} → ${confirmacao.dataFim}` : confirmacao.data}</strong></p>
                <p><span className="text-muted-foreground">Tipo:</span> <strong>{confirmacao.tipo === 'camping' ? 'Camping' : 'Day Use'}</strong></p>
                <p><span className="text-muted-foreground">Quantidade:</span> <strong>{confirmacao.quantidade} pessoa(s)</strong></p>
                {confirmacao.quiosqueNumero && (
                  <p><span className="text-muted-foreground">Quiosque:</span> <strong>Q{confirmacao.quiosqueNumero}</strong></p>
                )}
                <p><span className="text-muted-foreground">Status:</span> <Badge className="bg-success text-success-foreground ml-1">Confirmada</Badge></p>
              </div>

              <div className="flex justify-center">
                <div className="bg-white p-4 rounded-xl shadow-md">
                  <QRCodeSVG value={confirmacao.token} size={180} level="H" />
                </div>
              </div>

              <div className="flex items-center justify-center gap-2">
                <code className="text-xl font-heading font-bold text-primary bg-primary/10 px-4 py-2 rounded-lg">{confirmacao.token}</code>
                <Button variant="ghost" size="icon" onClick={() => { navigator.clipboard.writeText(confirmacao.token); toast({ title: 'Token copiado!' }); }}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>

              <p className="text-muted-foreground text-sm">Apresente este QR Code na entrada do atrativo.</p>

              <div className="flex flex-col gap-2">
                <Link to={`/ticket/${confirmacao.token}`}>
                  <Button variant="outline" className="w-full">Ver Ticket Online</Button>
                </Link>
                <Button onClick={() => { setConfirmacao(null); setForm({ nome: '', email: '', celular: '', cidade: '', uf: '' }); setDate(undefined); setDateFim(undefined); setSelectedAtrativo(''); setAdultos(1); setCriancas(0); setStep(1); setLgpdAccepted(false); setSelectedQuiosque(null); }} variant="ghost">
                  Nova Reserva
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Build quiosque mini grid
  const maxX = quiosques.length > 0 ? Math.max(...quiosques.map(q => q.posicao_x), 0) : 0;
  const maxY = quiosques.length > 0 ? Math.max(...quiosques.map(q => q.posicao_y), 0) : 0;
  const cols = maxX + 1;

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 via-emerald-50/30 to-background">
      <SEOHead
        title="Reservar Visita - EcoTurismo"
        description="Reserve sua visita a balneários, cachoeiras e trilhas. Sem cadastro, com QR Code para validação na entrada."
      />
      <nav className="px-4 py-4 flex items-center justify-between border-b border-border bg-card">
        <Link to="/" className="flex items-center gap-2">
          {configs.logo_publica ? (
            <img src={configs.logo_publica} alt={configs.nome_sistema} className="h-6 object-contain" />
          ) : (
            <Trees className="h-6 w-6 text-primary" />
          )}
          <span className="font-heading font-bold text-foreground">{configs.nome_sistema}</span>
        </Link>
        <Link to="/login">
          <Button variant="ghost" size="sm" className="text-muted-foreground">Área Gestão</Button>
        </Link>
      </nav>

      <header className="bg-gradient-to-r from-primary via-primary/90 to-secondary text-primary-foreground border-b border-primary/40 shadow-[0_6px_18px_rgba(0,0,0,0.12)]">
        <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4 text-center">
          <p className="text-xs sm:text-sm font-medium tracking-[0.08em] text-white/90">
            Prefeitura de Rio Verde de Mato Grosso/MS
          </p>
          <p className="text-base sm:text-lg font-heading font-bold tracking-tight drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]">
            Sistema Oficial de Reservas Ambientais
          </p>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6 animate-fade-in">

        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 text-center">
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">
            {tituloTopo}
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
            Controle a data, número de visitantes e garanta uma experiência segura e sustentável.
          </p>
        </div>

        {atrativo && (
          <Card>
            <CardContent className="p-0">
              <div className="h-44 bg-muted relative overflow-hidden rounded-t-xl">
                {atrativo.imagem_url ? (
                  <img src={atrativo.imagem_url} alt={atrativo.nome} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 flex items-center justify-center">
                    <Trees className="h-10 w-10 text-primary/70" />
                  </div>
                )}
              </div>
              <div className="p-4 sm:p-5 space-y-3">
                <div>
                  <h2 className="text-lg sm:text-xl font-heading font-bold text-foreground">{atrativo.nome}</h2>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin className="h-4 w-4" />
                    {atrativo.municipio_nome || 'Município'}{atrativo.municipio_uf ? ` - ${atrativo.municipio_uf}` : ''}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  <div className="rounded-lg border border-border bg-muted/40 px-3 py-2">
                    <p className="text-muted-foreground text-xs">Capacidade total</p>
                    <p className="font-semibold text-foreground">{atrativo.capacidade_maxima} pessoas</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/40 px-3 py-2">
                    <p className="text-muted-foreground text-xs">Ocupação hoje</p>
                    <p className="font-semibold text-foreground">{pctOcupacao}%</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/40 px-3 py-2">
                    <p className="text-muted-foreground text-xs">Status</p>
                    <Badge className={statusClassName}>{statusDisponibilidade}</Badge>
                  </div>
                </div>
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{ocupacaoAtual} / {atrativo.capacidade_maxima} vagas ocupadas</span>
                    <Badge className={getOcupacaoColor(pctOcupacao)}>
                      {lotado ? 'Lotado' : `${vagasRestantes} disponíveis`}
                    </Badge>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full transition-all ${pctOcupacao >= 100 ? 'bg-destructive' : pctOcupacao > 90 ? 'bg-orange-500' : pctOcupacao >= 70 ? 'bg-warning' : 'bg-primary'}`}
                      style={{ width: `${Math.min(100, pctOcupacao)}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div id="detalhes-reserva">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-heading">Reserva em 3 etapas</CardTitle>
              <CardDescription>
                {step === 1 && '1️⃣ Selecione Data e Horário'}
                {step === 2 && '2️⃣ Selecione Número de Visitantes'}
                {step === 3 && '3️⃣ Detalhes do Visitante'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Progresso do preenchimento</span>
                  <span className="font-semibold text-foreground">▶ {step} / 3</span>
                </div>
                <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-2 rounded-full bg-primary transition-all duration-300"
                    style={{ width: `${(step / 3) * 100}%` }}
                  />
                </div>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                {step === 1 && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Atrativo</Label>
                      <Select value={selectedAtrativo} onValueChange={setSelectedAtrativo}>
                        <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        <SelectContent>
                          {atrativos.map(a => {
                            const pct = Math.round((a.ocupacao_atual / a.capacidade_maxima) * 100);
                            return (
                              <SelectItem key={a.id} value={a.id}>
                                {a.nome} — {pct}% ocupado
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label>Período (se aplicável)</Label>
                      <Select value={tipoReserva} onValueChange={(v) => setTipoReserva(v as 'day_use' | 'camping')}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="day_use">Day Use</SelectItem>
                          <SelectItem value="camping">Camping</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className={isCamping ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : ''}>
                      <div>
                        <Label className="mb-1 block">{isCamping ? 'Data de Entrada' : 'Data'}</Label>
                        <div className="w-full rounded-md border bg-card p-2 flex justify-center">
                          <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            locale={ptBR}
                            disabled={{ before: new Date() }}
                            className="pointer-events-auto"
                          />
                        </div>
                      </div>

                      {isCamping && (
                        <div>
                          <Label className="mb-1 block">Data de Saída</Label>
                          <div className="w-full rounded-md border bg-card p-2 flex justify-center">
                            <Calendar
                              mode="single"
                              selected={dateFim}
                              onSelect={setDateFim}
                              locale={ptBR}
                              disabled={{ before: date ? new Date(date.getTime() + 86400000) : new Date() }}
                              className="pointer-events-auto"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    {isCamping && dataFimInvalida && (
                      <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                        <AlertTriangle className="h-3 w-3" /> A data de saída deve ser posterior à data de entrada
                      </p>
                    )}
                    {isCamping && date && dateFim && dateFim > date && !dataFimInvalida && (
                      <div className="mt-2 flex items-center gap-2 rounded-lg bg-primary/10 border border-primary/20 px-3 py-2 text-sm text-primary">
                        <Moon className="h-4 w-4" />
                        <span>
                          <strong>{differenceInDays(dateFim, date)} noite(s)</strong> — {format(date, 'dd/MM', { locale: ptBR })} a {format(dateFim, 'dd/MM', { locale: ptBR })}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="adultos">Adultos</Label>
                        <Input
                          id="adultos"
                          type="number"
                          min={0}
                          value={adultos}
                          onChange={e => setAdultos(Math.max(0, parseInt(e.target.value) || 0))}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="criancas">Crianças</Label>
                        <Input
                          id="criancas"
                          type="number"
                          min={0}
                          value={criancas}
                          onChange={e => setCriancas(Math.max(0, parseInt(e.target.value) || 0))}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">Aviso: limite máximo de visita por período.</p>
                    <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
                      <span className="text-muted-foreground">Total selecionado:</span> <strong>{quantidade} pessoa(s)</strong>
                    </div>
                    {excedeLimite && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Excede a capacidade restante ({vagasRestantes})
                      </p>
                    )}
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-3">
                    {quiosques.length > 0 && selectedAtrativo && (
                      <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-foreground flex items-center gap-2">
                            <Flame className="h-4 w-4 text-orange-500" />
                            Escolha um Quiosque <span className="text-muted-foreground font-normal">(opcional)</span>
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {disponiveisQuiosques.length} disponível(is)
                          </span>
                        </div>

                        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
                          {Array.from({ length: (maxY + 1) * cols }).map((_, idx) => {
                            const x = idx % cols;
                            const y = Math.floor(idx / cols);
                            const q = quiosques.find(qi => qi.posicao_x === x && qi.posicao_y === y);
                            if (!q) return <div key={idx} />;

                            const normalizedStatus = normalizeQuiosqueStatus(q.status);
                            const isDisponivel = normalizedStatus === 'disponivel';
                            const isSelected = selectedQuiosque === q.id;

                            return (
                              <Tooltip key={q.id}>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    disabled={!isDisponivel}
                                    onClick={() => setSelectedQuiosque(prev => prev === q.id ? null : q.id)}
                                    className={`rounded-lg border-2 p-2 sm:p-3 flex flex-col items-center justify-center gap-0.5 transition-all min-h-[70px] text-xs ${
                                      isSelected
                                        ? 'border-primary bg-primary/15 ring-2 ring-primary shadow-md'
                                        : isDisponivel
                                        ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 cursor-pointer'
                                        : 'border-border bg-muted/60 opacity-50 cursor-not-allowed'
                                    }`}
                                  >
                                    <span className="font-bold text-foreground">Q{q.numero}</span>
                                    {q.tem_churrasqueira && <Flame className="h-3.5 w-3.5 text-orange-500" />}
                                    <span className={`text-[10px] ${isDisponivel ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                                      {isDisponivel
                                        ? (isSelected ? '✓ Selecionado' : 'Disponível')
                                        : normalizedStatus === 'reservado'
                                          ? 'Reservado'
                                          : normalizedStatus === 'ocupado'
                                            ? 'Ocupado'
                                            : normalizedStatus === 'bloqueado'
                                              ? 'Bloqueado'
                                              : normalizedStatus === 'inativo'
                                                ? 'Inativo'
                                                : 'Em Manutenção'}
                                    </span>
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Quiosque {q.numero}</p>
                                  <p>{q.tem_churrasqueira ? '🔥 Com churrasqueira' : 'Sem churrasqueira'}</p>
                                  <p>{isDisponivel ? 'Clique para selecionar' : 'Indisponível'}</p>
                                </TooltipContent>
                              </Tooltip>
                            );
                          })}
                        </div>

                        {selectedQ && (
                          <div className="mt-2 p-2 rounded-lg bg-primary/10 border border-primary/20 text-sm flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                            <span className="text-foreground">
                              Quiosque <strong>Q{selectedQ.numero}</strong> selecionado
                              {selectedQ.tem_churrasqueira && ' · 🔥 Com churrasqueira'}
                            </span>
                            <Button variant="ghost" size="sm" className="ml-auto h-6 text-xs" onClick={() => setSelectedQuiosque(null)}>
                              Remover
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="space-y-1">
                      <Label htmlFor="nome">Nome completo</Label>
                      <Input id="nome" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} required />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="celular">Celular (para confirmação via SMS/Whatsapp)</Label>
                      <Input
                        id="celular"
                        value={form.celular}
                        onChange={e => setForm(f => ({ ...f, celular: formatBrazilPhone(e.target.value) }))}
                        placeholder="(65) 99999-9999"
                        inputMode="numeric"
                        maxLength={15}
                        required
                      />
                      {form.celular.length > 0 && celularDigits.length < 11 && (
                        <p className="text-xs text-destructive">Informe um celular válido com DDD + 9 dígitos.</p>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2 space-y-1">
                        <Label htmlFor="cidade">Cidade</Label>
                        <Input id="cidade" value={form.cidade} onChange={e => setForm(f => ({ ...f, cidade: e.target.value }))} required />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="uf">UF</Label>
                        <Input id="uf" value={form.uf} onChange={e => setForm(f => ({ ...f, uf: e.target.value }))} maxLength={2} required />
                      </div>
                    </div>
                    <div className="flex items-start gap-2 pt-2">
                      <Checkbox
                        id="lgpd"
                        checked={lgpdAccepted}
                        onCheckedChange={(checked) => setLgpdAccepted(checked === true)}
                      />
                      <Label htmlFor="lgpd" className="text-xs text-muted-foreground leading-tight cursor-pointer">
                        Li e concordo com a Política de Privacidade. Seus dados serão utilizados exclusivamente para gestão da visita.
                      </Label>
                    </div>

                    <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground space-y-1">
                      <p><strong className="text-foreground">Política de privacidade</strong></p>
                      <p><strong className="text-foreground">Consentimento de uso de dados</strong></p>
                      <p><strong className="text-foreground">Informação de segurança</strong></p>
                      <p>Seus dados são usados apenas para esta reserva e não serão compartilhados.</p>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  {step > 1 && (
                    <Button type="button" variant="outline" className="flex-1" onClick={() => setStep((s) => Math.max(1, s - 1) as 1 | 2 | 3)}>
                      Voltar
                    </Button>
                  )}
                  {step < 3 && (
                    <Button
                      type="button"
                      className="flex-1"
                      onClick={() => {
                        if (step === 1 && !step1Valid) return;
                        if (step === 2 && !step2Valid) return;
                        setStep((s) => Math.min(3, s + 1) as 1 | 2 | 3);
                      }}
                      disabled={(step === 1 && !step1Valid) || (step === 2 && !step2Valid)}
                    >
                      Próximo
                    </Button>
                  )}
                  {step === 3 && (
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={loading || !step1Valid || !step2Valid || !step3Valid}
                    >
                      <CalendarCheck className="mr-2 h-4 w-4" />
                      {loading ? 'Processando...' : 'Confirmar Reserva'}
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Informações de apoio */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-heading">Informações importantes</CardTitle>
            <CardDescription>Expanda os tópicos para ver os detalhes da visita e cancelamento.</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="incluso">
                <AccordionTrigger>O que está incluso na visita</AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Monitoria ambiental para orientar boas práticas no atrativo.</li>
                    <li>• QR Code para acesso e validação rápida na entrada.</li>
                    <li>• Suporte local da equipe responsável pelo atrativo.</li>
                    <li>• Registro da visita para controle de capacidade e segurança.</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="cancelamento">
                <AccordionTrigger>Política de cancelamento</AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Cancelamento pode ser solicitado pelo canal oficial do município.</li>
                    <li>• Remarcação conforme disponibilidade do período e capacidade do atrativo.</li>
                    <li>• Em caso de indisponibilidade operacional, a equipe orienta nova data.</li>
                    <li>• Apresente o token/QR Code para agilizar atendimento e alterações.</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


