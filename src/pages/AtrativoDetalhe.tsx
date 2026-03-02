import { useEffect, useState } from 'react';
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
import { fetchAtrativo, atualizarAtrativo, type Atrativo, type AtrativoDetalheData } from '@/services/api';
import { atrativoDetalheData } from '@/data/mock-data';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft, Users, Droplets, Mountain, TreePine, Tent, MapPin,
  BarChart3, Clock, Star,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Legend,
} from 'recharts';

const COLORS = [
  'hsl(120, 56%, 24%)',
  'hsl(204, 98%, 37%)',
  'hsl(45, 100%, 51%)',
  'hsl(0, 84%, 60%)',
];

const tipoIcons: Record<string, React.ElementType> = {
  balneario: Droplets, cachoeira: Mountain, trilha: TreePine, parque: Tent,
};

function heatColor(pct: number) {
  if (pct >= 90) return 'bg-destructive';
  if (pct >= 70) return 'bg-warning';
  if (pct >= 40) return 'bg-primary/70';
  return 'bg-primary/25';
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
  const [editForm, setEditForm] = useState<{
    nome: string;
    tipo: Atrativo['tipo'];
    status: Atrativo['status'];
    descricao: string;
    capacidadeMaxima: number;
  }>({
    nome: '',
    tipo: 'balneario',
    status: 'ativo',
    descricao: '',
    capacidadeMaxima: 1,
  });
  const detalhe: AtrativoDetalheData = atrativoDetalheData;

  useEffect(() => {
    if (id) {
      fetchAtrativo(id).then(a => { setAtrativo(a ?? null); setLoading(false); });
    }
  }, [id]);

  useEffect(() => {
    if (!atrativo) return;
    setEditForm({
      nome: atrativo.nome,
      tipo: atrativo.tipo,
      status: atrativo.status,
      descricao: atrativo.descricao,
      capacidadeMaxima: atrativo.capacidadeMaxima,
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
    const capacidade = Math.max(1, Number(editForm.capacidadeMaxima) || 1);
    setSaving(true);
    try {
      await atualizarAtrativo(id, {
        nome: editForm.nome.trim(),
        tipo: editForm.tipo,
        status: editForm.status,
        descricao: editForm.descricao.trim(),
        capacidadeMaxima: capacidade,
      });

      setAtrativo((prev) => prev ? {
        ...prev,
        nome: editForm.nome.trim(),
        tipo: editForm.tipo,
        status: editForm.status,
        descricao: editForm.descricao.trim(),
        capacidadeMaxima: capacidade,
      } : prev);

      setIsEditing(false);
      toast({ title: 'Atrativo atualizado', description: 'As alterações foram salvas com sucesso.' });
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível salvar as alterações.', variant: 'destructive' });
    } finally {
      setSaving(false);
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
            <p className="text-xs sm:text-sm text-muted-foreground capitalize line-clamp-1">{atrativo.tipo} · {atrativo.descricao}</p>
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

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditing(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving || !editForm.nome.trim() || capacidadeInvalida}>
                {saving ? 'Salvando...' : 'Salvar alterações'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
