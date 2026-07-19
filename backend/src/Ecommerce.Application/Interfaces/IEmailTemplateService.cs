using Ecommerce.Application.DTOs;

namespace Ecommerce.Application.Interfaces;

public record RenderedEmail(string Subject, string HtmlBody);

public interface IEmailTemplateService
{
    Task<EmailTemplateDto> GetAsync(string key, CancellationToken ct = default);
    Task<EmailTemplateDto> UpdateAsync(string key, UpdateEmailTemplateRequest request, CancellationToken ct = default);
    Task<EmailTemplateDto> ResetToDefaultAsync(string key, CancellationToken ct = default);

    /// <summary>Resolves a template (stored or default) and substitutes the given placeholder values.</summary>
    Task<RenderedEmail> RenderAsync(string key, IReadOnlyDictionary<string, string> values, CancellationToken ct = default);
}
