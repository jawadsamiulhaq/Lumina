using Ecommerce.Application.Common;
using Ecommerce.Application.DTOs;
using Ecommerce.Domain.Enums;

namespace Ecommerce.Application.Interfaces;

public interface IEmailLogService
{
    /// <summary>Persists a record of an outbound email. Never throws — logging must not break sending.</summary>
    Task RecordAsync(string toEmail, string subject, string body, EmailStatus status, string? error, CancellationToken ct = default);

    Task<PagedResult<EmailLogListItemDto>> GetAsync(int page, int pageSize, CancellationToken ct = default);
    Task<EmailLogDto> GetByIdAsync(int id, CancellationToken ct = default);
}
