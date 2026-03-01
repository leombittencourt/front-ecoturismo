import { http } from "./http";

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
  tipo: 'balneario' | 'cachoeira' | 'trilha' | 'parque';
  municipioId: string;
  capacidadeMaxima: number;
  ocupacaoAtual: number;
  status: 'ativo' | 'inativo' | 'manutencao';
  descricao: string;
  imagem?: string;
}

export interface QuiosqueDto {
  id: string;
  numero: number;
  status: "disponivel" | "reservado" | "ocupado" | "manutencao" | "bloqueado" | "inativo" | string;
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
  status: "disponivel" | "reservado" | "ocupado" | "manutencao" | "bloqueado" | "inativo";
  temChurrasqueira: boolean;
  posicaoX: number;
  posicaoY: number;
}>;

export type AtualizarPosicaoQuiosqueRequest = {
  posicaoX: number;
  posicaoY: number;
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

export type ListAtrativosRequest = {
  MunicipioId?: string | null;
};

export type ValidarTicketRequest = {
  Token: string;
  AtrativoId?: string | null;
};

export type ValidarTicketResponse = {
  valido?: boolean;
  isValid?: boolean;
  reserva?: ReservaDto;
} & Partial<ReservaDto>;

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

export const apiClient = {
  
  health: () => http.get<string>("/health"),
  
  // Login  
  login: (body: LoginRequest) => http.post<LoginResponse>("/auth/login", body),

  // Configurações
  getConfiguracoes: () => http.get<ConfiguracoesDto[]>("/configuracoes"), 
  putConfiguracoes: (updates: ConfiguracoesDto[]) => http.put<void>("/configuracoes", { updates }),

  // Municípios
  getMunicipio: (id: string) => http.get<Municipio>(`/municipios/${id}`),

  // Atrativos
  listarAtrativos: (params: ListAtrativosRequest = {}) => {
    if (!params.MunicipioId) {
      throw new Error("MunicipioId é obrigatório para listar atrativos.");
    }
    return http.get<Atrativo[]>(`/atrativos-municipio/${encodeURIComponent(params.MunicipioId)}`);
  },
  listarAtrativosPublicos: (municipioId?: string | null) =>
    http.get<Atrativo[]>(
      `/atrativos${municipioId ? `?municipioId=${encodeURIComponent(municipioId)}` : ""}`
    ),
  
  obterAtrativo: (id: string) => http.get<Atrativo>(`/atrativos/${id}`),
  atualizarAtrativo: (id: string, body: Partial<Atrativo>) =>
    http.put<void>(`/atrativos/${id}`, body),

  // Quiosques
  listarQuiosques: (atrativoId: string) =>
    http.get<QuiosqueDto[]>(`/quiosques-atrativo/${encodeURIComponent(atrativoId)}`),

  criarQuiosque: (body: CriarQuiosqueRequest) => http.post<QuiosqueDto>("/quiosques", body),

  atualizarQuiosque: (id: string, body: AtualizarQuiosqueRequest) =>
    http.put<void>(`/quiosques/${id}`, body),

  atualizarPosicaoQuiosque: (id: string, body: AtualizarPosicaoQuiosqueRequest) =>
    http.patch<void>(`/quiosques/${id}/posicao`, body),

  excluirQuiosque: (id: string) => http.del<void>(`/quiosques/${id}`),

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
};
