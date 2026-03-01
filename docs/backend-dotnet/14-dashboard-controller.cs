// ============================================================
// EcoTurismo.API — DashboardService + DashboardController
// ============================================================

using EcoTurismo.API.Data;
using EcoTurismo.API.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EcoTurismo.API.Services;

// ─── IDashboardService.cs ───

public interface IDashboardService
{
    Task<DashboardDto> GetDashboardAsync(string periodo);
}

// ─── DashboardService.cs ───

public class DashboardService : IDashboardService
{
    private readonly EcoTurismoDbContext _db;

    public DashboardService(EcoTurismoDbContext db) => _db = db;

    public async Task<DashboardDto> GetDashboardAsync(string periodo)
    {
        var hoje = DateOnly.FromDateTime(DateTime.UtcNow);
        var dias = periodo switch
        {
            "30d" => 30,
            "6m"  => 180,
            _     => 7
        };
        var dataInicio = hoje.AddDays(-dias);
        var metade = hoje.AddDays(-dias / 2);

        // ── Reservas no período (confirmada ou utilizada) ──
        var reservasPeriodo = await _db.Reservas
            .Where(r => r.Data >= dataInicio
                     && (r.Status == "confirmada" || r.Status == "utilizada"))
            .ToListAsync();

        // ── Visitantes hoje ──
        var visitantesHoje = reservasPeriodo
            .Where(r => r.Data == hoje)
            .Sum(r => r.QuantidadePessoas);

        // ── Visitantes ontem (para tendência diária) ──
        var ontem = hoje.AddDays(-1);
        var visitantesOntem = reservasPeriodo
            .Where(r => r.Data == ontem)
            .Sum(r => r.QuantidadePessoas);

        var visitantesTendencia = CalcularTendenciaSimples(visitantesHoje, visitantesOntem);

        // ── Permanência média ──
        var permanencias = reservasPeriodo.Select(r =>
        {
            if (r.Tipo == "camping" && r.DataFim.HasValue)
            {
                var diff = r.DataFim.Value.DayNumber - r.Data.DayNumber;
                return diff > 0 ? diff : 1;
            }
            return 1;
        }).ToList();

        var permanenciaMedia = permanencias.Count > 0
            ? Math.Round(permanencias.Average(), 1)
            : 0;

        // ── Ocupação média dos atrativos ativos ──
        var atrativos = await _db.Atrativos
            .Where(a => a.Status == "ativo")
            .Select(a => new { a.Nome, a.OcupacaoAtual, a.CapacidadeMaxima })
            .ToListAsync();

        var ocupacaoMedia = atrativos.Count > 0
            ? Math.Round(atrativos.Average(a =>
                a.CapacidadeMaxima > 0
                    ? (double)a.OcupacaoAtual / a.CapacidadeMaxima * 100
                    : 0), 1)
            : 0;

        // ── Pressão turística ──
        var pressaoTuristica = ocupacaoMedia switch
        {
            < 40 => "baixa",
            < 65 => "moderada",
            < 85 => "alta",
            _    => "critica"
        };

        // ── Visitantes por dia ──
        var visitantesPorDia = reservasPeriodo
            .GroupBy(r => r.Data)
            .OrderBy(g => g.Key)
            .Select(g => new DataPointDto(
                FormatarLabel(g.Key, periodo),
                g.Sum(r => r.QuantidadePessoas)))
            .ToList();

        // ── Ocupação por balneário ──
        var ocupacaoPorBalneario = atrativos
            .Select(a => new OcupacaoBalnearioDto(a.Nome, a.OcupacaoAtual, a.CapacidadeMaxima))
            .ToList();

        // ── Origem por UF (top 10) ──
        var origemPorUF = reservasPeriodo
            .GroupBy(r => r.UfOrigem)
            .Select(g => new OrigemUfDto(g.Key, g.Sum(r => r.QuantidadePessoas)))
            .OrderByDescending(o => o.Quantidade)
            .Take(10)
            .ToList();

        // ── Evolução mensal (últimos 6 meses) ──
        var inicioEvolucao = hoje.AddMonths(-6);
        var reservasEvolucao = await _db.Reservas
            .Where(r => r.Data >= inicioEvolucao
                     && (r.Status == "confirmada" || r.Status == "utilizada"))
            .ToListAsync();

        var evolucaoMensal = reservasEvolucao
            .GroupBy(r => new { r.Data.Year, r.Data.Month })
            .OrderBy(g => g.Key.Year).ThenBy(g => g.Key.Month)
            .Select(g => new DataPointDto(
                $"{g.Key.Month:D2}/{g.Key.Year}",
                g.Sum(r => r.QuantidadePessoas)))
            .ToList();

        // ── Top 5 atrativos ──
        var atrativoLookup = await _db.Atrativos
            .ToDictionaryAsync(a => a.Id, a => a.Nome);

        var topAtrativos = reservasPeriodo
            .GroupBy(r => r.AtrativoId)
            .Select(g =>
            {
                var nome = atrativoLookup.GetValueOrDefault(g.Key, "Desconhecido");
                var total = g.Sum(r => r.QuantidadePessoas);

                var metadeAnterior = g
                    .Where(r => r.Data < metade)
                    .Sum(r => r.QuantidadePessoas);
                var metadeAtual = g
                    .Where(r => r.Data >= metade)
                    .Sum(r => r.QuantidadePessoas);

                var tendencia = CalcularTendencia(metadeAtual, metadeAnterior);
                return new TopAtrativoDto(nome, total, tendencia);
            })
            .OrderByDescending(t => t.Visitantes)
            .Take(5)
            .ToList();

        return new DashboardDto(
            visitantesHoje,
            visitantesTendencia,
            permanenciaMedia,
            ocupacaoMedia,
            pressaoTuristica,
            visitantesPorDia,
            ocupacaoPorBalneario,
            origemPorUF,
            evolucaoMensal,
            topAtrativos
        );
    }

    private static string CalcularTendenciaSimples(int atual, int anterior)
    {
        if (anterior == 0) return atual > 0 ? "up" : "stable";
        if (atual > anterior) return "up";
        if (atual < anterior) return "down";
        return "stable";
    }

    private static string CalcularTendencia(int metadeAtual, int metadeAnterior)
    {
        if (metadeAnterior == 0) return metadeAtual > 0 ? "up" : "stable";
        if (metadeAtual > metadeAnterior * 1.05) return "up";
        if (metadeAtual < metadeAnterior * 0.95) return "down";
        return "stable";
    }

    private static string FormatarLabel(DateOnly data, string periodo)
    {
        return periodo switch
        {
            "6m"  => $"{data.Month:D2}/{data.Year}",
            "30d" => $"{data.Day:D2}/{data.Month:D2}",
            _     => data.ToString("ddd dd/MM")
        };
    }
}

// ─── DashboardController.cs ───

namespace EcoTurismo.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "admin,prefeitura")]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _service;

    public DashboardController(IDashboardService service) => _service = service;

    /// <summary>
    /// GET /api/dashboard?periodo=7d
    /// Períodos aceitos: 7d, 30d, 6m
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<DashboardDto>> Get([FromQuery] string periodo = "7d")
    {
        var data = await _service.GetDashboardAsync(periodo);
        return Ok(data);
    }
}
