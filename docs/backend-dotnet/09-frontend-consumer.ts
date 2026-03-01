// ============================================================
// src/services/api.ts — Consumer para o backend .NET
// ============================================================
// Substitua o conteúdo atual de src/services/api.ts por este arquivo
// quando o backend .NET estiver pronto.
// ============================================================

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ─── Helper para requests ───

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('eco_token');

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }

  if (res.status === 204) return {} as T;
  return res.json();
}

// ─── Tipos (mantidos compatíveis com o frontend atual) ───

export interface User {
  id: string;
  nome: string;
  email: string;
  role: 'admin' | 'prefeitura' | 'balneario' | 'publico';
  municipioId: string | null;
  atrativoId: string | null;
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
  tipo: 'balneario' | 'cachoeira' | 'trilha' | 'parque' | 'camping';
  municipioId: string;
  capacidadeMaxima: number;
  ocupacaoAtual: number;
  status: 'ativo' | 'inativo' | 'manutencao';
  descricao: string | null;
  imagem: string | null;
}

export interface Reserva {
  id: string;
  atrativoId: string;
  quiosqueId: string | null;
  nomeVisitante: string;
  email: string;
  cpf: string;
  cidadeOrigem: string;
  ufOrigem: string;
  tipo: 'day_use' | 'camping';
  data: string;
  dataFim: string | null;
  quantidadePessoas: number;
  status: 'confirmada' | 'cancelada' | 'utilizada';
  token: string;
  createdAt: string;
}

export interface Quiosque {
  id: string;
  atrativoId: string | null;
  numero: number;
  temChurrasqueira: boolean;
  status: 'disponivel' | 'reservado' | 'ocupado' | 'manutencao';
  posicaoX: number;
  posicaoY: number;
}

export interface Banner {
  id: string;
  titulo: string | null;
  subtitulo: string | null;
  imagemUrl: string;
  link: string | null;
  ordem: number;
  ativo: boolean;
}

export interface Configuracao {
  chave: string;
  valor: string | null;
}

export interface DashboardData {
  visitantesHoje: number;
  visitantesTendencia: string;
  permanenciaMedia: number;
  ocupacaoMedia: number;
  pressaoTuristica: string;
  visitantesPorDia: { label: string; valor: number }[];
  ocupacaoPorBalneario: { nome: string; ocupacao: number; capacidade: number }[];
  origemPorUF: { uf: string; quantidade: number }[];
  evolucaoMensal: { label: string; valor: number }[];
  topAtrativos: { nome: string; visitantes: number; tendencia: string }[];
}

// ─── Auth ───

export async function login(email: string, senha: string): Promise<{
  token: string;
  user: User;
} | null> {
  try {
    const data = await request<{
      token: string;
      nome: string;
      email: string;
      role: string;
      municipioId: string | null;
      atrativoId: string | null;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, senha }),
    });

    localStorage.setItem('eco_token', data.token);

    // Decodificar JWT para obter o ID
    const payload = JSON.parse(atob(data.token.split('.')[1]));

    const user: User = {
      id: payload.nameid || payload.sub,
      nome: data.nome,
      email: data.email,
      role: data.role as User['role'],
      municipioId: data.municipioId,
      atrativoId: data.atrativoId,
    };

    return { token: data.token, user };
  } catch {
    return null;
  }
}

export function logout() {
  localStorage.removeItem('eco_token');
}

export function getStoredToken(): string | null {
  return localStorage.getItem('eco_token');
}

// ─── Municípios ───

export async function fetchMunicipios(): Promise<Municipio[]> {
  return request<Municipio[]>('/municipios');
}

// ─── Atrativos ───

export async function fetchAtrativos(municipioId?: string): Promise<Atrativo[]> {
  const query = municipioId ? `?municipioId=${municipioId}` : '';
  return request<Atrativo[]>(`/atrativos${query}`);
}

export async function fetchAtrativo(id: string): Promise<Atrativo> {
  return request<Atrativo>(`/atrativos/${id}`);
}

export async function updateAtrativo(
  id: string,
  data: Partial<Atrativo>
): Promise<Atrativo> {
  return request<Atrativo>(`/atrativos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// ─── Reservas ───

export async function fetchReservas(atrativoId?: string): Promise<Reserva[]> {
  const query = atrativoId ? `?atrativoId=${atrativoId}` : '';
  return request<Reserva[]>(`/reservas${query}`);
}

export async function criarReserva(data: {
  atrativoId: string;
  quiosqueId?: string;
  nomeVisitante: string;
  email: string;
  cpf: string;
  cidadeOrigem: string;
  ufOrigem: string;
  tipo: string;
  data: string;
  dataFim?: string;
  quantidadePessoas: number;
}): Promise<Reserva> {
  return request<Reserva>('/reservas', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function atualizarStatusReserva(
  id: string,
  status: string
): Promise<void> {
  await request(`/reservas/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

// ─── Validações ───

export async function validarTicket(
  token: string,
  atrativoId?: string
): Promise<{ valido: boolean; reserva?: Reserva; mensagem?: string }> {
  return request('/validacoes', {
    method: 'POST',
    body: JSON.stringify({ token, atrativoId }),
  });
}

// ─── Quiosques ───

export async function fetchQuiosques(atrativoId?: string): Promise<Quiosque[]> {
  const query = atrativoId ? `?atrativoId=${atrativoId}` : '';
  return request<Quiosque[]>(`/quiosques${query}`);
}

export async function criarQuiosque(data: {
  numero: number;
  temChurrasqueira: boolean;
  atrativoId: string;
  posicaoX: number;
  posicaoY: number;
}): Promise<Quiosque> {
  return request<Quiosque>('/quiosques', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function atualizarQuiosque(
  id: string,
  data: Partial<Quiosque>
): Promise<Quiosque> {
  return request<Quiosque>(`/quiosques/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function excluirQuiosque(id: string): Promise<void> {
  await request(`/quiosques/${id}`, { method: 'DELETE' });
}

// ─── Banners ───

export async function fetchBanners(apenasAtivos = true): Promise<Banner[]> {
  return request<Banner[]>(`/banners?apenasAtivos=${apenasAtivos}`);
}

export async function fetchBanner(id: string): Promise<Banner> {
  return request<Banner>(`/banners/${id}`);
}

export async function criarBanner(data: {
  imagemUrl: string;
  titulo?: string;
  subtitulo?: string;
  link?: string;
  ordem?: number;
  ativo?: boolean;
}): Promise<Banner> {
  return request<Banner>('/banners', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function atualizarBanner(
  id: string,
  data: Partial<Banner>
): Promise<Banner> {
  return request<Banner>(`/banners/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function reordenarBanners(
  itens: { id: string; ordem: number }[]
): Promise<void> {
  await request('/banners/reorder', {
    method: 'PUT',
    body: JSON.stringify({ itens }),
  });
}

export async function excluirBanner(id: string): Promise<void> {
  await request(`/banners/${id}`, { method: 'DELETE' });
}

// ─── Configurações ───

export async function fetchConfiguracoes(): Promise<Configuracao[]> {
  return request<Configuracao[]>('/configuracoes');
}

export async function atualizarConfiguracoes(
  configs: Configuracao[]
): Promise<void> {
  await request('/configuracoes', {
    method: 'PUT',
    body: JSON.stringify({ configs }),
  });
}

// ─── Dashboard ───

export async function fetchDashboard(periodo = '7d'): Promise<DashboardData> {
  return request<DashboardData>(`/dashboard?periodo=${periodo}`);
}

// ─── Profile ───

export async function fetchMyProfile(): Promise<User> {
  return request<User>('/profiles/me');
}
