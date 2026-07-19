namespace Ecommerce.Domain.Entities;

/// <summary>An admin-editable email template (subject + HTML body) identified by a stable key.</summary>
public class EmailTemplate
{
    public int Id { get; set; }
    public string Key { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string HtmlBody { get; set; } = string.Empty;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
