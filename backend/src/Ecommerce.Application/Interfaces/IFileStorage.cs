namespace Ecommerce.Application.Interfaces;

/// <summary>
/// Abstraction over blob storage. The local implementation writes to wwwroot/uploads;
/// it can be swapped for Azure Blob / S3 without touching callers.
/// </summary>
public interface IFileStorage
{
    Task<string> SaveAsync(Stream content, string originalFileName, string contentType, CancellationToken ct = default);
    Task DeleteAsync(string url, CancellationToken ct = default);
}
