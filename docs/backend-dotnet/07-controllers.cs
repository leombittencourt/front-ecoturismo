// ============================================================
// EcoTurismo.API/Controllers/ — API REST Controllers
// ============================================================

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EcoTurismo.API.Data;
using EcoTurismo.API.DTOs;
using EcoTurismo.API.Services;
using System.Security.Claims;

namespace EcoTurismo.API.Controllers;

// ─── AuthController.cs ───

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _auth;

    public AuthController(IAuthService auth) => _auth = auth;

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var result = await _auth.LoginAsync(request);
        if (result == null)
            return Unauthorized(new { message = "Email ou senha inválidos" });
        return Ok(result);
    }
}

// ─── MunicipiosController.cs ───

[ApiController]
[Route("api/municipios")]
public class MunicipiosController : ControllerBase
{
    private readonly EcoTurismoDbContext _db;

    public MunicipiosController(EcoTurismoDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> List()
    {
        var data = await _db.Municipios
            .OrderBy(m => m.Nome)
            .Select(m => new MunicipioDto(m.Id, m.Nome, m.Uf, m.Logo))
            .ToListAsync();
        return Ok(data);
    }
}

// ─── AtrativosController.cs ───

[ApiController]
[Route("api/atrativos")]
public class AtrativosController : ControllerBase
{
    private readonly EcoTurismoDbContext _db;

    public AtrativosController(EcoTurismoDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] Guid? municipioId)
    {
        var query = _db.Atrativos.AsQueryable();
        if (municipioId.HasValue)
            query = query.Where(a => a.MunicipioId == municipioId.Value);

        var data = await query
            .OrderBy(a => a.Nome)
            .Select(a => new AtrativoDto(
                a.Id, a.Nome, a.Tipo, a.MunicipioId,
                a.CapacidadeMaxima, a.OcupacaoAtual, a.Status,
                a.Descricao, a.Imagem
            ))
            .ToListAsync();
        return Ok(data);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var a = await _db.Atrativos.FindAsync(id);
        if (a == null) return NotFound();
        return Ok(new AtrativoDto(
            a.Id, a.Nome, a.Tipo, a.MunicipioId,
            a.CapacidadeMaxima, a.OcupacaoAtual, a.Status,
            a.Descricao, a.Imagem
        ));
    }

    [Authorize(Roles = "admin,prefeitura")]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] AtrativoUpdateDto dto)
    {
        var a = await _db.Atrativos.FindAsync(id);
        if (a == null) return NotFound();

        if (dto.Nome != null) a.Nome = dto.Nome;
        if (dto.Tipo != null) a.Tipo = dto.Tipo;
        if (dto.Descricao != null) a.Descricao = dto.Descricao;
        if (dto.Imagem != null) a.Imagem = dto.Imagem;
        if (dto.CapacidadeMaxima.HasValue) a.CapacidadeMaxima = dto.CapacidadeMaxima.Value;
        if (dto.OcupacaoAtual.HasValue) a.OcupacaoAtual = dto.OcupacaoAtual.Value;
        if (dto.Status != null) a.Status = dto.Status;

        await _db.SaveChangesAsync();
        return Ok(new AtrativoDto(
            a.Id, a.Nome, a.Tipo, a.MunicipioId,
            a.CapacidadeMaxima, a.OcupacaoAtual, a.Status,
            a.Descricao, a.Imagem
        ));
    }
}

// ─── ReservasController.cs ───

[ApiController]
[Route("api/reservas")]
public class ReservasController : ControllerBase
{
    private readonly IReservaService _service;

    public ReservasController(IReservaService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] Guid? atrativoId)
        => Ok(await _service.ListarAsync(atrativoId));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ReservaCreateDto dto)
    {
        var reserva = await _service.CriarAsync(dto);
        return CreatedAtAction(nameof(Create), new { id = reserva.Id }, reserva);
    }

    [Authorize(Roles = "admin,prefeitura,balneario")]
    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] ReservaStatusUpdateDto dto)
    {
        var ok = await _service.AtualizarStatusAsync(id, dto.Status);
        return ok ? NoContent() : NotFound();
    }
}

// ─── ValidacoesController.cs ───

[ApiController]
[Route("api/validacoes")]
public class ValidacoesController : ControllerBase
{
    private readonly IReservaService _service;

    public ValidacoesController(IReservaService service) => _service = service;

    [HttpPost]
    public async Task<IActionResult> Validar([FromBody] ValidacaoRequest request)
    {
        Guid? operadorId = null;
        var claim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (claim != null) operadorId = Guid.Parse(claim.Value);

        var result = await _service.ValidarTicketAsync(request, operadorId);
        return Ok(result);
    }
}

// ─── QuiosquesController.cs ───

[ApiController]
[Route("api/quiosques")]
public class QuiosquesController : ControllerBase
{
    private readonly IQuiosqueService _service;

    public QuiosquesController(IQuiosqueService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] Guid? atrativoId)
        => Ok(await _service.ListarAsync(atrativoId));

    [Authorize(Roles = "admin,prefeitura,balneario")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] QuiosqueCreateDto dto)
    {
        var q = await _service.CriarAsync(dto);
        return CreatedAtAction(nameof(Create), new { id = q.Id }, q);
    }

    [Authorize(Roles = "admin,prefeitura,balneario")]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] QuiosqueUpdateDto dto)
    {
        var result = await _service.AtualizarAsync(id, dto);
        return result != null ? Ok(result) : NotFound();
    }

    [Authorize(Roles = "admin,prefeitura,balneario")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var ok = await _service.ExcluirAsync(id);
        return ok ? NoContent() : NotFound();
    }
}

// ─── BannersController.cs ───

[ApiController]
[Route("api/banners")]
public class BannersController : ControllerBase
{
    private readonly EcoTurismoDbContext _db;

    public BannersController(EcoTurismoDbContext db) => _db = db;

    // GET /api/banners?apenasAtivos=true
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] bool? apenasAtivos)
    {
        var query = _db.Banners.AsQueryable();
        if (apenasAtivos == true)
            query = query.Where(b => b.Ativo);

        var data = await query
            .OrderBy(b => b.Ordem)
            .Select(b => new BannerDto(b.Id, b.Titulo, b.Subtitulo, b.ImagemUrl, b.Link, b.Ordem, b.Ativo))
            .ToListAsync();
        return Ok(data);
    }

    // GET /api/banners/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var b = await _db.Banners.FindAsync(id);
        if (b == null) return NotFound();
        return Ok(new BannerDto(b.Id, b.Titulo, b.Subtitulo, b.ImagemUrl, b.Link, b.Ordem, b.Ativo));
    }

    // POST /api/banners
    [Authorize(Roles = "admin,prefeitura")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] BannerCreateDto dto)
    {
        // Próxima ordem disponível
        var maxOrdem = await _db.Banners.MaxAsync(b => (int?)b.Ordem) ?? 0;

        var banner = new Models.Banner
        {
            Id = Guid.NewGuid(),
            Titulo = dto.Titulo,
            Subtitulo = dto.Subtitulo,
            ImagemUrl = dto.ImagemUrl,
            Link = dto.Link,
            Ordem = dto.Ordem ?? maxOrdem + 1,
            Ativo = dto.Ativo ?? true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        _db.Banners.Add(banner);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(Get), new { id = banner.Id },
            new BannerDto(banner.Id, banner.Titulo, banner.Subtitulo, banner.ImagemUrl, banner.Link, banner.Ordem, banner.Ativo));
    }

    // PUT /api/banners/{id}
    [Authorize(Roles = "admin,prefeitura")]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] BannerUpdateDto dto)
    {
        var b = await _db.Banners.FindAsync(id);
        if (b == null) return NotFound();

        if (dto.Titulo != null) b.Titulo = dto.Titulo;
        if (dto.Subtitulo != null) b.Subtitulo = dto.Subtitulo;
        if (dto.ImagemUrl != null) b.ImagemUrl = dto.ImagemUrl;
        if (dto.Link != null) b.Link = dto.Link;
        if (dto.Ordem.HasValue) b.Ordem = dto.Ordem.Value;
        if (dto.Ativo.HasValue) b.Ativo = dto.Ativo.Value;

        await _db.SaveChangesAsync();

        return Ok(new BannerDto(b.Id, b.Titulo, b.Subtitulo, b.ImagemUrl, b.Link, b.Ordem, b.Ativo));
    }

    // PUT /api/banners/reorder
    [Authorize(Roles = "admin,prefeitura")]
    [HttpPut("reorder")]
    public async Task<IActionResult> Reorder([FromBody] BannerReorderDto dto)
    {
        foreach (var item in dto.Itens)
        {
            var b = await _db.Banners.FindAsync(item.Id);
            if (b != null) b.Ordem = item.Ordem;
        }
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // DELETE /api/banners/{id}
    [Authorize(Roles = "admin,prefeitura")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var b = await _db.Banners.FindAsync(id);
        if (b == null) return NotFound();

        _db.Banners.Remove(b);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

// ─── ConfiguracoesController.cs ───

[ApiController]
[Route("api/configuracoes")]
public class ConfiguracoesController : ControllerBase
{
    private readonly EcoTurismoDbContext _db;

    public ConfiguracoesController(EcoTurismoDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> List()
    {
        var data = await _db.Configuracoes
            .Select(c => new ConfiguracaoDto(c.Chave, c.Valor))
            .ToListAsync();
        return Ok(data);
    }

    [Authorize(Roles = "admin")]
    [HttpPut]
    public async Task<IActionResult> BatchUpdate([FromBody] ConfiguracaoBatchUpdateDto dto)
    {
        foreach (var item in dto.Configs)
        {
            var config = await _db.Configuracoes
                .FirstOrDefaultAsync(c => c.Chave == item.Chave);
            if (config != null)
                config.Valor = item.Valor;
        }
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

// ─── ProfilesController.cs ───

[ApiController]
[Route("api/profiles")]
[Authorize]
public class ProfilesController : ControllerBase
{
    private readonly EcoTurismoDbContext _db;

    public ProfilesController(EcoTurismoDbContext db) => _db = db;

    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        var profile = await _db.Profiles.FindAsync(Guid.Parse(userId));
        if (profile == null) return NotFound();

        return Ok(new
        {
            profile.Id,
            profile.Nome,
            profile.Email,
            profile.Role,
            profile.MunicipioId,
            profile.AtrativoId,
        });
    }
}
