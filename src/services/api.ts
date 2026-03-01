/**
 * Camada de serviço modular.
 * Atualmente retorna dados mock. Para integrar com o backend .NET,
 * basta substituir os retornos por chamadas fetch reais.
 */
import {
  municipios,
} from '@/data/mock-data';

import {
  apiClient,
  type DashboardDto,
  type Atrativo,
  type ListAtrativosRequest,
  type QuiosqueDto,
  type AtualizarQuiosqueRequest,
  type CriarQuiosqueRequest,
  type AtualizarPosicaoQuiosqueRequest,
} from "@/services/apiClient";

import type { DashboardData } from '@/types/dashboard';
import type { Reserva, Municipio, AtrativoDetalheData } from '@/data/mock-data';

// Dashboard consome endpoint real via apiClient.obterDashboard.
export type { DashboardData, Atrativo, Reserva, Municipio, AtrativoDetalheData };

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function n(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function s(value: unknown, fallback = ''): string {
  const parsed = String(value ?? '').trim();
  return parsed || fallback;
}

function trend(value: unknown): 'up' | 'down' | 'stable' {
  const v = s(value, 'stable').toLowerCase();
  if (v === 'up' || v === 'down' || v === 'stable') return v;
  return 'stable';
}

function pressao(value: unknown): 'baixa' | 'moderada' | 'alta' | 'critica' {
  const v = s(value, 'baixa').toLowerCase();
  if (v === 'baixa' || v === 'moderada' || v === 'alta' || v === 'critica') return v;
  return 'baixa';
}

function mapDashboardDto(dto: DashboardDto): DashboardData {
  const visitantesPorDia = (dto.visitantesPorDia ?? dto.VisitantesPorDia ?? []).map((p) => ({
    dia: s(p?.label ?? p?.Label),
    visitantes: n(p?.valor ?? p?.Valor),
  }));

  const ocupacaoPorBalneario = (dto.ocupacaoPorBalneario ?? dto.OcupacaoPorBalneario ?? []).map((p) => ({
    nome: s(p?.nome ?? p?.Nome),
    ocupacao: n(p?.ocupacao ?? p?.Ocupacao),
    capacidade: n(p?.capacidade ?? p?.Capacidade),
  }));

  const origemPorUF = (dto.origemPorUF ?? dto.OrigemPorUF ?? []).map((p) => ({
    uf: s(p?.uf ?? p?.Uf),
    quantidade: n(p?.quantidade ?? p?.Quantidade),
  }));

  const evolucaoMensal = (dto.evolucaoMensal ?? dto.EvolucaoMensal ?? []).map((p) => ({
    mes: s(p?.label ?? p?.Label),
    visitantes: n(p?.valor ?? p?.Valor),
  }));

  const topAtrativos = (dto.topAtrativos ?? dto.TopAtrativos ?? []).map((p) => ({
    nome: s(p?.nome ?? p?.Nome),
    visitantes: n(p?.visitantes ?? p?.Visitantes),
    tendencia: trend(p?.tendencia ?? p?.Tendencia),
  }));

  return {
    visitantesHoje: n(dto.visitantesHoje ?? dto.VisitantesHoje),
    visitantesTendencia: trend(dto.visitantesTendencia ?? dto.VisitantesTendencia),
    permanenciaMedia: n(dto.permanenciaMedia ?? dto.PermanenciaMedia),
    ocupacaoMedia: n(dto.ocupacaoMedia ?? dto.OcupacaoMedia),
    pressaoTuristica: pressao(dto.pressaoTuristica ?? dto.PressaoTuristica),
    visitantesPorDia,
    ocupacaoPorBalneario,
    origemPorUF,
    evolucaoMensal,
    topAtrativos,
  };
}

// Dashboard
export async function fetchDashboard(periodo: string = '7d'): Promise<DashboardData> {
  const p = (periodo === '30d' || periodo === '6m' || periodo === '7d' ? periodo : '7d') as '7d' | '30d' | '6m';
  const dto = await apiClient.obterDashboard(p);
  return mapDashboardDto(dto);
}

// Atrativos
export async function fetchAtrativos(request: ListAtrativosRequest = {}): Promise<Atrativo[]> {
  return apiClient.listarAtrativos(request);
}

export async function fetchAtrativo(id: string): Promise<Atrativo | undefined> {
  return apiClient.obterAtrativo(id);
}

export async function atualizarAtrativo(id: string, body: Partial<Atrativo>): Promise<void> {
  return apiClient.atualizarAtrativo(id, body);
}

export async function fetchQuiosques(atrativoId: string): Promise<QuiosqueDto[]> {
  return apiClient.listarQuiosques(atrativoId);
}

export async function criarQuiosque(body: CriarQuiosqueRequest): Promise<QuiosqueDto> {
  return apiClient.criarQuiosque(body);
}

export async function atualizarQuiosque(id: string, body: AtualizarQuiosqueRequest): Promise<void> {
  return apiClient.atualizarQuiosque(id, body);
}

export async function atualizarPosicaoQuiosque(id: string, body: AtualizarPosicaoQuiosqueRequest): Promise<void> {
  return apiClient.atualizarPosicaoQuiosque(id, body);
}

export async function excluirQuiosque(id: string): Promise<void> {
  return apiClient.excluirQuiosque(id);
}

// Reservas
function mapReservaDtoToReserva(dto: any): Reserva {
  return {
    id: dto.id,
    atrativoId: dto.atrativoId ?? dto.atrativo_id ?? '',
    nomeVisitante: dto.nomeVisitante ?? dto.nome_visitante ?? '',
    email: dto.email ?? '',
    cpf: dto.cpf ?? '',
    cidadeOrigem: dto.cidadeOrigem ?? dto.cidade_origem ?? '',
    ufOrigem: dto.ufOrigem ?? dto.uf_origem ?? '',
    tipo: dto.tipo ?? 'day_use',
    data: dto.data ?? new Date().toISOString().split('T')[0],
    status: dto.status ?? 'confirmada',
    token: dto.token ?? '',
    createdAt: dto.createdAt ?? dto.created_at ?? new Date().toISOString().split('T')[0],
  };
}

export async function fetchReservas(): Promise<Reserva[]> {
  const data = await apiClient.listarReservas();
  return data.map(mapReservaDtoToReserva);
}

export async function criarReserva(data: Omit<Reserva, 'id' | 'token' | 'createdAt' | 'status'>): Promise<Reserva> {
  const created = await apiClient.criarReserva({
    atrativoId: data.atrativoId,
    nomeVisitante: data.nomeVisitante,
    email: data.email,
    cpf: data.cpf,
    cidadeOrigem: data.cidadeOrigem,
    ufOrigem: data.ufOrigem,
    tipo: data.tipo,
    data: data.data,
  });
  return mapReservaDtoToReserva(created);
}

export async function validarTicket(token: string, atrativoId?: string | null): Promise<{ valido: boolean; reserva?: Reserva }> {
  const response = await apiClient.validarTicket({ Token: token, AtrativoId: atrativoId ?? null });
  const valido = response.valido ?? response.isValid ?? Boolean((response as any).reserva ?? (response as any).id);
  const reservaLike = (response as any).reserva ?? response;

  if (!valido || !reservaLike?.id) {
    return { valido: false };
  }

  return {
    valido: true,
    reserva: mapReservaDtoToReserva(reservaLike),
  };
}

// Municípios
export async function fetchMunicipios(): Promise<Municipio[]> {
  await delay(200);
  return municipios;
}
