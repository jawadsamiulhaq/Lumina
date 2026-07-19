namespace Ecommerce.Application.DTOs;

public record EmailTemplateDto(
    string Key,
    string Name,
    string Subject,
    string HtmlBody,
    IReadOnlyList<string> Placeholders,
    DateTime UpdatedAt);

public class UpdateEmailTemplateRequest
{
    public string Subject { get; set; } = string.Empty;
    public string HtmlBody { get; set; } = string.Empty;
}
