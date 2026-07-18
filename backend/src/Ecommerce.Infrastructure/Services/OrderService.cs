using Ecommerce.Application.Common;
using Ecommerce.Application.DTOs;
using Ecommerce.Application.Interfaces;
using Ecommerce.Domain.Entities;
using Ecommerce.Domain.Enums;
using Ecommerce.Infrastructure.Persistence;
using Ecommerce.Infrastructure.Settings;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Ecommerce.Infrastructure.Services;

public class OrderService : IOrderService
{
    private readonly AppDbContext _db;
    private readonly IStripeService _stripe;
    private readonly PaymentSettings _payments;
    private readonly FrontendSettings _frontend;

    public OrderService(
        AppDbContext db,
        IStripeService stripe,
        IOptions<PaymentSettings> payments,
        IOptions<FrontendSettings> frontend)
    {
        _db = db;
        _stripe = stripe;
        _payments = payments.Value;
        _frontend = frontend.Value;
    }

    public async Task<CheckoutSessionDto> CreateCheckoutSessionAsync(int userId, CreateCheckoutRequest request, CancellationToken ct = default)
    {
        var cart = await _db.Carts
            .Include(c => c.Items).ThenInclude(i => i.Product).ThenInclude(p => p!.Images)
            .Include(c => c.Items).ThenInclude(i => i.ProductVariant).ThenInclude(v => v!.Values).ThenInclude(vv => vv.OptionValue).ThenInclude(ov => ov!.Option)
            .FirstOrDefaultAsync(c => c.UserId == userId, ct);

        if (cart is null || cart.Items.Count == 0)
            throw new BadRequestException("Your cart is empty.");

        var s = request.Shipping;
        var order = new Order
        {
            UserId = userId,
            Status = OrderStatus.Pending,
            Email = s.Email.Trim(),
            ShippingFullName = s.FullName.Trim(),
            ShippingLine1 = s.Line1.Trim(),
            ShippingLine2 = s.Line2?.Trim(),
            ShippingCity = s.City.Trim(),
            ShippingState = s.State?.Trim(),
            ShippingPostalCode = s.PostalCode.Trim(),
            ShippingCountry = s.Country.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        foreach (var item in cart.Items)
        {
            var p = item.Product ?? throw new BadRequestException("A product in your cart no longer exists.");
            if (!p.IsActive)
                throw new BadRequestException($"'{p.Name}' is no longer available.");

            var variant = item.ProductVariant;
            if (variant is not null && !variant.IsActive)
                throw new BadRequestException($"The selected option for '{p.Name}' is no longer available.");

            var available = variant?.Stock ?? p.Stock;
            if (item.Quantity > available)
                throw new BadRequestException($"Only {available} unit(s) of '{p.Name}' are in stock.");

            order.Items.Add(new OrderItem
            {
                ProductId = p.Id,
                ProductVariantId = variant?.Id,
                ProductName = p.Name,
                ProductSlug = p.Slug,
                VariantDescription = variant is not null ? VariantHelpers.BuildDescription(variant) : null,
                ImageUrl = p.Images.OrderByDescending(i => i.IsPrimary).ThenBy(i => i.SortOrder).Select(i => i.Url).FirstOrDefault(),
                UnitPriceInCents = VariantHelpers.EffectivePrice(p, variant),
                Quantity = item.Quantity
            });
        }

        order.TotalInCents = order.Items.Sum(i => i.UnitPriceInCents * i.Quantity);

        _db.Orders.Add(order);
        await _db.SaveChangesAsync(ct);

        // Test/dev mode: skip the payment provider and complete the order immediately
        // so the whole order flow can be exercised without Stripe. See Payments:BypassPayment.
        if (_payments.BypassPayment)
        {
            order.StripeSessionId = $"bypass_{order.Id}";
            await FinalizePaidOrderAsync(order, paymentIntentId: null, ct);
            var baseUrl = _frontend.BaseUrl.TrimEnd('/');
            return new CheckoutSessionDto(order.StripeSessionId, $"{baseUrl}/checkout/success?session_id={order.StripeSessionId}");
        }

        try
        {
            var session = await _stripe.CreateCheckoutSessionAsync(order, ct);
            order.StripeSessionId = session.SessionId;
            await _db.SaveChangesAsync(ct);
            return session;
        }
        catch
        {
            // Don't leave an orphaned Pending order if the payment session can't be created.
            _db.Orders.Remove(order);
            await _db.SaveChangesAsync(ct);
            throw;
        }
    }

    public async Task MarkOrderPaidAsync(string stripeSessionId, string? paymentIntentId, CancellationToken ct = default)
    {
        var order = await _db.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.StripeSessionId == stripeSessionId, ct);

        if (order is null || order.Status != OrderStatus.Pending)
            return; // unknown or already processed — idempotent

        await FinalizePaidOrderAsync(order, paymentIntentId, ct);
    }

    /// <summary>
    /// Marks a Pending order as Paid, decrements product stock, and clears the buyer's cart.
    /// Shared by the Stripe webhook path and the Payments:BypassPayment test path.
    /// </summary>
    private async Task FinalizePaidOrderAsync(Order order, string? paymentIntentId, CancellationToken ct)
    {
        order.Status = OrderStatus.Paid;
        order.PaidAt = DateTime.UtcNow;
        order.StripePaymentIntentId = paymentIntentId;

        // Decrement stock — from the specific variant when one was purchased, else the product.
        foreach (var item in order.Items)
        {
            if (item.ProductVariantId is int variantId)
            {
                var variant = await _db.ProductVariants.FirstOrDefaultAsync(v => v.Id == variantId, ct);
                if (variant is not null)
                    variant.Stock = Math.Max(0, variant.Stock - item.Quantity);
            }
            else if (item.ProductId is int productId)
            {
                var product = await _db.Products.FirstOrDefaultAsync(p => p.Id == productId, ct);
                if (product is not null)
                    product.Stock = Math.Max(0, product.Stock - item.Quantity);
            }
        }

        // Clear the buyer's cart
        var cart = await _db.Carts.Include(c => c.Items).FirstOrDefaultAsync(c => c.UserId == order.UserId, ct);
        if (cart is not null && cart.Items.Count > 0)
            _db.CartItems.RemoveRange(cart.Items);

        await _db.SaveChangesAsync(ct);
    }

    public async Task<PagedResult<OrderListItemDto>> GetForUserAsync(int userId, int page, int pageSize, CancellationToken ct = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 50);
        var q = _db.Orders.AsNoTracking().Where(o => o.UserId == userId).OrderByDescending(o => o.CreatedAt);
        var total = await q.CountAsync(ct);
        var items = await q.Skip((page - 1) * pageSize).Take(pageSize)
            .Select(o => new OrderListItemDto(o.Id, o.Status.ToString(), o.TotalInCents, o.Items.Count, o.Email, o.CreatedAt))
            .ToListAsync(ct);
        return new PagedResult<OrderListItemDto>(items, page, pageSize, total);
    }

    public async Task<OrderDto> GetByIdForUserAsync(int id, int userId, CancellationToken ct = default)
    {
        var order = await LoadWithItems().FirstOrDefaultAsync(o => o.Id == id && o.UserId == userId, ct)
            ?? throw new NotFoundException("Order", id);
        return ToDto(order);
    }

    public async Task<PagedResult<OrderListItemDto>> GetAllAsync(int page, int pageSize, OrderStatus? status, CancellationToken ct = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);
        var q = _db.Orders.AsNoTracking().AsQueryable();
        if (status is OrderStatus st) q = q.Where(o => o.Status == st);
        q = q.OrderByDescending(o => o.CreatedAt);
        var total = await q.CountAsync(ct);
        var items = await q.Skip((page - 1) * pageSize).Take(pageSize)
            .Select(o => new OrderListItemDto(o.Id, o.Status.ToString(), o.TotalInCents, o.Items.Count, o.Email, o.CreatedAt))
            .ToListAsync(ct);
        return new PagedResult<OrderListItemDto>(items, page, pageSize, total);
    }

    public async Task<OrderStatusCountsDto> GetStatusCountsAsync(CancellationToken ct = default)
    {
        var counts = await _db.Orders.AsNoTracking()
            .GroupBy(o => o.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync(ct);

        int C(OrderStatus s) => counts.FirstOrDefault(x => x.Status == s)?.Count ?? 0;

        return new OrderStatusCountsDto(
            Pending: C(OrderStatus.Pending),
            Paid: C(OrderStatus.Paid),
            Shipped: C(OrderStatus.Shipped),
            Delivered: C(OrderStatus.Delivered),
            Cancelled: C(OrderStatus.Cancelled),
            Total: counts.Sum(x => x.Count));
    }

    public async Task<OrderDto> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var order = await LoadWithItems().FirstOrDefaultAsync(o => o.Id == id, ct)
            ?? throw new NotFoundException("Order", id);
        return ToDto(order);
    }

    public async Task<OrderDto> UpdateStatusAsync(int id, OrderStatus status, CancellationToken ct = default)
    {
        var order = await _db.Orders.Include(o => o.Items).FirstOrDefaultAsync(o => o.Id == id, ct)
            ?? throw new NotFoundException("Order", id);

        order.Status = status;
        var now = DateTime.UtcNow;
        switch (status)
        {
            case OrderStatus.Paid: order.PaidAt ??= now; break;
            case OrderStatus.Shipped: order.ShippedAt ??= now; break;
            case OrderStatus.Delivered: order.DeliveredAt ??= now; break;
            case OrderStatus.Cancelled: order.CancelledAt ??= now; break;
        }
        await _db.SaveChangesAsync(ct);
        return ToDto(order);
    }

    // ---- helpers ----

    private IQueryable<Order> LoadWithItems() => _db.Orders.AsNoTracking().Include(o => o.Items);

    private static OrderDto ToDto(Order o) => new(
        o.Id, o.Status.ToString(), o.TotalInCents, o.Email,
        o.ShippingFullName, o.ShippingLine1, o.ShippingLine2, o.ShippingCity, o.ShippingState,
        o.ShippingPostalCode, o.ShippingCountry,
        new OrderTimelineDto(o.CreatedAt, o.PaidAt, o.ShippedAt, o.DeliveredAt, o.CancelledAt),
        o.Items.Select(i => new OrderItemDto(i.ProductName, i.ProductSlug, i.ImageUrl, i.UnitPriceInCents, i.Quantity, i.UnitPriceInCents * i.Quantity)).ToList(),
        o.CreatedAt);
}
