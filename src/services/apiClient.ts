import { http } from "./http";
import { parseDescricaoAtrativo, type AtrativoDescricaoDetalhada } from "@/utils/atrativoDescricao";

export type LoginRequest = { email: string; password: string };

export type LoginResponse = {
  token: string;
  profile: {
    id: string;
    nome: string;
    email: string;
    role: string;
    municipioId?: string | null;
    atrativoId?: string | null;
    atrativo_id?: string | null;
    AtrativoId?: string | null;
  };
};

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
  logoTelaLogin?: string | null;
  logoAreaPublica?: string | null;
}

export interface RoleOption {
  id: string;
  nome: string;
  descricao?: string | null;
  isActive?: boolean;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export type ConfiguracoesDto = { chave: string; valor: string | null };

export interface BannerDto {
  id: string;
  titulo: string | null;
  subtitulo: string | null;
  imagemUrl?: string | null;
  imagem_url?: string | null;
  link: string | null;
  ordem: number;
  ativo?: boolean;
}

export type CriarBannerRequest = {
  imagemUrl: string;
  titulo?: string | null;
  subtitulo?: string | null;
  link?: string | null;
  ordem?: number;
  ativo?: boolean;
};

export type AtualizarBannerRequest = Partial<{
  titulo: string | null;
  subtitulo: string | null;
  link: string | null;
  ordem: number;
  ativo: boolean;
  imagemUrl: string | null;
}>;

export type ReordenarBannerRequestItem = {
  id: string;
  ordem: number;
};

export type UploadContainer = "banners" | "logos" | "atrativos";

export type UploadResultDto = {
  url: string;
  fileName?: string;
  container?: UploadContainer;
  size?: number;
};

export type UploadGenericResponse = {
  upload: UploadResultDto;
};

export type UploadBannerCreateResponse = {
  banner?: BannerDto;
  upload: UploadResultDto;
};

export type UploadBannerCreateRequest = {
  municipioId: string;
  titulo: string;
};

export type UploadLogoMunicipioResponse =
  | UploadGenericResponse
  | {
      success?: boolean;
      message?: string | null;
      municipioId?: string | null;
      municipioNome?: string | null;
      url?: string | null;
      Url?: string | null;
      base64?: string | null;
      Base64?: string | null;
      imagemBase64?: string | null;
      ImagemBase64?: string | null;
      logoTelaLogin?: string | null;
      LogoTelaLogin?: string | null;
      logoTelaPublica?: string | null;
      LogoTelaPublica?: string | null;
      mimeType?: string | null;
      MimeType?: string | null;
    };

export interface Atrativo {
  id: string;
  nome: string;
  tipo: 'balneario' | 'cachoeira' | 'trilha' | 'parque' | 'fazenda-ecoturismo';
  municipioId: string;
  capacidadeMaxima: number;
  ocupacaoAtual: number;
  status: 'ativo' | 'inativo' | 'manutencao';
  descricao: string;
  descricaoDetalhada?: AtrativoDescricaoDetalhada;
  endereco?: string;
  latitude?: number;
  longitude?: number;
  mapUrl?: string;
  placeId?: string;
  imagem?: string;
  imagens?: AtrativoImagemDto[];
}

export type CriarAtrativoRequest = {
  nome: string;
  tipo: Atrativo['tipo'];
  municipioId: string;
  capacidadeMaxima: number;
  ocupacaoAtual?: number;
  status?: Atrativo['status'];
  descricao?: string;
  endereco?: string;
  latitude?: number;
  longitude?: number;
  mapUrl?: string;
  placeId?: string;
  imagem?: string;
};

export type GeocodeSuggestionDto = {
  displayName: string;
  latitude: number;
  longitude: number;
  placeId?: string;
};

export interface AtrativoImagemDto {
  id: string;
  url: string;
  ordem: number;
  principal: boolean;
  descricao?: string | null;
}

export type UploadImagensAtrativoRequest = {
  imagens: File[];
  descricoes?: string[];
  ordens?: number[];
  principalId?: string;
};

export type ReordenarImagensAtrativoRequestItem = {
  id: string;
  ordem: number;
};

export type UploadImagensAtrativoResponse = {
  atrativoId?: string;
  atrativoNome?: string;
  totalImagens?: number;
  imagensAdicionadas?: AtrativoImagemDto[];
};

export interface QuiosqueDto {
  id: string;
  numero: number;
  status: "disponivel" | "ocupado" | "manutencao" | "bloqueado" | "inativo" | string;
  posicao_x?: number;
  posicaoX?: number;
  PosicaoX?: number;
  posicao_y?: number;
  posicaoY?: number;
  PosicaoY?: number;
  atrativo_id?: string | null;
  atrativoId?: string | null;
  tem_churrasqueira?: boolean;
  temChurrasqueira?: boolean;
}

export type CriarQuiosqueRequest = {
  numero: number;
  temChurrasqueira: boolean;
  atrativoId: string;
  posicaoX: number;
  posicaoY: number;
};

export type AtualizarQuiosqueRequest = Partial<{
  numero: number;
  status: "disponivel" | "ocupado" | "manutencao" | "bloqueado" | "inativo";
  temChurrasqueira: boolean;
  posicaoX: number;
  posicaoY: number;
}>;

export type AtualizarPosicaoQuiosqueRequest = {
  posicaoX: number;
  posicaoY: number;
};

export type AcaoAdministrativaQuiosqueRequest = {
  acao: "inativar" | "editar" | "desvincular_reservas" | "excluir";
  motivo: string;
  numero?: number;
  temChurrasqueira?: boolean;
  status?: number;
  posicaoX?: number;
  posicaoY?: number;
  desvincularReservasAtivasEFuturas?: boolean;
};

export type AcaoAdministrativaQuiosqueResponse = {
  success: boolean;
  message: string;
  acao: string;
  reservasAfetadas: number;
  quiosque?: QuiosqueDto | null;
};

export type ReservaDto = {
  id: string;
  atrativoId: string;
  nomeVisitante?: string;
  email?: string;
  cpf?: string;
  cidadeOrigem?: string;
  ufOrigem?: string;
  tipo?: 'day_use' | 'camping';
  data?: string;
  dataFim?: string | null;
  status?:
    | 'confirmada'
    | 'cancelada'
    | 'utilizada'
    | 'em_andamento'
    | 'concluida'
    | 'validada'
    | 'nao_compareceu';
  statusDescricao?: string;
  token?: string;
  createdAt?: string;
  quiosqueId?: string | null;
  quantidadePessoas?: number;
};

export type CriarReservaRequest = {
  atrativoId: string;
  nomeVisitante?: string;
  email?: string;
  cpf?: string;
  cidadeOrigem?: string;
  ufOrigem?: string;
  tipo?: 'day_use' | 'camping';
  data?: string;
  dataFim?: string | null;
  quantidadePessoas?: number;
  quiosqueId?: string | null;
};

export type TicketPublicoDto = {
  id?: string;
  Id?: string;
  nomeVisitante?: string;
  NomeVisitante?: string;
  email?: string;
  Email?: string;
  data?: string;
  Data?: string;
  dataFim?: string | null;
  DataFim?: string | null;
  tipo?: string;
  Tipo?: string;
  quantidadePessoas?: number;
  QuantidadePessoas?: number;
  status?: string;
  Status?: string;
  token?: string;
  Token?: string;
  atrativoNome?: string;
  AtrativoNome?: string;
  quiosqueNumero?: number | null;
  QuiosqueNumero?: number | null;
  quiosqueChurrasqueira?: boolean;
  QuiosqueChurrasqueira?: boolean;
};

export type ListAtrativosRequest = {
  MunicipioId?: string | null;
  page?: number;
  pageSize?: number;
};

export type ListAtrativosPublicosRequest = {
  municipioId?: string | null;
  page?: number;
  pageSize?: number;
};

export type ListUsuariosRequest = {
  page?: number;
  pageSize?: number;
};

export type CriarUsuarioRequest = {
  Nome: string;
  Email: string;
  Password: string;
  RoleId: string;
  MunicipioId?: string | null;
  AtrativoId?: string | null;
  Telefone?: string | null;
  Cpf?: string | null;
};

export type AtualizarUsuarioRequest = Partial<{
  Nome: string;
  Email: string;
  Password: string;
  RoleId: string;
  MunicipioId: string | null;
  AtrativoId: string | null;
  Telefone: string | null;
  Cpf: string | null;
}>;

export interface UsuarioSistema {
  id: string;
  nome: string;
  email: string;
  roleId?: string | null;
  roleNome?: string | null;
  municipioId?: string | null;
  municipioNome?: string | null;
  atrativoId?: string | null;
  atrativoNome?: string | null;
  telefone?: string | null;
  cpf?: string | null;
  ativo?: boolean;
}

export type ValidarTicketRequest = {
  Token: string;
  AtrativoId?: string | null;
};

export type ValidarTicketResponse = {
  valido?: boolean;
  isValid?: boolean;
  reserva?: ReservaDto;
} & Partial<ReservaDto>;

export type GestaoReservaStatusRequest = {
  status: "confirmada" | "em_andamento" | "concluida" | "cancelada" | "validada" | "nao_compareceu";
  motivo: string;
};

export type GestaoReservaStatusResponse = {
  success: boolean;
  message: string;
  statusAnterior: string;
  statusNovo: string;
};

export type PainelValidacaoDto = {
  atrativoId?: string;
  AtrativoId?: string;
  nomeAtrativo?: string;
  NomeAtrativo?: string;
  data?: string;
  Data?: string;
  validadas?: number;
  Validadas?: number;
  recusadas?: number;
  Recusadas?: number;
  pendentes?: number;
  Pendentes?: number;
  ocupacao?: number;
  Ocupacao?: number;
  ocupacaoAtual?: number;
  OcupacaoAtual?: number;
  capacidade?: number;
  Capacidade?: number;
  capacidadeMaxima?: number;
  CapacidadeMaxima?: number;
  percentualOcupacao?: number;
  PercentualOcupacao?: number;
  totalReservasDia?: number;
  TotalReservasDia?: number;
  atrativoNome?: string;
  AtrativoNome?: string;
  reservas?: Array<Partial<ReservaDto>>;
  Reservas?: Array<Partial<ReservaDto>>;
  reservasDoDia?: Array<Partial<ReservaDto>>;
  ReservasDoDia?: Array<Partial<ReservaDto>>;
};

export type DashboardDataPointDto = {
  label?: string;
  Label?: string;
  valor?: number;
  Valor?: number;
};

export type DashboardOcupacaoDto = {
  nome?: string;
  Nome?: string;
  ocupacao?: number;
  Ocupacao?: number;
  capacidade?: number;
  Capacidade?: number;
};

export type DashboardOrigemUfDto = {
  uf?: string;
  Uf?: string;
  quantidade?: number;
  Quantidade?: number;
};

export type DashboardTopAtrativoDto = {
  nome?: string;
  Nome?: string;
  visitantes?: number;
  Visitantes?: number;
  tendencia?: string;
  Tendencia?: string;
};

export type DashboardDto = {
  visitantesHoje?: number;
  VisitantesHoje?: number;
  visitantesTendencia?: string;
  VisitantesTendencia?: string;
  permanenciaMedia?: number;
  PermanenciaMedia?: number;
  ocupacaoMedia?: number;
  OcupacaoMedia?: number;
  pressaoTuristica?: string;
  PressaoTuristica?: string;
  visitantesPorDia?: DashboardDataPointDto[];
  VisitantesPorDia?: DashboardDataPointDto[];
  ocupacaoPorBalneario?: DashboardOcupacaoDto[];
  OcupacaoPorBalneario?: DashboardOcupacaoDto[];
  origemPorUF?: DashboardOrigemUfDto[];
  OrigemPorUF?: DashboardOrigemUfDto[];
  evolucaoMensal?: DashboardDataPointDto[];
  EvolucaoMensal?: DashboardDataPointDto[];
  topAtrativos?: DashboardTopAtrativoDto[];
  TopAtrativos?: DashboardTopAtrativoDto[];
};

function parseTipoAtrativo(value: unknown): Atrativo['tipo'] {
  const raw = String(value ?? '').trim().toLowerCase();
  if (raw === '1' || raw === 'balneario') return 'balneario';
  if (raw === '2' || raw === 'cachoeira') return 'cachoeira';
  if (raw === '3' || raw === 'trilha') return 'trilha';
  if (raw === '4' || raw === 'parque') return 'parque';
  if (raw === '5' || raw === 'fazendaecoturismo' || raw === 'fazenda-ecoturismo') return 'fazenda-ecoturismo';
  return 'balneario';
}

function toTipoAtrativoApiValue(tipo: Atrativo['tipo']): number {
  if (tipo === 'balneario') return 1;
  if (tipo === 'cachoeira') return 2;
  if (tipo === 'trilha') return 3;
  if (tipo === 'parque') return 4;
  return 5;
}

function parseAtrativoImagem(raw: any): AtrativoImagemDto {
  const url = String(
    raw?.url ??
    raw?.Url ??
    raw?.imagem ??
    raw?.Imagem ??
    raw?.imagemUrl ??
    raw?.ImagemUrl ??
    raw?.base64 ??
    raw?.Base64 ??
    ''
  );

  return {
    id: String(raw?.id ?? raw?.Id ?? ''),
    url,
    ordem: Number(raw?.ordem ?? raw?.Ordem ?? 0),
    principal: Boolean(raw?.principal ?? raw?.Principal),
    descricao: (raw?.descricao ?? raw?.Descricao ?? null) as string | null,
  };
}

function parseAtrativo(raw: any): Atrativo {
  const parseCoordinate = (value: unknown): number | undefined => {
    if (value === null || value === undefined) return undefined;
    if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
    const normalized = String(value).trim().replace(',', '.');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  const rawImagensCandidates = [
    raw?.imagens,
    raw?.Imagens,
    raw?.imagensAtrativo,
    raw?.ImagensAtrativo,
    raw?.atrativoImagens,
    raw?.AtrativoImagens,
    raw?.fotos,
    raw?.Fotos,
  ];

  const imagemLegacy = raw?.imagem ?? raw?.Imagem ?? null;

  let imagensRaw: any[] = [];
  const explicitArray = rawImagensCandidates.find((candidate) => Array.isArray(candidate));
  if (Array.isArray(explicitArray)) {
    imagensRaw = explicitArray;
  } else {
    const explicitString = rawImagensCandidates.find((candidate) => typeof candidate === 'string' && candidate.trim());
    if (typeof explicitString === 'string') {
      try {
        const parsed = JSON.parse(explicitString);
        if (Array.isArray(parsed)) imagensRaw = parsed;
      } catch {
        // ignore parse error and fallback to legacy fields
      }
    }
  }

  if (imagensRaw.length === 0 && typeof imagemLegacy === 'string' && imagemLegacy.trim()) {
    const legacy = imagemLegacy.trim();
    if (legacy.startsWith('[') || legacy.startsWith('{')) {
      try {
        const parsed = JSON.parse(legacy);
        if (Array.isArray(parsed)) imagensRaw = parsed;
        else if (parsed && typeof parsed === 'object') imagensRaw = [parsed];
      } catch {
        // If it's not valid json, treat as a single URL/base64 image below.
      }
    }

    if (imagensRaw.length === 0) {
      imagensRaw = [{ id: 'legacy-imagem', url: legacy, ordem: 1, principal: true }];
    }
  }

  const imagens = imagensRaw
    .map(parseAtrativoImagem)
    .filter((img) => Boolean(img.url));

  const principal = imagens.find((img) => img.principal)?.url;
  const primeira = imagens.slice().sort((a, b) => a.ordem - b.ordem)[0]?.url;

  const descricaoRaw =
    raw?.descricaoDetalhada ??
    raw?.DescricaoDetalhada ??
    raw?.detalhamento ??
    raw?.Detalhamento ??
    raw?.descricao ??
    raw?.Descricao ??
    '';
  const descricaoParsed = parseDescricaoAtrativo(descricaoRaw);

  return {
    id: String(raw?.id ?? raw?.Id ?? ''),
    nome: String(raw?.nome ?? raw?.Nome ?? ''),
    tipo: parseTipoAtrativo(raw?.tipo ?? raw?.Tipo),
    municipioId: String(raw?.municipioId ?? raw?.MunicipioId ?? ''),
    capacidadeMaxima: Number(raw?.capacidadeMaxima ?? raw?.CapacidadeMaxima ?? 0),
    ocupacaoAtual: Number(raw?.ocupacaoAtual ?? raw?.OcupacaoAtual ?? 0),
    status: (raw?.status ?? raw?.Status ?? 'ativo') as Atrativo['status'],
    descricao: descricaoParsed.resumo,
    descricaoDetalhada: descricaoParsed.detalhada,
    endereco: String(
      raw?.endereco ??
      raw?.Endereco ??
      raw?.enderecoCompleto ??
      raw?.EnderecoCompleto ??
      raw?.localizacao ??
      raw?.Localizacao ??
      ''
    ),
    latitude: parseCoordinate(raw?.latitude ?? raw?.Latitude ?? raw?.lat ?? raw?.Lat),
    longitude: parseCoordinate(raw?.longitude ?? raw?.Longitude ?? raw?.lng ?? raw?.Lng ?? raw?.lon ?? raw?.Lon),
    mapUrl: String(
      raw?.mapUrl ??
      raw?.MapUrl ??
      raw?.mapaUrl ??
      raw?.MapaUrl ??
      raw?.googleMapsUrl ??
      raw?.GoogleMapsUrl ??
      ''
    ),
    placeId: String(raw?.placeId ?? raw?.PlaceId ?? ''),
    imagem: String(raw?.imagem ?? raw?.Imagem ?? principal ?? primeira ?? ''),
    imagens,
  };
}

function parseMunicipio(raw: any): Municipio {
  const logoNode = raw?.logo ?? raw?.Logo ?? null;
  const logoUrl =
    (typeof logoNode === 'object' && logoNode !== null
      ? String(logoNode.imagemUrl ?? logoNode.ImagemUrl ?? logoNode.url ?? logoNode.Url ?? '')
      : String(logoNode ?? '')) || '';

  return {
    id: String(raw?.id ?? raw?.Id ?? ''),
    nome: String(raw?.nome ?? raw?.Nome ?? ''),
    uf: String(raw?.uf ?? raw?.Uf ?? ''),
    logo: logoUrl || undefined,
    logoTelaLogin: String(raw?.logoTelaLogin ?? raw?.LogoTelaLogin ?? '').trim() || null,
    logoAreaPublica: String(raw?.logoAreaPublica ?? raw?.LogoAreaPublica ?? '').trim() || null,
  };
}

function parseRole(raw: any): RoleOption {
  return {
    id: String(raw?.id ?? raw?.Id ?? ''),
    nome: String(raw?.name ?? raw?.Name ?? raw?.nome ?? raw?.Nome ?? ''),
    descricao: String(raw?.description ?? raw?.Description ?? raw?.descricao ?? raw?.Descricao ?? '').trim() || null,
    isActive: Boolean(raw?.isActive ?? raw?.IsActive ?? true),
  };
}

function parseUsuario(raw: any): UsuarioSistema {
  const roleNode = raw?.role ?? raw?.Role ?? null;
  const municipioNode = raw?.municipio ?? raw?.Municipio ?? null;
  const atrativoNode = raw?.atrativo ?? raw?.Atrativo ?? null;

  return {
    id: String(raw?.id ?? raw?.Id ?? ''),
    nome: String(raw?.nome ?? raw?.Nome ?? ''),
    email: String(raw?.email ?? raw?.Email ?? ''),
    roleId: String(raw?.roleId ?? raw?.RoleId ?? roleNode?.id ?? roleNode?.Id ?? '').trim() || null,
    roleNome: String(raw?.roleNome ?? raw?.RoleNome ?? raw?.role ?? raw?.Role ?? roleNode?.name ?? roleNode?.Name ?? '').trim() || null,
    municipioId: String(raw?.municipioId ?? raw?.MunicipioId ?? municipioNode?.id ?? municipioNode?.Id ?? '').trim() || null,
    municipioNome: String(raw?.municipioNome ?? raw?.MunicipioNome ?? raw?.municipio ?? raw?.Municipio ?? municipioNode?.nome ?? municipioNode?.Nome ?? '').trim() || null,
    atrativoId: String(raw?.atrativoId ?? raw?.AtrativoId ?? atrativoNode?.id ?? atrativoNode?.Id ?? '').trim() || null,
    atrativoNome: String(raw?.atrativoNome ?? raw?.AtrativoNome ?? raw?.atrativo ?? raw?.Atrativo ?? atrativoNode?.nome ?? atrativoNode?.Nome ?? '').trim() || null,
    telefone: String(raw?.telefone ?? raw?.Telefone ?? '').trim() || null,
    cpf: String(raw?.cpf ?? raw?.Cpf ?? '').trim() || null,
    ativo: Boolean(raw?.ativo ?? raw?.Ativo ?? true),
  };
}

function buildQuery(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    searchParams.set(key, String(value));
  });

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

function parsePagedResponse<T>(raw: any, parser: (item: any) => T): PagedResult<T> {
  const itemsRaw = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.items)
      ? raw.items
      : Array.isArray(raw?.Items)
        ? raw.Items
        : [];

  const pageRaw = Number(raw?.page ?? raw?.Page ?? 1);
  const pageSizeRaw = Number(raw?.pageSize ?? raw?.PageSize ?? (itemsRaw.length || 1));
  const totalItemsRaw = Number(raw?.totalItems ?? raw?.TotalItems ?? itemsRaw.length);
  const totalPagesRaw = Number(
    raw?.totalPages ??
    raw?.TotalPages ??
    Math.max(1, Math.ceil(totalItemsRaw / Math.max(1, pageSizeRaw)))
  );

  const page = Number.isFinite(pageRaw) ? pageRaw : 1;
  const pageSize = Number.isFinite(pageSizeRaw) ? pageSizeRaw : itemsRaw.length;
  const totalItems = Number.isFinite(totalItemsRaw) ? totalItemsRaw : itemsRaw.length;
  const totalPages = Number.isFinite(totalPagesRaw) ? totalPagesRaw : 1;

  return {
    items: itemsRaw.map(parser),
    page,
    pageSize,
    totalItems,
    totalPages,
    hasNextPage: Boolean(raw?.hasNextPage ?? raw?.HasNextPage ?? page < totalPages),
    hasPreviousPage: Boolean(raw?.hasPreviousPage ?? raw?.HasPreviousPage ?? page > 1),
  };
}

function toQuiosqueStatusApiValue(status: AtualizarQuiosqueRequest["status"]): number | undefined {
  if (!status) return undefined;
  if (status === "disponivel") return 1;
  if (status === "ocupado") return 2;
  if (status === "manutencao") return 3;
  if (status === "bloqueado") return 4;
  if (status === "inativo") return 5;
  return undefined;
}

export const apiClient = {
  
  health: () => http.get<string>("/health"),
  
  // Login  
  login: (body: LoginRequest) => http.post<LoginResponse>("/auth/login", body),

  // Configurações
  getConfiguracoes: () => http.get<ConfiguracoesDto[]>("/configuracoes"), 
  putConfiguracoes: (updates: ConfiguracoesDto[]) =>
    http.put<void>("/configuracoes", { configs: updates, updates }),

  // Municípios
  listarMunicipios: () => http.get<any[]>("/municipios").then((items) => (items ?? []).map(parseMunicipio)),
  getMunicipio: (id: string) => http.get<any>(`/municipios/${id}`).then(parseMunicipio),
  listarRoles: () =>
    http.get<any[]>("/roles").then((items) =>
      (items ?? [])
        .map(parseRole)
        .filter((r) => Boolean(r.id) && Boolean(r.nome) && (r.isActive ?? true))
    ),
  buscarEndereco: (query: string) =>
    http.get<Array<{
      displayName?: string;
      DisplayName?: string;
      latitude?: number | string;
      Latitude?: number | string;
      longitude?: number | string;
      Longitude?: number | string;
      placeId?: string;
      PlaceId?: string;
    }>>(`/geocode?query=${encodeURIComponent(query)}`).then((items) =>
      (items ?? [])
        .map((item) => ({
          displayName: String(item.displayName ?? item.DisplayName ?? ''),
          latitude: Number(item.latitude ?? item.Latitude ?? 0),
          longitude: Number(item.longitude ?? item.Longitude ?? 0),
          placeId: String(item.placeId ?? item.PlaceId ?? ''),
        }))
        .filter((item) => Boolean(item.displayName) && Number.isFinite(item.latitude) && Number.isFinite(item.longitude))
    ),

  // Atrativos
  listarAtrativos: (params: ListAtrativosRequest = {}) => {
    if (!params.MunicipioId) {
      throw new Error("MunicipioId é obrigatório para listar atrativos.");
    }
    const query = buildQuery({ page: params.page, pageSize: params.pageSize });
    return http
      .get<any>(`/atrativos-municipio/${encodeURIComponent(params.MunicipioId)}${query}`)
      .then((response) => parsePagedResponse(response, parseAtrativo));
  },
  listarAtrativosPublicos: (params: ListAtrativosPublicosRequest = {}) =>
    params.municipioId
      ? http
          .get<any>(`/atrativos-municipio/${encodeURIComponent(params.municipioId)}${buildQuery({ page: params.page, pageSize: params.pageSize })}`)
          .then((response) => parsePagedResponse(response, parseAtrativo))
      : Promise.resolve(parsePagedResponse([], parseAtrativo)),
  obterAtrativo: (id: string) => http.get<any>(`/atrativos/${id}`).then(parseAtrativo),
  criarAtrativo: (body: CriarAtrativoRequest) =>
    http
      .post<any>("/atrativos", {
        ...body,
        tipo: toTipoAtrativoApiValue(body.tipo),
      })
      .then(parseAtrativo),
  atualizarAtrativo: (id: string, body: Partial<Atrativo>) =>
    http.put<void>(`/atrativos/${id}`, {
      ...body,
      ...(body.tipo ? { tipo: toTipoAtrativoApiValue(body.tipo) } : {}),
    }),

  // Quiosques
  listarQuiosques: (atrativoId: string) =>
    http.get<QuiosqueDto[]>(`/quiosques-atrativo/${encodeURIComponent(atrativoId)}`),

  criarQuiosque: (body: CriarQuiosqueRequest) => http.post<QuiosqueDto>("/quiosques", body),

  atualizarQuiosque: (id: string, body: AtualizarQuiosqueRequest) => {
    const status = toQuiosqueStatusApiValue(body.status);
    const payload: Record<string, unknown> = { ...body };
    delete payload.status;
    if (status !== undefined) payload.status = status;
    return http.put<void>(`/quiosques/${id}`, payload);
  },

  atualizarPosicaoQuiosque: (id: string, body: AtualizarPosicaoQuiosqueRequest) =>
    http.patch<void>(`/quiosques/${id}/posicao`, body),

  excluirQuiosque: (id: string) => http.del<void>(`/quiosques/${id}`),
  inativarQuiosque: (id: string) => http.patch<void>(`/quiosques/${id}/inativar`, {}),
  acaoAdministrativaQuiosque: (id: string, body: AcaoAdministrativaQuiosqueRequest) =>
    http.patch<AcaoAdministrativaQuiosqueResponse>(`/quiosques/${id}/acao-administrativa`, body),

  // Reservas
  listarReservas: () => http.get<ReservaDto[]>("/reservas"),
  criarReserva: (body: CriarReservaRequest) => http.post<ReservaDto>("/reservas", body),
  listarReservasPorAtrativo: (atrativoId: string) =>
      http.get<ReservaDto[]>(`/reservas?AtrativoId=${encodeURIComponent(atrativoId)}`),
  obterPainelValidacao: (atrativoId: string, data?: string, incluirReservas: boolean = false) =>
    http.get<PainelValidacaoDto>(
      `/painel-validacao?atrativoId=${encodeURIComponent(atrativoId)}${
        data ? `&data=${encodeURIComponent(data)}` : ""
      }${
        incluirReservas ? `&incluirReservas=true` : ""
      }`
    ),
  obterReserva: (id: string) => http.get<ReservaDto>(`/reservas/${id}`),
  atualizarStatusReservaGestao: (id: string, body: GestaoReservaStatusRequest) =>
    http.patch<GestaoReservaStatusResponse>(`/reservas/${id}/gestao-status`, body),
  obterTicketPublico: (token: string) =>
    http.get<TicketPublicoDto>(`/reservas/ticket/${encodeURIComponent(token)}`),
  validarTicket: (body: ValidarTicketRequest) => http.post<ValidarTicketResponse>("/validacoes", body),

  // Dashboard
  obterDashboard: (periodo: "7d" | "30d" | "6m" = "7d") =>
    http.get<DashboardDto>(`/dashboard?periodo=${encodeURIComponent(periodo)}`),

  // Banners
  listarBanners: (apenasAtivos = true) =>
    http.get<BannerDto[]>(`/banners?apenasAtivos=${apenasAtivos}`),
  obterBanner: (id: string) => http.get<BannerDto>(`/banners/${id}`),
  criarBanner: (body: CriarBannerRequest) => http.post<BannerDto>("/banners", body),
  atualizarBanner: (id: string, body: AtualizarBannerRequest) =>
    http.put<BannerDto>(`/banners/${id}`, body),
  reordenarBanners: (items: ReordenarBannerRequestItem[]) =>
    http.put<void>("/banners/reorder", items),
  excluirBanner: (id: string) => http.del<void>(`/banners/${id}`),

  // Uploads
  uploadImagem: (container: UploadContainer, file: File, folder?: string) => {
    const form = new FormData();
    form.append("file", file);
    const query = folder ? `?folder=${encodeURIComponent(folder)}` : "";
    return http.post<UploadGenericResponse>(`/uploads/${container}${query}`, form);
  },
  uploadBannerECreate: (
    file: File,
    payload: UploadBannerCreateRequest
  ) => {
    const form = new FormData();
    form.append("MunicipioId", payload.municipioId);
    form.append("Imagem", file);
    form.append("Titulo", payload.titulo);
    return http.post<UploadBannerCreateResponse>("/uploads/banners", form);
  },
  uploadLogoLoginMunicipio: (municipioId: string, file: File) => {
    const form = new FormData();
    form.append("MunicipioId", municipioId);
    form.append("Logo", file);
    return http.post<UploadLogoMunicipioResponse>(
      `/uploads/municipios/${encodeURIComponent(municipioId)}/logo-login`,
      form
    );
  },
  uploadLogoPublicoMunicipio: (municipioId: string, file: File) => {
    const form = new FormData();
    form.append("MunicipioId", municipioId);
    form.append("Logo", file);
    return http.post<UploadLogoMunicipioResponse>(
      `/uploads/municipios/${encodeURIComponent(municipioId)}/logo-publico`,
      form
    );
  },
  deletarUploadPorUrl: (url: string) =>
    http.del<void>(`/uploads?url=${encodeURIComponent(url)}`),

  uploadImagensAtrativo: (atrativoId: string, payload: UploadImagensAtrativoRequest) => {
    const form = new FormData();
    payload.imagens.forEach((file) => form.append("Imagens", file));
    payload.descricoes?.forEach((descricao) => form.append("Descricoes", descricao ?? ""));
    payload.ordens?.forEach((ordem) => form.append("Ordens", String(ordem)));
    if (payload.principalId) form.append("PrincipalId", payload.principalId);

    return http.post<UploadImagensAtrativoResponse>(
      `/uploads/atrativos/${encodeURIComponent(atrativoId)}/imagens`,
      form
    );
  },

  removerImagemAtrativo: (atrativoId: string, imagemId: string) =>
    http.del<void>(`/uploads/atrativos/${encodeURIComponent(atrativoId)}/imagens/${encodeURIComponent(imagemId)}`),

  definirImagemPrincipalAtrativo: (atrativoId: string, imagemId: string) =>
    http.put<void>(
      `/uploads/atrativos/${encodeURIComponent(atrativoId)}/imagens/${encodeURIComponent(imagemId)}/principal`,
      {}
    ),

  reordenarImagensAtrativo: (atrativoId: string, imagens: ReordenarImagensAtrativoRequestItem[]) =>
    http.put<void>(`/uploads/atrativos/${encodeURIComponent(atrativoId)}/imagens/reordenar`, { imagens }),

  // Usuarios
  listarUsuarios: (params: ListUsuariosRequest = {}) =>
    http
      .get<any>(`/usuarios${buildQuery({ page: params.page, pageSize: params.pageSize })}`)
      .then((response) => parsePagedResponse(response, parseUsuario)),
  obterUsuario: (id: string) => http.get<any>(`/usuarios/${id}`).then(parseUsuario),
  criarUsuario: (body: CriarUsuarioRequest) => http.post<any>("/usuarios", body),
  atualizarUsuario: (id: string, body: AtualizarUsuarioRequest) => http.put<any>(`/usuarios/${id}`, body),
  excluirUsuario: (id: string) => http.del<void>(`/usuarios/${id}`),
};

