using Ecommerce.Application.Common;
using Ecommerce.Application.DTOs;
using Ecommerce.Application.Interfaces;
using Ecommerce.Domain.Entities;
using Ecommerce.Infrastructure.Settings;
using Microsoft.Extensions.Options;
using Stripe;
using Stripe.Checkout;

namespace Ecommerce.Infrastructure.Services;

public class StripeService : IStripeService
{
    private readonly StripeSettings _stripe;
    private readonly FrontendSettings _frontend;

    public StripeService(IOptions<StripeSettings> stripe, IOptions<FrontendSettings> frontend)
    {
        _stripe = stripe.Value;
        _frontend = frontend.Value;
        if (!string.IsNullOrWhiteSpace(_stripe.SecretKey))
            StripeConfiguration.ApiKey = _stripe.SecretKey;
    }

    public async Task<CheckoutSessionDto> CreateCheckoutSessionAsync(Order order, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(_stripe.SecretKey))
            throw new BadRequestException("Stripe is not configured. Set Stripe:SecretKey.");

        var lineItems = order.Items.Select(i => new SessionLineItemOptions
        {
            Quantity = i.Quantity,
            PriceData = new SessionLineItemPriceDataOptions
            {
                Currency = _stripe.Currency,
                UnitAmount = i.UnitPriceInCents,
                ProductData = new SessionLineItemPriceDataProductDataOptions
                {
                    Name = i.ProductName
                }
            }
        }).ToList();

        var baseUrl = _frontend.BaseUrl.TrimEnd('/');
        var options = new SessionCreateOptions
        {
            Mode = "payment",
            LineItems = lineItems,
            ClientReferenceId = order.Id.ToString(),
            CustomerEmail = order.Email,
            SuccessUrl = $"{baseUrl}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}",
            CancelUrl = $"{baseUrl}/checkout/cancel",
            Metadata = new Dictionary<string, string> { ["orderId"] = order.Id.ToString() }
        };

        var service = new SessionService();
        var session = await service.CreateAsync(options, cancellationToken: ct);
        return new CheckoutSessionDto(session.Id, session.Url);
    }

    public StripeWebhookResult ConstructEvent(string payload, string signatureHeader)
    {
        if (string.IsNullOrWhiteSpace(_stripe.WebhookSecret))
            throw new BadRequestException("Stripe webhook secret is not configured.");

        Event stripeEvent;
        try
        {
            stripeEvent = EventUtility.ConstructEvent(payload, signatureHeader, _stripe.WebhookSecret);
        }
        catch (StripeException ex)
        {
            throw new BadRequestException($"Invalid Stripe signature: {ex.Message}");
        }

        string? sessionId = null;
        string? paymentIntentId = null;
        if (stripeEvent.Data.Object is Session session)
        {
            sessionId = session.Id;
            paymentIntentId = session.PaymentIntentId;
        }

        return new StripeWebhookResult(stripeEvent.Type, sessionId, paymentIntentId);
    }
}
