namespace Ecommerce.Application.Interfaces;

public interface IEmailSender
{
    /// <summary>Sends an HTML email. Implementations may fall back to logging when SMTP is not configured.</summary>
    Task SendAsync(string to, string subject, string htmlBody, CancellationToken ct = default);
}
