namespace Ecommerce.Infrastructure.Settings;

public class JwtSettings
{
    public const string SectionName = "Jwt";
    public string Issuer { get; set; } = "Ecommerce.API";
    public string Audience { get; set; } = "Ecommerce.Client";
    public string Secret { get; set; } = string.Empty;
    public int AccessTokenMinutes { get; set; } = 15;
    public int RefreshTokenDays { get; set; } = 7;
}

public class StripeSettings
{
    public const string SectionName = "Stripe";
    public string SecretKey { get; set; } = string.Empty;
    public string PublishableKey { get; set; } = string.Empty;
    public string WebhookSecret { get; set; } = string.Empty;
    public string Currency { get; set; } = "usd";
}

public class StorageSettings
{
    public const string SectionName = "Storage";
    /// <summary>Sub-folder under wwwroot where uploads are stored.</summary>
    public string UploadsFolder { get; set; } = "uploads";
    public long MaxFileSizeBytes { get; set; } = 5 * 1024 * 1024; // 5 MB
    public string[] AllowedContentTypes { get; set; } =
        { "image/jpeg", "image/png", "image/webp", "image/gif", "image/avif" };
    public string[] AllowedExtensions { get; set; } =
        { ".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif" };
}

public class FrontendSettings
{
    public const string SectionName = "Frontend";
    public string BaseUrl { get; set; } = "http://localhost:5173";
}

public class EmailSettings
{
    public const string SectionName = "Email";

    /// <summary>When false, emails are written to the logs instead of being sent (handy for local dev).</summary>
    public bool Enabled { get; set; }
    public string Host { get; set; } = string.Empty;
    public int Port { get; set; } = 587;
    public bool UseSsl { get; set; } = true;
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FromEmail { get; set; } = "no-reply@lumina.local";
    public string FromName { get; set; } = "Lumina";
}

public class PaymentSettings
{
    public const string SectionName = "Payments";

    /// <summary>
    /// When true, checkout skips Stripe entirely: the order is created and marked Paid
    /// immediately so the full order flow can be tested without a payment provider.
    /// Intended for development/testing only — leave false in production.
    /// </summary>
    public bool BypassPayment { get; set; }
}
