using System.Net;
using System.Text.RegularExpressions;
using Ecommerce.Application.Common;
using Ecommerce.Application.DTOs;
using Ecommerce.Application.Interfaces;
using Ecommerce.Domain.Entities;
using Ecommerce.Infrastructure.Email;
using Ecommerce.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Infrastructure.Services;

public class EmailTemplateService : IEmailTemplateService
{
    private readonly AppDbContext _db;

    public EmailTemplateService(AppDbContext db) => _db = db;

    public async Task<EmailTemplateDto> GetAsync(string key, CancellationToken ct = default)
    {
        var def = RequireDefinition(key);
        var entity = await EnsureExistsAsync(def, ct);
        return ToDto(entity, def);
    }

    public async Task<EmailTemplateDto> UpdateAsync(string key, UpdateEmailTemplateRequest request, CancellationToken ct = default)
    {
        var def = RequireDefinition(key);

        var subject = request.Subject?.Trim() ?? string.Empty;
        var body = request.HtmlBody ?? string.Empty;
        if (string.IsNullOrWhiteSpace(subject)) throw new BadRequestException("Subject is required.");
        if (string.IsNullOrWhiteSpace(body)) throw new BadRequestException("Body is required.");

        // Guard essential placeholders so an edit can't quietly break the flow (e.g. drop the reset link).
        foreach (var required in def.Required)
        {
            if (!PlaceholderRegex(required).IsMatch(body))
                throw new BadRequestException($"The body must include the {{{{{required}}}}} placeholder.");
        }

        var entity = await EnsureExistsAsync(def, ct);
        entity.Subject = subject;
        entity.HtmlBody = body;
        entity.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return ToDto(entity, def);
    }

    public async Task<EmailTemplateDto> ResetToDefaultAsync(string key, CancellationToken ct = default)
    {
        var def = RequireDefinition(key);
        var entity = await EnsureExistsAsync(def, ct);
        entity.Subject = def.Subject;
        entity.HtmlBody = def.HtmlBody;
        entity.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return ToDto(entity, def);
    }

    public async Task<RenderedEmail> RenderAsync(string key, IReadOnlyDictionary<string, string> values, CancellationToken ct = default)
    {
        var def = RequireDefinition(key);
        var entity = await _db.EmailTemplates.AsNoTracking().FirstOrDefaultAsync(t => t.Key == def.Key, ct);
        var subject = entity?.Subject ?? def.Subject;
        var body = entity?.HtmlBody ?? def.HtmlBody;

        foreach (var (name, value) in values)
        {
            var encoded = WebUtility.HtmlEncode(value ?? string.Empty);
            // MatchEvaluator (not a replacement string) so any '$' in the value isn't treated as a group ref.
            subject = PlaceholderRegex(name).Replace(subject, _ => encoded);
            body = PlaceholderRegex(name).Replace(body, _ => encoded);
        }

        return new RenderedEmail(subject, body);
    }

    // ---- helpers ----

    /// <summary>Matches {{ name }} with optional surrounding whitespace, case-insensitively.</summary>
    private static Regex PlaceholderRegex(string name) =>
        new(@"\{\{\s*" + Regex.Escape(name) + @"\s*\}\}", RegexOptions.IgnoreCase);

    private static EmailTemplateDefaults.Definition RequireDefinition(string key) =>
        EmailTemplateDefaults.Find(key) ?? throw new NotFoundException("EmailTemplate", key);

    private async Task<EmailTemplate> EnsureExistsAsync(EmailTemplateDefaults.Definition def, CancellationToken ct)
    {
        var entity = await _db.EmailTemplates.FirstOrDefaultAsync(t => t.Key == def.Key, ct);
        if (entity is not null) return entity;

        entity = new EmailTemplate
        {
            Key = def.Key,
            Subject = def.Subject,
            HtmlBody = def.HtmlBody,
            UpdatedAt = DateTime.UtcNow,
        };
        _db.EmailTemplates.Add(entity);
        await _db.SaveChangesAsync(ct);
        return entity;
    }

    private static EmailTemplateDto ToDto(EmailTemplate e, EmailTemplateDefaults.Definition def) =>
        new(e.Key, def.Name, e.Subject, e.HtmlBody, def.Placeholders, e.UpdatedAt);
}
