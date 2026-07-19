using Ecommerce.Application.Common;
using Ecommerce.Application.DTOs;
using Ecommerce.Application.Interfaces;
using Ecommerce.Domain.Entities;
using Ecommerce.Domain.Enums;
using Ecommerce.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Infrastructure.Services;

public class EmailLogService : IEmailLogService
{
    private readonly AppDbContext _db;
    private readonly ILogger<EmailLogService> _logger;

    public EmailLogService(AppDbContext db, ILogger<EmailLogService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task RecordAsync(string toEmail, string subject, string body, EmailStatus status, string? error, CancellationToken ct = default)
    {
        try
        {
            _db.EmailLogs.Add(new EmailLog
            {
                ToEmail = toEmail,
                Subject = subject,
                Body = body,
                Status = status,
                Error = error,
                CreatedAt = DateTime.UtcNow,
            });
            await _db.SaveChangesAsync(ct);
        }
        catch (Exception ex)
        {
            // A failure to write the audit log must never bubble up and break the actual email flow.
            _logger.LogError(ex, "Failed to persist email log for {To}.", toEmail);
        }
    }

    public async Task<PagedResult<EmailLogListItemDto>> GetAsync(int page, int pageSize, CancellationToken ct = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var q = _db.EmailLogs.AsNoTracking().OrderByDescending(e => e.CreatedAt).ThenByDescending(e => e.Id);
        var total = await q.CountAsync(ct);
        var items = await q.Skip((page - 1) * pageSize).Take(pageSize)
            .Select(e => new EmailLogListItemDto(e.Id, e.ToEmail, e.Subject, e.Status.ToString(), e.Error != null, e.CreatedAt))
            .ToListAsync(ct);

        return new PagedResult<EmailLogListItemDto>(items, page, pageSize, total);
    }

    public async Task<EmailLogDto> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var e = await _db.EmailLogs.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, ct)
            ?? throw new NotFoundException("EmailLog", id);
        return new EmailLogDto(e.Id, e.ToEmail, e.Subject, e.Body, e.Status.ToString(), e.Error, e.CreatedAt);
    }
}
