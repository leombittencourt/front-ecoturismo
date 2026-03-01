// ============================================================
// EcoTurismo.API — Upload de Imagens com Azure Blob Storage
// ============================================================
// Pacotes necessários:
//   dotnet add package Azure.Storage.Blobs
// ============================================================

// ─── 1. appsettings.json — Configuração ───

/*
{
  "AzureBlobStorage": {
    "ConnectionString": "DefaultEndpointsProtocol=https;AccountName=SEU_ACCOUNT;AccountKey=SUA_KEY;EndpointSuffix=core.windows.net",
    "ContainerBanners": "banners",
    "ContainerLogos": "logos",
    "ContainerAtrativos": "atrativos",
    "MaxFileSizeMB": 5,
    "AllowedExtensions": [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"]
  }
}
*/

// ─── 2. Settings POCO ───

namespace EcoTurismo.API.Settings;

public class AzureBlobSettings
{
    public string ConnectionString { get; set; } = string.Empty;
    public string ContainerBanners { get; set; } = "banners";
    public string ContainerLogos { get; set; } = "logos";
    public string ContainerAtrativos { get; set; } = "atrativos";
    public int MaxFileSizeMB { get; set; } = 5;
    public string[] AllowedExtensions { get; set; } = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"];
}

// ─── 3. DTOs de Upload ───

namespace EcoTurismo.API.DTOs;

public record UploadResultDto(
    string Url,
    string FileName,
    string Container,
    long SizeBytes
);

public record UploadErrorDto(string Message);

// ─── 4. Interface do Serviço ───

namespace EcoTurismo.API.Services;

using Microsoft.AspNetCore.Http;

public interface IImageUploadService
{
    /// <summary>
    /// Faz upload de uma imagem para o Azure Blob Storage.
    /// </summary>
    /// <param name="file">Arquivo enviado via multipart/form-data</param>
    /// <param name="container">Nome do container (banners, logos, atrativos)</param>
    /// <param name="subfolder">Subpasta opcional (ex: municipioId)</param>
    /// <returns>URL pública do blob</returns>
    Task<string> UploadAsync(IFormFile file, string container, string? subfolder = null);

    /// <summary>
    /// Exclui um blob pelo URL.
    /// </summary>
    Task<bool> DeleteAsync(string blobUrl);

    /// <summary>
    /// Valida se o arquivo é permitido (extensão e tamanho).
    /// </summary>
    bool IsValid(IFormFile file, out string errorMessage);
}

// ─── 5. Implementação do Serviço ───

namespace EcoTurismo.API.Services;

using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using EcoTurismo.API.Settings;

public class ImageUploadService : IImageUploadService
{
    private readonly BlobServiceClient _blobServiceClient;
    private readonly AzureBlobSettings _settings;

    public ImageUploadService(IOptions<AzureBlobSettings> settings)
    {
        _settings = settings.Value;
        _blobServiceClient = new BlobServiceClient(_settings.ConnectionString);
    }

    public bool IsValid(IFormFile file, out string errorMessage)
    {
        errorMessage = string.Empty;

        if (file == null || file.Length == 0)
        {
            errorMessage = "Nenhum arquivo enviado.";
            return false;
        }

        var maxBytes = _settings.MaxFileSizeMB * 1024 * 1024;
        if (file.Length > maxBytes)
        {
            errorMessage = $"Arquivo excede o limite de {_settings.MaxFileSizeMB}MB.";
            return false;
        }

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!_settings.AllowedExtensions.Contains(ext))
        {
            errorMessage = $"Extensão '{ext}' não permitida. Use: {string.Join(", ", _settings.AllowedExtensions)}";
            return false;
        }

        return true;
    }

    public async Task<string> UploadAsync(IFormFile file, string container, string? subfolder = null)
    {
        // Garante que o container existe com acesso público de blob
        var containerClient = _blobServiceClient.GetBlobContainerClient(container);
        await containerClient.CreateIfNotExistsAsync(PublicAccessType.Blob);

        // Gera nome único: subfolder/guid-original.ext
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        var safeName = $"{Guid.NewGuid():N}{ext}";
        var blobName = string.IsNullOrEmpty(subfolder)
            ? safeName
            : $"{subfolder}/{safeName}";

        var blobClient = containerClient.GetBlobClient(blobName);

        // Upload com content-type correto
        var headers = new BlobHttpHeaders
        {
            ContentType = file.ContentType
        };

        await using var stream = file.OpenReadStream();
        await blobClient.UploadAsync(stream, new BlobUploadOptions
        {
            HttpHeaders = headers
        });

        return blobClient.Uri.ToString();
    }

    public async Task<bool> DeleteAsync(string blobUrl)
    {
        try
        {
            var uri = new Uri(blobUrl);
            // Extrai container e blob name do URL
            // Formato: https://account.blob.core.windows.net/container/blobname
            var segments = uri.AbsolutePath.TrimStart('/').Split('/', 2);
            if (segments.Length < 2) return false;

            var containerName = segments[0];
            var blobName = segments[1];

            var containerClient = _blobServiceClient.GetBlobContainerClient(containerName);
            var blobClient = containerClient.GetBlobClient(blobName);

            var response = await blobClient.DeleteIfExistsAsync();
            return response.Value;
        }
        catch
        {
            return false;
        }
    }
}

// ─── 6. Controller de Upload ───

namespace EcoTurismo.API.Controllers;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using EcoTurismo.API.DTOs;
using EcoTurismo.API.Services;
using EcoTurismo.API.Data;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Route("api/uploads")]
[Authorize(Roles = "admin,prefeitura")]
public class UploadsController : ControllerBase
{
    private readonly IImageUploadService _upload;
    private readonly EcoTurismoDbContext _db;

    public UploadsController(IImageUploadService upload, EcoTurismoDbContext db)
    {
        _upload = upload;
        _db = db;
    }

    // ─── Upload genérico ───

    /// <summary>
    /// POST /api/uploads/{container}
    /// container: "banners", "logos" ou "atrativos"
    /// Form-data: file (multipart)
    /// Opcional query: ?subfolder=municipio-id
    /// </summary>
    [HttpPost("{container}")]
    public async Task<IActionResult> Upload(
        string container,
        [FromQuery] string? subfolder,
        IFormFile file)
    {
        // Validar container permitido
        var allowed = new[] { "banners", "logos", "atrativos" };
        if (!allowed.Contains(container.ToLower()))
            return BadRequest(new UploadErrorDto("Container inválido. Use: banners, logos ou atrativos."));

        // Validar arquivo
        if (!_upload.IsValid(file, out var error))
            return BadRequest(new UploadErrorDto(error));

        var url = await _upload.UploadAsync(file, container.ToLower(), subfolder);

        return Ok(new UploadResultDto(
            Url: url,
            FileName: file.FileName,
            Container: container.ToLower(),
            SizeBytes: file.Length
        ));
    }

    // ─── Upload + vincular banner ───

    /// <summary>
    /// POST /api/uploads/banners/create
    /// Form-data: file, titulo?, subtitulo?, link?, ordem?, ativo?
    /// Faz upload da imagem E cria o registro do banner em uma operação.
    /// </summary>
    [HttpPost("banners/create")]
    public async Task<IActionResult> UploadAndCreateBanner(
        IFormFile file,
        [FromForm] string? titulo,
        [FromForm] string? subtitulo,
        [FromForm] string? link,
        [FromForm] int ordem = 0,
        [FromForm] bool ativo = true)
    {
        if (!_upload.IsValid(file, out var error))
            return BadRequest(new UploadErrorDto(error));

        var url = await _upload.UploadAsync(file, "banners");

        var banner = new Models.Banner
        {
            Id = Guid.NewGuid(),
            Titulo = titulo,
            Subtitulo = subtitulo,
            ImagemUrl = url,
            Link = link,
            Ordem = ordem,
            Ativo = ativo,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        _db.Banners.Add(banner);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(Upload), new
        {
            banner = new BannerDto(
                banner.Id, banner.Titulo, banner.Subtitulo,
                banner.ImagemUrl, banner.Link, banner.Ordem, banner.Ativo
            ),
            upload = new UploadResultDto(url, file.FileName, "banners", file.Length)
        });
    }

    // ─── Upload + vincular logo do município ───

    /// <summary>
    /// POST /api/uploads/logos/municipio/{municipioId}
    /// Form-data: file
    /// Faz upload da logo E atualiza o campo logo do município.
    /// </summary>
    [HttpPost("logos/municipio/{municipioId}")]
    public async Task<IActionResult> UploadMunicipioLogo(Guid municipioId, IFormFile file)
    {
        if (!_upload.IsValid(file, out var error))
            return BadRequest(new UploadErrorDto(error));

        var municipio = await _db.Municipios.FindAsync(municipioId);
        if (municipio == null)
            return NotFound(new UploadErrorDto("Município não encontrado."));

        // Remove logo antiga se existir
        if (!string.IsNullOrEmpty(municipio.Logo))
            await _upload.DeleteAsync(municipio.Logo);

        var url = await _upload.UploadAsync(file, "logos", municipioId.ToString());

        municipio.Logo = url;
        await _db.SaveChangesAsync();

        return Ok(new
        {
            municipioId,
            logoUrl = url,
            upload = new UploadResultDto(url, file.FileName, "logos", file.Length)
        });
    }

    // ─── Upload + vincular imagem do atrativo ───

    /// <summary>
    /// POST /api/uploads/atrativos/{atrativoId}/imagem
    /// Form-data: file
    /// Faz upload da imagem E atualiza o campo imagem do atrativo.
    /// </summary>
    [HttpPost("atrativos/{atrativoId}/imagem")]
    public async Task<IActionResult> UploadAtrativoImagem(Guid atrativoId, IFormFile file)
    {
        if (!_upload.IsValid(file, out var error))
            return BadRequest(new UploadErrorDto(error));

        var atrativo = await _db.Atrativos.FindAsync(atrativoId);
        if (atrativo == null)
            return NotFound(new UploadErrorDto("Atrativo não encontrado."));

        // Remove imagem antiga se existir
        if (!string.IsNullOrEmpty(atrativo.Imagem))
            await _upload.DeleteAsync(atrativo.Imagem);

        var url = await _upload.UploadAsync(file, "atrativos", atrativoId.ToString());

        atrativo.Imagem = url;
        await _db.SaveChangesAsync();

        return Ok(new
        {
            atrativoId,
            imagemUrl = url,
            upload = new UploadResultDto(url, file.FileName, "atrativos", file.Length)
        });
    }

    // ─── Deletar imagem ───

    /// <summary>
    /// DELETE /api/uploads?url=https://...
    /// Remove o blob do Azure Storage.
    /// </summary>
    [HttpDelete]
    public async Task<IActionResult> Delete([FromQuery] string url)
    {
        if (string.IsNullOrEmpty(url))
            return BadRequest(new UploadErrorDto("URL é obrigatória."));

        var deleted = await _upload.DeleteAsync(url);
        return deleted ? NoContent() : NotFound();
    }
}

// ─── 7. Registro no Program.cs ───
// Adicione ao Program.cs:

/*
using EcoTurismo.API.Settings;
using EcoTurismo.API.Services;

// Após builder.Services.AddScoped<IQuiosqueService, QuiosqueService>();

// Azure Blob Storage
builder.Services.Configure<AzureBlobSettings>(
    builder.Configuration.GetSection("AzureBlobStorage"));
builder.Services.AddScoped<IImageUploadService, ImageUploadService>();
*/
