using Ecommerce.Domain.Enums;

namespace Ecommerce.Application.DTOs;

public record OrderItemDto(
    string ProductName,
    string? ProductSlug,
    string? ImageUrl,
    int UnitPriceInCents,
    int Quantity,
    int LineTotalInCents);

public record OrderTimelineDto(
    DateTime CreatedAt,
    DateTime? PaidAt,
    DateTime? ShippedAt,
    DateTime? DeliveredAt,
    DateTime? CancelledAt);

public record OrderDto(
    int Id,
    string Status,
    int TotalInCents,
    string Email,
    string ShippingFullName,
    string ShippingLine1,
    string? ShippingLine2,
    string ShippingCity,
    string? ShippingState,
    string ShippingPostalCode,
    string ShippingCountry,
    OrderTimelineDto Timeline,
    IReadOnlyList<OrderItemDto> Items,
    DateTime CreatedAt);

public record OrderListItemDto(
    int Id,
    string Status,
    int TotalInCents,
    int ItemCount,
    string Email,
    DateTime CreatedAt);

/// <summary>Number of orders in each status, for the admin orders overview.</summary>
public record OrderStatusCountsDto(
    int Pending,
    int Paid,
    int Shipped,
    int Delivered,
    int Cancelled,
    int Total);

public class ShippingAddressInput
{
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Line1 { get; set; } = string.Empty;
    public string? Line2 { get; set; }
    public string City { get; set; } = string.Empty;
    public string? State { get; set; }
    public string PostalCode { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
}

public class CreateCheckoutRequest
{
    public ShippingAddressInput Shipping { get; set; } = new();
}

public record CheckoutSessionDto(string SessionId, string Url);

public class UpdateOrderStatusRequest
{
    public OrderStatus Status { get; set; }
}
