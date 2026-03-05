// ============ TIPOS ============
export interface User {
  id: string;
  nome: string;
  email: string;
  role: 'admin' | 'prefeitura' | 'balneario' | 'publico';
  municipioId: string;
  atrativoId?: string;
}

export interface Municipio {
  id: string;
  nome: string;
  uf: string;
  logo?: string;
}

export interface Atrativo {
  id: string;
  nome: string;
  tipo: 'balneario' | 'cachoeira' | 'trilha' | 'parque' | 'fazenda-ecoturismo';
  municipioId: string;
  capacidadeMaxima: number;
  ocupacaoAtual: number;
  status: 'ativo' | 'inativo' | 'manutencao';
  descricao: string;
  imagem?: string;
}

export interface Reserva {
  id: string;
  atrativoId: string;
  nomeVisitante: string;
  email: string;
  cpf: string;
  cidadeOrigem: string;
  ufOrigem: string;
  tipo: 'day_use' | 'camping';
  data: string;
  status: 'confirmada' | 'cancelada' | 'utilizada';
  token: string;
  createdAt: string;
}

export interface AtrativoDetalheData {
  ocupacaoHistorica: { mes: string; ocupacao: number; capacidade: number }[];
  visitantesPorHora: { hora: string; visitantes: number }[];
  heatmapMensal: { dia: number; ocupacao: number }[]; // 1-28/30/31
  satisfacao: { nota: string; quantidade: number }[];
}

export interface DashboardData {
  visitantesHoje: number;
  visitantesTendencia: 'up' | 'down' | 'stable';
  permanenciaMedia: number;
  ocupacaoMedia: number;
  pressaoTuristica: 'baixa' | 'moderada' | 'alta' | 'critica';
  visitantesPorDia: { dia: string; visitantes: number }[];
  ocupacaoPorBalneario: { nome: string; ocupacao: number; capacidade: number }[];
  origemPorUF: { uf: string; quantidade: number }[];
  evolucaoMensal: { mes: string; visitantes: number }[];
  topAtrativos: { nome: string; visitantes: number; tendencia: 'up' | 'down' | 'stable' }[];
}

// ============ DADOS MOCK ============

export const municipios: Municipio[] = [
  { id: '1', nome: 'Rio Verde de Mato Grosso', uf: 'MS' },
  { id: '2', nome: 'Alto Paraíso', uf: 'GO' },
];

export const usuarios: User[] = [
  { id: '1', nome: 'Carlos Admin', email: 'admin@eco.gov.br', role: 'admin', municipioId: '1' },
  { id: '2', nome: 'Maria Gestora', email: 'prefeitura@eco.gov.br', role: 'prefeitura', municipioId: '1' },
  { id: '3', nome: 'João Operador', email: 'balneario@eco.gov.br', role: 'balneario', municipioId: '1', atrativoId: '1' },
];

export const atrativos: Atrativo[] = [
  { id: '1', nome: 'Balneário Rio da Prata', tipo: 'balneario', municipioId: '1', capacidadeMaxima: 200, ocupacaoAtual: 145, status: 'ativo', descricao: 'Águas cristalinas com flutuação e mergulho.' },
  { id: '2', nome: 'Cachoeira Boca da Onça', tipo: 'cachoeira', municipioId: '1', capacidadeMaxima: 150, ocupacaoAtual: 42, status: 'ativo', descricao: 'A maior cachoeira do estado com trilhas ecológicas.' },
  { id: '3', nome: 'Balneário Municipal', tipo: 'balneario', municipioId: '1', capacidadeMaxima: 300, ocupacaoAtual: 280, status: 'ativo', descricao: 'Área de lazer com piscinas naturais e estrutura completa.' },
  { id: '4', nome: 'Trilha do Cerrado', tipo: 'trilha', municipioId: '1', capacidadeMaxima: 50, ocupacaoAtual: 12, status: 'ativo', descricao: 'Caminhada guiada pela vegetação nativa do cerrado.' },
  { id: '5', nome: 'Parque das Águas', tipo: 'parque', municipioId: '1', capacidadeMaxima: 100, ocupacaoAtual: 0, status: 'manutencao', descricao: 'Parque ecológico em manutenção temporária.' },
];

export const reservas: Reserva[] = [
  { id: '1', atrativoId: '1', nomeVisitante: 'Ana Silva', email: 'ana@email.com', cpf: '123.456.789-00', cidadeOrigem: 'Campo Grande', ufOrigem: 'MS', tipo: 'day_use', data: '2026-02-23', status: 'confirmada', token: 'ECO-A1B2C3', createdAt: '2026-02-20' },
  { id: '2', atrativoId: '1', nomeVisitante: 'Pedro Santos', email: 'pedro@email.com', cpf: '987.654.321-00', cidadeOrigem: 'São Paulo', ufOrigem: 'SP', tipo: 'day_use', data: '2026-02-23', status: 'utilizada', token: 'ECO-D4E5F6', createdAt: '2026-02-19' },
  { id: '3', atrativoId: '3', nomeVisitante: 'Lucia Ferreira', email: 'lucia@email.com', cpf: '456.789.123-00', cidadeOrigem: 'Cuiabá', ufOrigem: 'MT', tipo: 'camping', data: '2026-02-23', status: 'confirmada', token: 'ECO-G7H8I9', createdAt: '2026-02-21' },
  { id: '4', atrativoId: '2', nomeVisitante: 'Roberto Lima', email: 'roberto@email.com', cpf: '321.654.987-00', cidadeOrigem: 'Goiânia', ufOrigem: 'GO', tipo: 'day_use', data: '2026-02-24', status: 'confirmada', token: 'ECO-J1K2L3', createdAt: '2026-02-22' },
];

export const dashboardDataByPeriod: Record<string, DashboardData> = {
  '7d': {
    visitantesHoje: 479,
    visitantesTendencia: 'up',
    permanenciaMedia: 4.2,
    ocupacaoMedia: 72,
    pressaoTuristica: 'moderada',
    visitantesPorDia: [
      { dia: 'Seg', visitantes: 320 },
      { dia: 'Ter', visitantes: 290 },
      { dia: 'Qua', visitantes: 350 },
      { dia: 'Qui', visitantes: 410 },
      { dia: 'Sex', visitantes: 520 },
      { dia: 'Sáb', visitantes: 680 },
      { dia: 'Dom', visitantes: 479 },
    ],
    ocupacaoPorBalneario: [
      { nome: 'Rio da Prata', ocupacao: 145, capacidade: 200 },
      { nome: 'Boca da Onça', ocupacao: 42, capacidade: 150 },
      { nome: 'Balneário Municipal', ocupacao: 280, capacidade: 300 },
      { nome: 'Trilha Cerrado', ocupacao: 12, capacidade: 50 },
    ],
    origemPorUF: [
      { uf: 'MS', quantidade: 180 },
      { uf: 'SP', quantidade: 120 },
      { uf: 'GO', quantidade: 65 },
      { uf: 'MT', quantidade: 48 },
      { uf: 'PR', quantidade: 35 },
      { uf: 'MG', quantidade: 31 },
    ],
    evolucaoMensal: [
      { mes: 'Set', visitantes: 2100 },
      { mes: 'Out', visitantes: 2800 },
      { mes: 'Nov', visitantes: 3500 },
      { mes: 'Dez', visitantes: 5200 },
      { mes: 'Jan', visitantes: 6800 },
      { mes: 'Fev', visitantes: 4900 },
    ],
    topAtrativos: [
      { nome: 'Balneário Municipal', visitantes: 280, tendencia: 'up' },
      { nome: 'Rio da Prata', visitantes: 145, tendencia: 'stable' },
      { nome: 'Boca da Onça', visitantes: 42, tendencia: 'down' },
      { nome: 'Trilha do Cerrado', visitantes: 12, tendencia: 'up' },
    ],
  },
  '30d': {
    visitantesHoje: 479,
    visitantesTendencia: 'stable',
    permanenciaMedia: 3.8,
    ocupacaoMedia: 65,
    pressaoTuristica: 'moderada',
    visitantesPorDia: [
      { dia: 'Sem 1', visitantes: 2150 },
      { dia: 'Sem 2', visitantes: 1980 },
      { dia: 'Sem 3', visitantes: 2420 },
      { dia: 'Sem 4', visitantes: 2890 },
    ],
    ocupacaoPorBalneario: [
      { nome: 'Rio da Prata', ocupacao: 128, capacidade: 200 },
      { nome: 'Boca da Onça', ocupacao: 65, capacidade: 150 },
      { nome: 'Balneário Municipal', ocupacao: 245, capacidade: 300 },
      { nome: 'Trilha Cerrado', ocupacao: 22, capacidade: 50 },
    ],
    origemPorUF: [
      { uf: 'MS', quantidade: 720 },
      { uf: 'SP', quantidade: 510 },
      { uf: 'GO', quantidade: 280 },
      { uf: 'MT', quantidade: 195 },
      { uf: 'PR', quantidade: 140 },
      { uf: 'MG', quantidade: 105 },
    ],
    evolucaoMensal: [
      { mes: 'Set', visitantes: 2100 },
      { mes: 'Out', visitantes: 2800 },
      { mes: 'Nov', visitantes: 3500 },
      { mes: 'Dez', visitantes: 5200 },
      { mes: 'Jan', visitantes: 6800 },
      { mes: 'Fev', visitantes: 4900 },
    ],
    topAtrativos: [
      { nome: 'Balneário Municipal', visitantes: 1120, tendencia: 'up' },
      { nome: 'Rio da Prata', visitantes: 580, tendencia: 'up' },
      { nome: 'Boca da Onça', visitantes: 195, tendencia: 'stable' },
      { nome: 'Trilha do Cerrado', visitantes: 55, tendencia: 'up' },
    ],
  },
  '6m': {
    visitantesHoje: 479,
    visitantesTendencia: 'up',
    permanenciaMedia: 4.0,
    ocupacaoMedia: 68,
    pressaoTuristica: 'alta',
    visitantesPorDia: [
      { dia: 'Set', visitantes: 2100 },
      { dia: 'Out', visitantes: 2800 },
      { dia: 'Nov', visitantes: 3500 },
      { dia: 'Dez', visitantes: 5200 },
      { dia: 'Jan', visitantes: 6800 },
      { dia: 'Fev', visitantes: 4900 },
    ],
    ocupacaoPorBalneario: [
      { nome: 'Rio da Prata', ocupacao: 165, capacidade: 200 },
      { nome: 'Boca da Onça', ocupacao: 88, capacidade: 150 },
      { nome: 'Balneário Municipal', ocupacao: 260, capacidade: 300 },
      { nome: 'Trilha Cerrado', ocupacao: 35, capacidade: 50 },
    ],
    origemPorUF: [
      { uf: 'MS', quantidade: 4320 },
      { uf: 'SP', quantidade: 3060 },
      { uf: 'GO', quantidade: 1680 },
      { uf: 'MT', quantidade: 1170 },
      { uf: 'PR', quantidade: 840 },
      { uf: 'MG', quantidade: 630 },
    ],
    evolucaoMensal: [
      { mes: 'Set', visitantes: 2100 },
      { mes: 'Out', visitantes: 2800 },
      { mes: 'Nov', visitantes: 3500 },
      { mes: 'Dez', visitantes: 5200 },
      { mes: 'Jan', visitantes: 6800 },
      { mes: 'Fev', visitantes: 4900 },
    ],
    topAtrativos: [
      { nome: 'Balneário Municipal', visitantes: 6720, tendencia: 'up' },
      { nome: 'Rio da Prata', visitantes: 3480, tendencia: 'up' },
      { nome: 'Boca da Onça', visitantes: 1170, tendencia: 'down' },
      { nome: 'Trilha do Cerrado', visitantes: 330, tendencia: 'up' },
    ],
  },
};

// Keep backward compat
export const dashboardData: DashboardData = dashboardDataByPeriod['7d'];

// Dados de detalhe por atrativo (mock genérico reutilizado)
export const atrativoDetalheData: AtrativoDetalheData = {
  ocupacaoHistorica: [
    { mes: 'Set', ocupacao: 55, capacidade: 100 },
    { mes: 'Out', ocupacao: 68, capacidade: 100 },
    { mes: 'Nov', ocupacao: 74, capacidade: 100 },
    { mes: 'Dez', ocupacao: 92, capacidade: 100 },
    { mes: 'Jan', ocupacao: 97, capacidade: 100 },
    { mes: 'Fev', ocupacao: 72, capacidade: 100 },
  ],
  visitantesPorHora: [
    { hora: '06h', visitantes: 5 },
    { hora: '08h', visitantes: 25 },
    { hora: '10h', visitantes: 62 },
    { hora: '12h', visitantes: 48 },
    { hora: '14h', visitantes: 71 },
    { hora: '16h', visitantes: 38 },
    { hora: '18h', visitantes: 12 },
  ],
  heatmapMensal: Array.from({ length: 28 }, (_, i) => ({
    dia: i + 1,
    ocupacao: Math.round(20 + Math.random() * 80),
  })),
  satisfacao: [
    { nota: 'Excelente', quantidade: 48 },
    { nota: 'Bom', quantidade: 30 },
    { nota: 'Regular', quantidade: 15 },
    { nota: 'Ruim', quantidade: 7 },
  ],
};
