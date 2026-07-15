using Ecommerce.Application.Common;
using Ecommerce.Application.DTOs;
using Ecommerce.Domain.Enums;

namespace Ecommerce.Application.Interfaces;

public interface IOrderService
{
    // Checkout
    Task<CheckoutSessionDto> CreateCheckoutSessionAsync(int userId, CreateCheckoutRequest request, CancellationToken ct = default);

    /// <summary>Idempotently marks the order paid, decrements stock and clears the cart (called by the Stripe webhook).</summary>
    Task MarkOrderPaidAsync(string stripeSessionId, string? paymentIntentId, CancellationToken ct = default);

    // Customer
    Task<PagedResult<OrderListItemDto>> GetForUserAsync(int userId, int page, int pageSize, CancellationToken ct = default);
    Task<OrderDto> GetByIdForUserAsync(int id, int userId, CancellationToken ct = default);

    // Admin
    Task<PagedResult<OrderListItemDto>> GetAllAsync(int page, int pageSize, OrderStatus? status, CancellationToken ct = default);
    Task<OrderDto> GetByIdAsync(int id, CancellationToken ct = default);
    Task<OrderDto> UpdateStatusAsync(int id, OrderStatus status, CancellationToken ct = default);
}
