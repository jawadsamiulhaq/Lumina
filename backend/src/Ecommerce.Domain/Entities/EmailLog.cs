using Ecommerce.Domain.Enums;

namespace Ecommerce.Domain.Entities;

/// <summary>A record of an outbound email (for the admin's "sent mail" log).</summary>
public class EmailLog
{
    public int Id { get; set; }
    public string ToEmail { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public EmailStatus Status { get; set; }
    public string? Error { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
