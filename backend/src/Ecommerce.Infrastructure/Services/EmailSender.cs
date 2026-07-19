using System.Net;
using System.Net.Mail;
using Ecommerce.Application.Interfaces;
using Ecommerce.Domain.Enums;
using Ecommerce.Infrastructure.Settings;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Ecommerce.Infrastructure.Services;

/// <summary>
/// Sends email over SMTP when configured (Email:Enabled = true). Otherwise it logs the message,
/// so flows like password reset work end-to-end in development without a real mail server.
/// Every attempt is recorded to the email log so admins can see what went out.
/// </summary>
public class EmailSender : IEmailSender
{
    private readonly EmailSettings _settings;
    private readonly IEmailLogService _log;
    private readonly ILogger<EmailSender> _logger;

    public EmailSender(IOptions<EmailSettings> settings, IEmailLogService log, ILogger<EmailSender> logger)
    {
        _settings = settings.Value;
        _log = log;
        _logger = logger;
    }

    public async Task SendAsync(string to, string subject, string htmlBody, CancellationToken ct = default)
    {
        if (!_settings.Enabled || string.IsNullOrWhiteSpace(_settings.Host))
        {
            _logger.LogInformation(
                "Email (SMTP disabled) → To: {To} | Subject: {Subject}\n{Body}",
                to, subject, htmlBody);
            await _log.RecordAsync(to, subject, htmlBody, EmailStatus.Logged, null, ct);
            return;
        }

        try
        {
            using var message = new MailMessage
            {
                From = new MailAddress(_settings.FromEmail, _settings.FromName),
                Subject = subject,
                Body = htmlBody,
                IsBodyHtml = true,
            };
            message.To.Add(to);

            using var client = new SmtpClient(_settings.Host, _settings.Port)
            {
                EnableSsl = _settings.UseSsl,
                Credentials = string.IsNullOrWhiteSpace(_settings.Username)
                    ? CredentialCache.DefaultNetworkCredentials
                    : new NetworkCredential(_settings.Username, _settings.Password),
            };

            await client.SendMailAsync(message, ct);
            _logger.LogInformation("Sent email to {To} ({Subject}).", to, subject);
            await _log.RecordAsync(to, subject, htmlBody, EmailStatus.Sent, null, ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {To}.", to);
            await _log.RecordAsync(to, subject, htmlBody, EmailStatus.Failed, ex.Message, ct);
            throw;
        }
    }
}
