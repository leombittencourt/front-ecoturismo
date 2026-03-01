import { forwardRef } from 'react';
import { Trees, TrendingUp, TrendingDown, Minus, Users, MapPin, BarChart3, CalendarCheck, Tent, Droplets } from 'lucide-react';

interface RelatorioData {
  mes: string;
  municipio: string;
  uf: string;
  visitantesTotal: number;
  visitantesMesAnterior: number;
  ocupacaoMedia: number;
  capacidadeOciosa: number;
  permanenciaMedia: number;
  pressaoTuristica: string;
  reservasDayUse: number;
  reservasCamping: number;
  topAtrativos: { nome: string; visitantes: number; tendencia: 'up' | 'down' | 'stable' }[];
  origemPorUF: { uf: string; quantidade: number }[];
  ocupacaoPorAtrativo: { nome: string; ocupacao: number; capacidade: number }[];
}

interface Props {
  data: RelatorioData;
}

const TendenciaIcon = ({ t }: { t: 'up' | 'down' | 'stable' }) => {
  if (t === 'up') return <TrendingUp className="h-3.5 w-3.5 text-green-600" />;
  if (t === 'down') return <TrendingDown className="h-3.5 w-3.5 text-red-500" />;
  return <Minus className="h-3.5 w-3.5 text-gray-400" />;
};

const RelatorioPreview = forwardRef<HTMLDivElement, Props>(({ data }, ref) => {
  const crescimento = data.visitantesMesAnterior > 0
    ? Math.round(((data.visitantesTotal - data.visitantesMesAnterior) / data.visitantesMesAnterior) * 100)
    : 0;
  const totalReservas = data.reservasDayUse + data.reservasCamping;

  return (
    <div
      ref={ref}
      className="bg-white text-gray-900 w-full max-w-[210mm] mx-auto"
      style={{ fontFamily: "'Open Sans', sans-serif", fontSize: '11px', lineHeight: '1.5' }}
    >
      {/* Header */}
      <div
        className="px-8 py-6 flex items-center justify-between"
        style={{ background: 'linear-gradient(135deg, #1a5c1a 0%, #2d7a2d 60%, #0369a1 100%)' }}
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
            <Trees className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-white text-xl font-bold" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              EcoTurismo
            </h1>
            <p className="text-white/80 text-xs">{data.municipio} - {data.uf}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-white/70 text-[10px] uppercase tracking-wider font-semibold">Relatório Mensal</p>
          <p className="text-white text-lg font-bold" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            {data.mes}
          </p>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="px-8 py-5 border-b border-gray-200">
        <h2 className="text-sm font-bold text-green-800 uppercase tracking-wider mb-3 flex items-center gap-2" style={{ fontFamily: "'Montserrat', sans-serif" }}>
          <BarChart3 className="h-4 w-4" />
          Sumário Executivo
        </h2>
        <p className="text-gray-700 text-[11px] leading-relaxed">
          No mês de <strong>{data.mes}</strong>, o município de <strong>{data.municipio}</strong> registrou
          {' '}<strong>{data.visitantesTotal.toLocaleString('pt-BR')}</strong> visitantes,
          {crescimento >= 0 ? ' um crescimento' : ' uma redução'} de <strong>{Math.abs(crescimento)}%</strong> em
          relação ao mês anterior. A ocupação média dos atrativos foi de <strong>{data.ocupacaoMedia}%</strong>,
          com <strong>{data.capacidadeOciosa}%</strong> de capacidade ociosa. A permanência média foi
          de <strong>{data.permanenciaMedia}h</strong> e a pressão turística é classificada
          como <strong>{data.pressaoTuristica}</strong>.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="px-8 py-5 grid grid-cols-4 gap-3 border-b border-gray-200">
        {[
          {
            label: 'Visitantes', value: data.visitantesTotal.toLocaleString('pt-BR'),
            sub: `${crescimento >= 0 ? '+' : ''}${crescimento}% vs mês anterior`,
            icon: Users, color: 'bg-green-50 text-green-700 border-green-200',
          },
          {
            label: 'Ocupação Média', value: `${data.ocupacaoMedia}%`,
            sub: `${data.capacidadeOciosa}% ociosa`,
            icon: MapPin, color: 'bg-blue-50 text-blue-700 border-blue-200',
          },
          {
            label: 'Permanência', value: `${data.permanenciaMedia}h`,
            sub: 'Consolidado mensal',
            icon: CalendarCheck, color: 'bg-amber-50 text-amber-700 border-amber-200',
          },
          {
            label: 'Pressão Turística', value: data.pressaoTuristica,
            sub: 'Índice sustentabilidade',
            icon: Droplets, color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          },
        ].map((kpi, i) => (
          <div key={i} className={`rounded-lg border p-3 ${kpi.color}`}>
            <div className="flex items-center gap-1.5 mb-1">
              <kpi.icon className="h-3.5 w-3.5" />
              <span className="text-[9px] uppercase font-semibold tracking-wide">{kpi.label}</span>
            </div>
            <p className="text-lg font-bold" style={{ fontFamily: "'Montserrat', sans-serif" }}>{kpi.value}</p>
            <p className="text-[9px] opacity-70">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Two columns: Top Atrativos + Tipo de Reserva */}
      <div className="px-8 py-5 grid grid-cols-2 gap-6 border-b border-gray-200">
        {/* Top atrativos */}
        <div>
          <h3 className="text-xs font-bold text-green-800 uppercase tracking-wider mb-3" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            Top Atrativos
          </h3>
          <div className="space-y-2">
            {data.topAtrativos.map((a, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-green-100 text-green-800 text-[10px] font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <span className="flex-1 text-[11px] font-medium truncate">{a.nome}</span>
                <span className="text-[10px] text-gray-500">{a.visitantes.toLocaleString('pt-BR')}</span>
                <TendenciaIcon t={a.tendencia} />
              </div>
            ))}
          </div>
        </div>

        {/* Tipo de reserva */}
        <div>
          <h3 className="text-xs font-bold text-green-800 uppercase tracking-wider mb-3" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            Tipo de Reserva
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <CalendarCheck className="h-4 w-4 text-green-600" />
              <div className="flex-1">
                <div className="flex justify-between text-[11px]">
                  <span className="font-medium">Day Use</span>
                  <span className="text-gray-500">{data.reservasDayUse} ({totalReservas > 0 ? Math.round((data.reservasDayUse / totalReservas) * 100) : 0}%)</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full mt-1">
                  <div
                    className="h-2 rounded-full bg-green-500"
                    style={{ width: `${totalReservas > 0 ? (data.reservasDayUse / totalReservas) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Tent className="h-4 w-4 text-blue-600" />
              <div className="flex-1">
                <div className="flex justify-between text-[11px]">
                  <span className="font-medium">Camping</span>
                  <span className="text-gray-500">{data.reservasCamping} ({totalReservas > 0 ? Math.round((data.reservasCamping / totalReservas) * 100) : 0}%)</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full mt-1">
                  <div
                    className="h-2 rounded-full bg-blue-500"
                    style={{ width: `${totalReservas > 0 ? (data.reservasCamping / totalReservas) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ocupação por Atrativo */}
      <div className="px-8 py-5 border-b border-gray-200">
        <h3 className="text-xs font-bold text-green-800 uppercase tracking-wider mb-3" style={{ fontFamily: "'Montserrat', sans-serif" }}>
          Ocupação por Atrativo
        </h3>
        <div className="space-y-2.5">
          {data.ocupacaoPorAtrativo.map((a, i) => {
            const pct = a.capacidade > 0 ? Math.round((a.ocupacao / a.capacidade) * 100) : 0;
            return (
              <div key={i}>
                <div className="flex justify-between text-[11px] mb-0.5">
                  <span className="font-medium">{a.nome}</span>
                  <span className="text-gray-500">{a.ocupacao}/{a.capacidade} ({pct}%)</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full">
                  <div
                    className={`h-3 rounded-full ${pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-green-500'}`}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Origem dos Visitantes */}
      <div className="px-8 py-5 border-b border-gray-200">
        <h3 className="text-xs font-bold text-green-800 uppercase tracking-wider mb-3" style={{ fontFamily: "'Montserrat', sans-serif" }}>
          Origem dos Visitantes por UF
        </h3>
        <div className="grid grid-cols-6 gap-2">
          {data.origemPorUF.map((o, i) => {
            const totalOrigem = data.origemPorUF.reduce((sum, x) => sum + x.quantidade, 0);
            const pct = totalOrigem > 0 ? Math.round((o.quantidade / totalOrigem) * 100) : 0;
            return (
              <div key={i} className="text-center rounded-lg bg-gray-50 border border-gray-100 py-2 px-1">
                <p className="text-xs font-bold text-green-800">{o.uf}</p>
                <p className="text-[10px] text-gray-600">{o.quantidade.toLocaleString('pt-BR')}</p>
                <p className="text-[9px] text-gray-400">{pct}%</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="px-8 py-4 flex items-center justify-between text-[9px] text-gray-400">
        <div className="flex items-center gap-2">
          <Trees className="h-3 w-3" />
          <span>EcoTurismo · {data.municipio} - {data.uf}</span>
        </div>
        <span>Gerado em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
    </div>
  );
});

RelatorioPreview.displayName = 'RelatorioPreview';

export default RelatorioPreview;
export type { RelatorioData };
