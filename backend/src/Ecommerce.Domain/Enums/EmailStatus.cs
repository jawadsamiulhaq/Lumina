namespace Ecommerce.Domain.Enums;

public enum EmailStatus
{
    /// <summary>Handed off to the SMTP server successfully.</summary>
    Sent = 0,

    /// <summary>SMTP disabled — the message was written to the application logs instead of sent.</summary>
    Logged = 1,

    /// <summary>Sending threw an error.</summary>
    Failed = 2
}
