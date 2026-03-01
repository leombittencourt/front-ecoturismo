export type DashboardTrend = 'up' | 'down' | 'stable';
export type DashboardPressao = 'baixa' | 'moderada' | 'alta' | 'critica';

export interface DashboardVisitantesPorDia {
  dia: string;
  visitantes: number;
}

export interface DashboardOcupacaoPorBalneario {
  nome: string;
  ocupacao: number;
  capacidade: number;
}

export interface DashboardOrigemPorUf {
  uf: string;
  quantidade: number;
}

export interface DashboardEvolucaoMensal {
  mes: string;
  visitantes: number;
}

export interface DashboardTopAtrativo {
  nome: string;
  visitantes: number;
  tendencia: DashboardTrend;
}

export interface DashboardData {
  visitantesHoje: number;
  visitantesTendencia: DashboardTrend;
  permanenciaMedia: number;
  ocupacaoMedia: number;
  pressaoTuristica: DashboardPressao;
  visitantesPorDia: DashboardVisitantesPorDia[];
  ocupacaoPorBalneario: DashboardOcupacaoPorBalneario[];
  origemPorUF: DashboardOrigemPorUf[];
  evolucaoMensal: DashboardEvolucaoMensal[];
  topAtrativos: DashboardTopAtrativo[];
}
