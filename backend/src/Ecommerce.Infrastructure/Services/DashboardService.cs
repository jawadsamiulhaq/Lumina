using Ecommerce.Application.DTOs;
using Ecommerce.Application.Interfaces;
using Ecommerce.Domain.Enums;
using Ecommerce.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Infrastructure.Services;

public class DashboardService : IDashboardService
{
    private const int LowStockThreshold = 5;
    private readonly AppDbContext _db;

    public DashboardService(AppDbContext db) => _db = db;

    public async Task<DashboardStatsDto> GetStatsAsync(CancellationToken ct = default)
    {
        var paidStatuses = new[] { OrderStatus.Paid, OrderStatus.Shipped, OrderStatus.Delivered };

        var revenue = await _db.Orders
            .Where(o => paidStatuses.Contains(o.Status))
            .SumAsync(o => (int?)o.TotalInCents, ct) ?? 0;

        var paidCount = await _db.Orders.CountAsync(o => paidStatuses.Contains(o.Status), ct);
        var totalOrders = await _db.Orders.CountAsync(ct);
        var pendingCount = await _db.Orders.CountAsync(o => o.Status == OrderStatus.Pending, ct);
        var productCount = await _db.Products.CountAsync(p => p.IsActive, ct);

        var lowStock = await _db.Products
            .Where(p => p.IsActive && p.Stock <= LowStockThreshold)
            .OrderBy(p => p.Stock)
            .Select(p => new LowStockProductDto(p.Id, p.Name, p.Slug, p.Stock))
            .Take(10)
            .ToListAsync(ct);

        var recent = await _db.Orders
            .OrderByDescending(o => o.CreatedAt)
            .Take(8)
            .Select(o => new OrderListItemDto(o.Id, o.Status.ToString(), o.TotalInCents, o.Items.Count, o.Email, o.CreatedAt))
            .ToListAsync(ct);

        return new DashboardStatsDto(revenue, paidCount, totalOrders, pendingCount, productCount, lowStock.Count, lowStock, recent);
    }
}
