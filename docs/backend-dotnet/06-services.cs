// ============================================================
// EcoTurismo.API/Services/ — Camada de Negócios
// ============================================================

// ─── IAuthService.cs + AuthService.cs ───

using EcoTurismo.API.Data;
using EcoTurismo.API.DTOs;
using EcoTurismo.API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace EcoTurismo.API.Services;

public interface IAuthService
{
    Task<LoginResponse?> LoginAsync(LoginRequest request);
}

public class AuthService : IAuthService
{
    private readonly EcoTurismoDbContext _db;
    private readonly IConfiguration _config;

    public AuthService(EcoTurismoDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    public async Task<LoginResponse?> LoginAsync(LoginRequest request)
    {
        var profile = await _db.Profiles
            .FirstOrDefaultAsync(p => p.Email == request.Email);

        if (profile == null) return null;

        // Validar senha com BCrypt
        if (!BCrypt.Net.BCrypt.Verify(request.Senha, profile.PasswordHash))
            return null;

        var token = GenerateJwt(profile);

        return new LoginResponse(
            Token: token,
            Nome: profile.Nome,
            Email: profile.Email,
            Role: profile.Role,
            MunicipioId: profile.MunicipioId,
            AtrativoId: profile.AtrativoId
        );
    }

    private string GenerateJwt(Profile profile)
    {
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_config["Jwt:Secret"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, profile.Id.ToString()),
            new Claim(ClaimTypes.Email, profile.Email),
            new Claim(ClaimTypes.Name, profile.Nome),
            new Claim(ClaimTypes.Role, profile.Role),
            new Claim("municipio_id", profile.MunicipioId?.ToString() ?? ""),
            new Claim("atrativo_id", profile.AtrativoId?.ToString() ?? ""),
        };

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(24),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

// ─── IReservaService.cs + ReservaService.cs ───

public interface IReservaService
{
    Task<List<ReservaDto>> ListarAsync(Guid? atrativoId = null);
    Task<ReservaDto> CriarAsync(ReservaCreateDto dto);
    Task<bool> AtualizarStatusAsync(Guid id, string status);
    Task<ValidacaoResponse> ValidarTicketAsync(ValidacaoRequest request, Guid? operadorId);
}

public class ReservaService : IReservaService
{
    private readonly EcoTurismoDbContext _db;

    public ReservaService(EcoTurismoDbContext db) => _db = db;

    public async Task<List<ReservaDto>> ListarAsync(Guid? atrativoId = null)
    {
        var query = _db.Reservas.AsQueryable();
        if (atrativoId.HasValue)
            query = query.Where(r => r.AtrativoId == atrativoId.Value);

        return await query.OrderByDescending(r => r.CreatedAt)
            .Select(r => MapToDto(r))
            .ToListAsync();
    }

    public async Task<ReservaDto> CriarAsync(ReservaCreateDto dto)
    {
        var token = $"ECO-{Guid.NewGuid().ToString("N")[..8].ToUpper()}";
        var reserva = new Reserva
        {
            AtrativoId = dto.AtrativoId,
            QuiosqueId = dto.QuiosqueId,
            NomeVisitante = dto.NomeVisitante,
            Email = dto.Email,
            Cpf = dto.Cpf,
            CidadeOrigem = dto.CidadeOrigem,
            UfOrigem = dto.UfOrigem,
            Tipo = dto.Tipo,
            Data = DateOnly.Parse(dto.Data),
            DataFim = dto.DataFim != null ? DateOnly.Parse(dto.DataFim) : null,
            QuantidadePessoas = dto.QuantidadePessoas,
            Token = token,
            Status = "confirmada",
        };

        _db.Reservas.Add(reserva);
        await _db.SaveChangesAsync();

        return MapToDto(reserva);
    }

    public async Task<bool> AtualizarStatusAsync(Guid id, string status)
    {
        var reserva = await _db.Reservas.FindAsync(id);
        if (reserva == null) return false;
        reserva.Status = status;
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<ValidacaoResponse> ValidarTicketAsync(ValidacaoRequest request, Guid? operadorId)
    {
        var reserva = await _db.Reservas
            .FirstOrDefaultAsync(r => r.Token == request.Token && r.Status == "confirmada");

        var validacao = new Validacao
        {
            Token = request.Token,
            AtrativoId = request.AtrativoId,
            OperadorId = operadorId,
            ReservaId = reserva?.Id,
            Valido = reserva != null,
        };

        _db.Validacoes.Add(validacao);

        if (reserva != null)
            reserva.Status = "utilizada";

        await _db.SaveChangesAsync();

        return new ValidacaoResponse(
            Valido: reserva != null,
            Reserva: reserva != null ? MapToDto(reserva) : null,
            Mensagem: reserva != null ? "Ticket válido!" : "Ticket inválido ou já utilizado."
        );
    }

    private static ReservaDto MapToDto(Reserva r) => new(
        r.Id, r.AtrativoId, r.QuiosqueId,
        r.NomeVisitante, r.Email, r.Cpf,
        r.CidadeOrigem, r.UfOrigem, r.Tipo,
        r.Data.ToString("yyyy-MM-dd"),
        r.DataFim?.ToString("yyyy-MM-dd"),
        r.QuantidadePessoas, r.Status, r.Token,
        r.CreatedAt.ToString("yyyy-MM-dd")
    );
}

// ─── IQuiosqueService.cs + QuiosqueService.cs ───

public interface IQuiosqueService
{
    Task<List<QuiosqueDto>> ListarAsync(Guid? atrativoId);
    Task<QuiosqueDto> CriarAsync(QuiosqueCreateDto dto);
    Task<QuiosqueDto?> AtualizarAsync(Guid id, QuiosqueUpdateDto dto);
    Task<bool> ExcluirAsync(Guid id);
}

public class QuiosqueService : IQuiosqueService
{
    private readonly EcoTurismoDbContext _db;

    public QuiosqueService(EcoTurismoDbContext db) => _db = db;

    public async Task<List<QuiosqueDto>> ListarAsync(Guid? atrativoId)
    {
        var query = _db.Quiosques.AsQueryable();
        if (atrativoId.HasValue)
            query = query.Where(q => q.AtrativoId == atrativoId.Value);

        return await query
            .OrderBy(q => q.PosicaoY).ThenBy(q => q.PosicaoX)
            .Select(q => new QuiosqueDto(
                q.Id, q.AtrativoId, q.Numero, q.TemChurrasqueira,
                q.Status, q.PosicaoX, q.PosicaoY
            ))
            .ToListAsync();
    }

    public async Task<QuiosqueDto> CriarAsync(QuiosqueCreateDto dto)
    {
        var q = new Quiosque
        {
            AtrativoId = dto.AtrativoId,
            Numero = dto.Numero,
            TemChurrasqueira = dto.TemChurrasqueira,
            PosicaoX = dto.PosicaoX,
            PosicaoY = dto.PosicaoY,
        };
        _db.Quiosques.Add(q);
        await _db.SaveChangesAsync();
        return new QuiosqueDto(q.Id, q.AtrativoId, q.Numero, q.TemChurrasqueira, q.Status, q.PosicaoX, q.PosicaoY);
    }

    public async Task<QuiosqueDto?> AtualizarAsync(Guid id, QuiosqueUpdateDto dto)
    {
        var q = await _db.Quiosques.FindAsync(id);
        if (q == null) return null;

        if (dto.Numero.HasValue) q.Numero = dto.Numero.Value;
        if (dto.TemChurrasqueira.HasValue) q.TemChurrasqueira = dto.TemChurrasqueira.Value;
        if (dto.Status != null) q.Status = dto.Status;
        if (dto.PosicaoX.HasValue) q.PosicaoX = dto.PosicaoX.Value;
        if (dto.PosicaoY.HasValue) q.PosicaoY = dto.PosicaoY.Value;

        await _db.SaveChangesAsync();
        return new QuiosqueDto(q.Id, q.AtrativoId, q.Numero, q.TemChurrasqueira, q.Status, q.PosicaoX, q.PosicaoY);
    }

    public async Task<bool> ExcluirAsync(Guid id)
    {
        var q = await _db.Quiosques.FindAsync(id);
        if (q == null) return false;
        _db.Quiosques.Remove(q);
        await _db.SaveChangesAsync();
        return true;
    }
}

// ─── DI Registration (adicionar em Program.cs) ───
// builder.Services.AddScoped<IDashboardService, DashboardService>();
// Implementação completa em: 14-dashboard-controller.cs
