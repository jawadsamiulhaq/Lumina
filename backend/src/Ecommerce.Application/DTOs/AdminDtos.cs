namespace Ecommerce.Application.DTOs;

public record AdminUserDto(
    string Id,
    string Email,
    string FirstName,
    string LastName,
    IReadOnlyList<string> Roles,
    DateTime CreatedAt);

public record LowStockProductDto(int Id, string Name, string Slug, int Stock);

public record DashboardStatsDto(
    int TotalRevenueInCents,
    int PaidOrderCount,
    int TotalOrderCount,
    int PendingOrderCount,
    int ProductCount,
    int LowStockCount,
    IReadOnlyList<LowStockProductDto> LowStockProducts,
    IReadOnlyList<OrderListItemDto> RecentOrders);

public record UploadResultDto(string Url, string FileName, long SizeBytes);
