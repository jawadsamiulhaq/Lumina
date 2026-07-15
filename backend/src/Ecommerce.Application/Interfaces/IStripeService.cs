using Ecommerce.Application.DTOs;
using Ecommerce.Domain.Entities;

namespace Ecommerce.Application.Interfaces;

/// <summary>Normalized Stripe webhook event so the Stripe SDK never leaks into the API layer.</summary>
public record StripeWebhookResult(string Type, string? SessionId, string? PaymentIntentId);

public interface IStripeService
{
    Task<CheckoutSessionDto> CreateCheckoutSessionAsync(Order order, CancellationToken ct = default);

    /// <summary>Verifies the webhook signature and returns a normalized event, or throws on invalid signature.</summary>
    StripeWebhookResult ConstructEvent(string payload, string signatureHeader);
}
