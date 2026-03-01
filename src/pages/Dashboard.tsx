import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { fetchDashboard, type DashboardData } from '@/services/api';
import { Users, Clock, Percent, AlertTriangle, TrendingUp, TrendingDown, Minus, CalendarDays, Info } from 'lucide-react';
import { Tooltip as UITooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useLGPD } from '@/hooks/useLGPD';
import { LGPDBadge, LGPDBanner } from '@/components/LGPDBadge';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
} from 'recharts';

const CHART_COLORS = [
  'hsl(120, 56%, 24%)',   // primary green
  'hsl(204, 98%, 37%)',   // water blue
  'hsl(45, 100%, 51%)',   // warning yellow
  'hsl(120, 40%, 35%)',   // secondary green
  'hsl(0, 84%, 60%)',     // destructive
  'hsl(120, 40%, 80%)',   // nature light
];

function TrendIcon({ trend }: { trend: 'up' | 'down' | 'stable' }) {
  if (trend === 'up') return <TrendingUp className="h-4 w-4 text-success" />;
  if (trend === 'down') return <TrendingDown className="h-4 w-4 text-destructive" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

function PressaoBadge({ nivel }: { nivel: string }) {
  const map: Record<string, { label: string; className: string }> = {
    baixa: { label: 'Baixa', className: 'bg-success text-success-foreground' },
    moderada: { label: 'Moderada', className: 'bg-warning text-warning-foreground' },
    alta: { label: 'Alta', className: 'bg-destructive/80 text-destructive-foreground' },
    critica: { label: 'Crítica', className: 'bg-destructive text-destructive-foreground' },
  };
  const { label, className } = map[nivel] || map.baixa;
  return <Badge className={className}>{label}</Badge>;
}

type Periodo = '7d' | '30d' | '6m';

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState<Periodo>('7d');
  const { isPrefeitura } = useLGPD();

  useEffect(() => {
    setLoading(true);
    fetchDashboard(periodo).then(d => { setData(d); setLoading(false); });
  }, [periodo]);

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-heading font-bold">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <h1 className="text-xl sm:text-2xl font-heading font-bold">Dashboard Executivo</h1>
        <div className="flex items-center gap-2 sm:gap-3">
          <ToggleGroup
            type="single"
            value={periodo}
            onValueChange={(v) => v && setPeriodo(v as Periodo)}
            size="sm"
            className="bg-muted rounded-lg p-0.5"
          >
            <ToggleGroupItem value="7d" className="text-[11px] sm:text-xs px-2 sm:px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground rounded-md">
              7 dias
            </ToggleGroupItem>
            <ToggleGroupItem value="30d" className="text-[11px] sm:text-xs px-2 sm:px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground rounded-md">
              30 dias
            </ToggleGroupItem>
            <ToggleGroupItem value="6m" className="text-[11px] sm:text-xs px-2 sm:px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground rounded-md">
              6 meses
            </ToggleGroupItem>
          </ToggleGroup>
          <PressaoBadge nivel={data.pressaoTuristica} />
          <LGPDBadge isAnonymized={isPrefeitura} />
        </div>
      </div>

      {isPrefeitura && <LGPDBanner />}


      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Visitantes Hoje</p>
                <p className="text-2xl sm:text-3xl font-heading font-bold">{data.visitantesHoje}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                  {data.visitantesTendencia === 'up' ? '+12%' : data.visitantesTendencia === 'down' ? '-8%' : '0%'} vs mês anterior
                </p>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-primary/60" />
                <TrendIcon trend={data.visitantesTendencia} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Permanência Média</p>
                <p className="text-2xl sm:text-3xl font-heading font-bold">{data.permanenciaMedia}h</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">Consolidado mensal</p>
              </div>
              <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-accent/60" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Ocupação Média</p>
                <p className="text-2xl sm:text-3xl font-heading font-bold">{data.ocupacaoMedia}%</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                  Capacidade ociosa: {100 - data.ocupacaoMedia}%
                </p>
              </div>
              <Percent className="h-6 w-6 sm:h-8 sm:w-8 text-secondary/60" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">Pressão Turística</p>
                  <UITooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[220px] text-xs">
                      Índice calculado com base na relação entre visitantes e capacidade instalada no período.
                    </TooltipContent>
                  </UITooltip>
                </div>
                <PressaoBadge nivel={data.pressaoTuristica} />
              </div>
              <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-warning/60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Visitantes por dia */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-heading">
              {periodo === '6m' ? 'Visitantes por Mês' : periodo === '30d' ? 'Visitantes por Semana' : 'Visitantes por Dia'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data.visitantesPorDia}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(120,10%,85%)" />
                <XAxis dataKey="dia" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <RechartsTooltip />
                <Line type="monotone" dataKey="visitantes" stroke={CHART_COLORS[0]} strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Ocupação por balneário */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-heading">Ocupação por Atrativo</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.ocupacaoPorBalneario}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(120,10%,85%)" />
                <XAxis dataKey="nome" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <RechartsTooltip />
                <Legend />
                <Bar dataKey="ocupacao" name="Ocupação" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
                <Bar dataKey="capacidade" name="Capacidade" fill={CHART_COLORS[5]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Origem por UF */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-heading">Origem dos Visitantes</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data.origemPorUF}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  dataKey="quantidade"
                  nameKey="uf"
                  label={({ uf, percent }) => `${uf} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {data.origemPorUF.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Atrativos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-heading">Top Atrativos em Alta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topAtrativos.map((a, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <span className="font-medium text-sm">{a.nome}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{a.visitantes} visitantes</span>
                    <TrendIcon trend={a.tendencia} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Evolução Mensal - full width */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-heading flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary/70" />
            Evolução Mensal de Visitantes
          </CardTitle>
          <span className="text-xs text-muted-foreground">Últimos 6 meses</span>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data.evolucaoMensal}>
              <defs>
                <linearGradient id="gradientVisitantes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS[0]} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={CHART_COLORS[0]} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(120,10%,85%)" />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '13px',
                }}
              />
              <Area
                type="monotone"
                dataKey="visitantes"
                stroke={CHART_COLORS[0]}
                strokeWidth={2.5}
                fill="url(#gradientVisitantes)"
                dot={{ r: 5, fill: CHART_COLORS[0], strokeWidth: 2, stroke: 'hsl(var(--background))' }}
                activeDot={{ r: 7 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
