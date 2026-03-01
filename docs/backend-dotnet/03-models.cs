// ============================================================
// EcoTurismo.API/Models/ — Entity Classes (Entity Framework)
// ============================================================

// --- Municipio.cs ---
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EcoTurismo.API.Models;

[Table("municipios")]
public class Municipio
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required, MaxLength(200)]
    [Column("nome")]
    public string Nome { get; set; } = string.Empty;

    [Required, MaxLength(2)]
    [Column("uf")]
    public string Uf { get; set; } = string.Empty;

    [Column("logo")]
    public string? Logo { get; set; }

    [Column("created_at")]
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    // Navigation
    public ICollection<Atrativo> Atrativos { get; set; } = new List<Atrativo>();
    public ICollection<Profile> Profiles { get; set; } = new List<Profile>();
}

// --- Profile.cs ---
namespace EcoTurismo.API.Models;

[Table("profiles")]
public class Profile
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; }

    [Required, MaxLength(200)]
    [Column("nome")]
    public string Nome { get; set; } = string.Empty;

    [Required, MaxLength(200)]
    [Column("email")]
    public string Email { get; set; } = string.Empty;

    [Required, MaxLength(20)]
    [Column("role")]
    public string Role { get; set; } = "publico";

    [Column("municipio_id")]
    public Guid? MunicipioId { get; set; }

    [Column("atrativo_id")]
    public Guid? AtrativoId { get; set; }

    [Column("created_at")]
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    [Column("updated_at")]
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    // Hashed password (campo adicional para .NET — não existe no Supabase)
    [Column("password_hash")]
    public string PasswordHash { get; set; } = string.Empty;

    // Navigation
    [ForeignKey("MunicipioId")]
    public Municipio? Municipio { get; set; }

    [ForeignKey("AtrativoId")]
    public Atrativo? Atrativo { get; set; }
}

// --- Atrativo.cs ---
namespace EcoTurismo.API.Models;

[Table("atrativos")]
public class Atrativo
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Column("municipio_id")]
    public Guid MunicipioId { get; set; }

    [Required, MaxLength(200)]
    [Column("nome")]
    public string Nome { get; set; } = string.Empty;

    [Required, MaxLength(20)]
    [Column("tipo")]
    public string Tipo { get; set; } = "balneario";

    [Column("descricao")]
    public string? Descricao { get; set; }

    [Column("imagem")]
    public string? Imagem { get; set; }

    [Column("capacidade_maxima")]
    public int CapacidadeMaxima { get; set; }

    [Column("ocupacao_atual")]
    public int OcupacaoAtual { get; set; }

    [Required, MaxLength(20)]
    [Column("status")]
    public string Status { get; set; } = "ativo";

    [Column("created_at")]
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    [Column("updated_at")]
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    // Navigation
    [ForeignKey("MunicipioId")]
    public Municipio Municipio { get; set; } = null!;
    public ICollection<Reserva> Reservas { get; set; } = new List<Reserva>();
    public ICollection<Quiosque> Quiosques { get; set; } = new List<Quiosque>();
}

// --- Reserva.cs ---
namespace EcoTurismo.API.Models;

[Table("reservas")]
public class Reserva
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Column("atrativo_id")]
    public Guid AtrativoId { get; set; }

    [Column("quiosque_id")]
    public Guid? QuiosqueId { get; set; }

    [Required, MaxLength(200)]
    [Column("nome_visitante")]
    public string NomeVisitante { get; set; } = string.Empty;

    [Required, MaxLength(200)]
    [Column("email")]
    public string Email { get; set; } = string.Empty;

    [Required, MaxLength(14)]
    [Column("cpf")]
    public string Cpf { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    [Column("cidade_origem")]
    public string CidadeOrigem { get; set; } = string.Empty;

    [Required, MaxLength(2)]
    [Column("uf_origem")]
    public string UfOrigem { get; set; } = string.Empty;

    [Required, MaxLength(10)]
    [Column("tipo")]
    public string Tipo { get; set; } = "day_use";

    [Column("data")]
    public DateOnly Data { get; set; }

    [Column("data_fim")]
    public DateOnly? DataFim { get; set; }

    [Column("quantidade_pessoas")]
    public int QuantidadePessoas { get; set; } = 1;

    [Required, MaxLength(15)]
    [Column("status")]
    public string Status { get; set; } = "confirmada";

    [Required, MaxLength(50)]
    [Column("token")]
    public string Token { get; set; } = string.Empty;

    [Column("created_at")]
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    // Navigation
    [ForeignKey("AtrativoId")]
    public Atrativo Atrativo { get; set; } = null!;

    [ForeignKey("QuiosqueId")]
    public Quiosque? Quiosque { get; set; }
}

// --- Validacao.cs ---
namespace EcoTurismo.API.Models;

[Table("validacoes")]
public class Validacao
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Column("reserva_id")]
    public Guid? ReservaId { get; set; }

    [Column("atrativo_id")]
    public Guid? AtrativoId { get; set; }

    [Column("operador_id")]
    public Guid? OperadorId { get; set; }

    [Required, MaxLength(50)]
    [Column("token")]
    public string Token { get; set; } = string.Empty;

    [Column("valido")]
    public bool Valido { get; set; }

    [Column("created_at")]
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    // Navigation
    [ForeignKey("ReservaId")]
    public Reserva? Reserva { get; set; }

    [ForeignKey("AtrativoId")]
    public Atrativo? Atrativo { get; set; }

    [ForeignKey("OperadorId")]
    public Profile? Operador { get; set; }
}

// --- Quiosque.cs ---
namespace EcoTurismo.API.Models;

[Table("quiosques")]
public class Quiosque
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Column("atrativo_id")]
    public Guid? AtrativoId { get; set; }

    [Column("numero")]
    public int Numero { get; set; }

    [Column("tem_churrasqueira")]
    public bool TemChurrasqueira { get; set; }

    [Required, MaxLength(15)]
    [Column("status")]
    public string Status { get; set; } = "disponivel";

    [Column("posicao_x")]
    public int PosicaoX { get; set; }

    [Column("posicao_y")]
    public int PosicaoY { get; set; }

    [Column("created_at")]
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    [Column("updated_at")]
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    // Navigation
    [ForeignKey("AtrativoId")]
    public Atrativo? Atrativo { get; set; }
}

// --- Banner.cs ---
namespace EcoTurismo.API.Models;

[Table("banners")]
public class Banner
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Column("titulo")]
    public string? Titulo { get; set; }

    [Column("subtitulo")]
    public string? Subtitulo { get; set; }

    [Required]
    [Column("imagem_url")]
    public string ImagemUrl { get; set; } = string.Empty;

    [Column("link")]
    public string? Link { get; set; }

    [Column("ordem")]
    public int Ordem { get; set; }

    [Column("ativo")]
    public bool Ativo { get; set; } = true;

    [Column("created_at")]
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    [Column("updated_at")]
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}

// --- ConfiguracaoSistema.cs ---
namespace EcoTurismo.API.Models;

[Table("configuracoes_sistema")]
public class ConfiguracaoSistema
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required, MaxLength(100)]
    [Column("chave")]
    public string Chave { get; set; } = string.Empty;

    [Column("valor")]
    public string? Valor { get; set; }

    [Column("descricao")]
    public string? Descricao { get; set; }

    [Column("updated_at")]
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
