using Ecommerce.Domain.Enums;

namespace Ecommerce.Domain.Entities;

public class Order
{
    public int Id { get; set; }

    /// <summary>Identity user id. Kept as a bare int to avoid coupling Domain to Identity.</summary>
    public int UserId { get; set; }

    public OrderStatus Status { get; set; } = OrderStatus.Pending;

    /// <summary>Order total in integer cents (snapshot of item prices at purchase time).</summary>
    public int TotalInCents { get; set; }

    // Contact + shipping address snapshot
    public string Email { get; set; } = string.Empty;
    public string ShippingFullName { get; set; } = string.Empty;
    public string ShippingLine1 { get; set; } = string.Empty;
    public string? ShippingLine2 { get; set; }
    public string ShippingCity { get; set; } = string.Empty;
    public string? ShippingState { get; set; }
    public string ShippingPostalCode { get; set; } = string.Empty;
    public string ShippingCountry { get; set; } = string.Empty;

    // Stripe
    public string? StripeSessionId { get; set; }
    public string? StripePaymentIntentId { get; set; }

    // Status timeline
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? PaidAt { get; set; }
    public DateTime? ShippedAt { get; set; }
    public DateTime? DeliveredAt { get; set; }
    public DateTime? CancelledAt { get; set; }

    public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
}
