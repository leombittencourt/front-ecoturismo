// ============================================================
// EcoTurismo.API/DTOs/ — Data Transfer Objects
// ============================================================

namespace EcoTurismo.API.DTOs;

// ─── Auth ───

public record LoginRequest(string Email, string Senha);

public record LoginResponse(
    string Token,
    string Nome,
    string Email,
    string Role,
    Guid? MunicipioId,
    Guid? AtrativoId
);

// ─── Municípios ───

public record MunicipioDto(
    Guid Id,
    string Nome,
    string Uf,
    string? Logo
);

// ─── Atrativos ───

public record AtrativoDto(
    Guid Id,
    string Nome,
    string Tipo,
    Guid MunicipioId,
    int CapacidadeMaxima,
    int OcupacaoAtual,
    string Status,
    string? Descricao,
    string? Imagem
);

public record AtrativoUpdateDto(
    string? Nome,
    string? Tipo,
    string? Descricao,
    string? Imagem,
    int? CapacidadeMaxima,
    int? OcupacaoAtual,
    string? Status
);

// ─── Reservas ───

public record ReservaDto(
    Guid Id,
    Guid AtrativoId,
    Guid? QuiosqueId,
    string NomeVisitante,
    string Email,
    string Cpf,
    string CidadeOrigem,
    string UfOrigem,
    string Tipo,
    string Data,
    string? DataFim,
    int QuantidadePessoas,
    string Status,
    string Token,
    string CreatedAt
);

public record ReservaCreateDto(
    Guid AtrativoId,
    Guid? QuiosqueId,
    string NomeVisitante,
    string Email,
    string Cpf,
    string CidadeOrigem,
    string UfOrigem,
    string Tipo,
    string Data,
    string? DataFim,
    int QuantidadePessoas
);

public record ReservaStatusUpdateDto(string Status);

// ─── Validações ───

public record ValidacaoRequest(string Token, Guid? AtrativoId);

public record ValidacaoResponse(
    bool Valido,
    ReservaDto? Reserva,
    string? Mensagem
);

// ─── Quiosques ───

public record QuiosqueDto(
    Guid Id,
    Guid? AtrativoId,
    int Numero,
    bool TemChurrasqueira,
    string Status,
    int PosicaoX,
    int PosicaoY
);

public record QuiosqueCreateDto(
    int Numero,
    bool TemChurrasqueira,
    Guid AtrativoId,
    int PosicaoX,
    int PosicaoY
);

public record QuiosqueUpdateDto(
    int? Numero,
    bool? TemChurrasqueira,
    string? Status,
    int? PosicaoX,
    int? PosicaoY
);

// ─── Banners ───

public record BannerDto(
    Guid Id,
    string? Titulo,
    string? Subtitulo,
    string ImagemUrl,
    string? Link,
    int Ordem,
    bool Ativo
);

public record BannerCreateDto(
    string ImagemUrl,
    string? Titulo = null,
    string? Subtitulo = null,
    string? Link = null,
    int? Ordem = null,
    bool? Ativo = true
);

public record BannerUpdateDto(
    string? Titulo,
    string? Subtitulo,
    string? ImagemUrl,
    string? Link,
    int? Ordem,
    bool? Ativo
);

public record BannerReorderDto(
    List<BannerReorderItemDto> Itens
);

public record BannerReorderItemDto(Guid Id, int Ordem);

// ─── Configurações ───

public record ConfiguracaoDto(string Chave, string? Valor);

public record ConfiguracaoBatchUpdateDto(
    List<ConfiguracaoDto> Configs
);

// ─── Dashboard ───

public record DashboardDto(
    int VisitantesHoje,
    string VisitantesTendencia,
    double PermanenciaMedia,
    double OcupacaoMedia,
    string PressaoTuristica,
    List<DataPointDto> VisitantesPorDia,
    List<OcupacaoBalnearioDto> OcupacaoPorBalneario,
    List<OrigemUfDto> OrigemPorUF,
    List<DataPointDto> EvolucaoMensal,
    List<TopAtrativoDto> TopAtrativos
);

public record DataPointDto(string Label, int Valor);
public record OcupacaoBalnearioDto(string Nome, int Ocupacao, int Capacidade);
public record OrigemUfDto(string Uf, int Quantidade);
public record TopAtrativoDto(string Nome, int Visitantes, string Tendencia);
