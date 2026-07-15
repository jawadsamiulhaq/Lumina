using Ecommerce.Application.Interfaces;
using Ecommerce.Infrastructure.Settings;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Options;

namespace Ecommerce.Infrastructure.Services;

/// <summary>
/// Saves files to wwwroot/{UploadsFolder} and returns a web-relative URL (e.g. /uploads/abc.jpg).
/// Swap this registration for an Azure Blob / S3 implementation of <see cref="IFileStorage"/>.
/// </summary>
public class LocalFileStorage : IFileStorage
{
    private readonly IWebHostEnvironment _env;
    private readonly StorageSettings _settings;

    public LocalFileStorage(IWebHostEnvironment env, IOptions<StorageSettings> settings)
    {
        _env = env;
        _settings = settings.Value;
    }

    private string WebRoot => _env.WebRootPath
        ?? Path.Combine(_env.ContentRootPath, "wwwroot");

    public async Task<string> SaveAsync(Stream content, string originalFileName, string contentType, CancellationToken ct = default)
    {
        var ext = Path.GetExtension(originalFileName).ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(ext)) ext = ".bin";

        var folder = Path.Combine(WebRoot, _settings.UploadsFolder);
        Directory.CreateDirectory(folder);

        var fileName = $"{Guid.NewGuid():N}{ext}";
        var fullPath = Path.Combine(folder, fileName);

        await using (var fs = new FileStream(fullPath, FileMode.CreateNew, FileAccess.Write, FileShare.None))
        {
            await content.CopyToAsync(fs, ct);
        }

        return $"/{_settings.UploadsFolder}/{fileName}";
    }

    public Task DeleteAsync(string url, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(url)) return Task.CompletedTask;
        var relative = url.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
        var fullPath = Path.Combine(WebRoot, relative);
        if (File.Exists(fullPath))
        {
            try { File.Delete(fullPath); } catch { /* best-effort cleanup */ }
        }
        return Task.CompletedTask;
    }
}
