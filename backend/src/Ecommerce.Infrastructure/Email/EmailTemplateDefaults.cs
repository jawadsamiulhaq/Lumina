using Ecommerce.Domain.Constants;

namespace Ecommerce.Infrastructure.Email;

/// <summary>Built-in default content + metadata for each editable email template.</summary>
public static class EmailTemplateDefaults
{
    public record Definition(string Key, string Name, string Subject, string HtmlBody, string[] Placeholders, string[] Required);

    public static readonly IReadOnlyList<Definition> All = new[]
    {
        new Definition(
            EmailTemplateKeys.PasswordReset,
            "Password reset",
            "Reset your Lumina password",
            """
            <p>Hi {{firstName}},</p>
            <p>We received a request to reset your password. Click the link below to choose a new one. If you didn't request this, you can safely ignore this email.</p>
            <p><a href="{{resetLink}}">Reset your password</a></p>
            <p>This link will expire shortly for your security.</p>
            """,
            Placeholders: new[] { "firstName", "resetLink" },
            Required: new[] { "resetLink" }),
    };

    public static Definition? Find(string key) =>
        All.FirstOrDefault(d => string.Equals(d.Key, key, StringComparison.OrdinalIgnoreCase));
}
