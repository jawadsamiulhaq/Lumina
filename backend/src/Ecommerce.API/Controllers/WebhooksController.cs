using Ecommerce.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.API.Controllers;

[ApiController]
[Route("api/v1/webhooks")]
public class WebhooksController : ControllerBase
{
    private readonly IStripeService _stripe;
    private readonly IOrderService _orders;
    private readonly ILogger<WebhooksController> _logger;

    public WebhooksController(IStripeService stripe, IOrderService orders, ILogger<WebhooksController> logger)
    {
        _stripe = stripe;
        _orders = orders;
        _logger = logger;
    }

    /// <summary>Stripe webhook. Signature is verified before any processing.</summary>
    [AllowAnonymous]
    [HttpPost("stripe")]
    public async Task<IActionResult> Stripe(CancellationToken ct)
    {
        using var reader = new StreamReader(Request.Body);
        var payload = await reader.ReadToEndAsync(ct);
        var signature = Request.Headers["Stripe-Signature"].ToString();

        var evt = _stripe.ConstructEvent(payload, signature);

        if (evt.Type == "checkout.session.completed" && evt.SessionId is not null)
        {
            await _orders.MarkOrderPaidAsync(evt.SessionId, evt.PaymentIntentId, ct);
            _logger.LogInformation("Order fulfilled for Stripe session {SessionId}", evt.SessionId);
        }

        return Ok(new { received = true });
    }
}
