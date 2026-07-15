using Ecommerce.Application.Common;
using Ecommerce.Application.DTOs;
using Ecommerce.Application.Interfaces;
using Ecommerce.Domain.Constants;
using Ecommerce.Infrastructure.Settings;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;

namespace Ecommerce.API.Controllers;

[Authorize(Roles = Roles.Admin)]
[EnableRateLimiting("upload")]
public class UploadsController : BaseApiController
{
    private readonly IFileStorage _storage;
    private readonly StorageSettings _settings;

    public UploadsController(IFileStorage storage, IOptions<StorageSettings> settings)
    {
        _storage = storage;
        _settings = settings.Value;
    }

    /// <summary>Uploads a single image file. Admin only. Validates content type and size.</summary>
    [HttpPost("image")]
    [RequestSizeLimit(10 * 1024 * 1024)]
    [ProducesResponseType(typeof(UploadResultDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<UploadResultDto>> UploadImage(IFormFile file, CancellationToken ct)
    {
        if (file is null || file.Length == 0)
            throw new BadRequestException("No file was provided.");

        if (file.Length > _settings.MaxFileSizeBytes)
            throw new BadRequestException($"File exceeds the maximum size of {_settings.MaxFileSizeBytes / (1024 * 1024)} MB.");

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!_settings.AllowedContentTypes.Contains(file.ContentType) || !_settings.AllowedExtensions.Contains(ext))
            throw new BadRequestException("Unsupported file type. Allowed: JPG, PNG, WEBP, GIF, AVIF.");

        await using var stream = file.OpenReadStream();
        var url = await _storage.SaveAsync(stream, file.FileName, file.ContentType, ct);
        return Ok(new UploadResultDto(url, file.FileName, file.Length));
    }
}
