namespace Ecommerce.Application.DTOs;

public record AdminUserDto(
    string Id,
    string Email,
    string FirstName,
    string LastName,
    IReadOnlyList<string> Roles,
    DateTime CreatedAt,
    bool IsLocked,
    DateTime? LockedUntil);

// ---- User management requests ----
public record CreateUserRequest(string FirstName, string LastName, string Email, string Password, IReadOnlyList<string> Roles);
public record UpdateUserRequest(string FirstName, string LastName, string Email, IReadOnlyList<string> Roles);
public record SetUserRolesRequest(IReadOnlyList<string> Roles);
public record LockUserRequest(int Minutes);

// ---- Role & permission management ----
public record RoleDto(string Id, string Name, bool IsSystem, IReadOnlyList<string> Permissions, int MemberCount);
public record PermissionDto(string Name, string Description);
public record CreateRoleRequest(string Name);
public record UpdateRoleRequest(string Name);
public record SetRolePermissionsRequest(IReadOnlyList<string> Permissions);

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

/// <summary>Returned once when an admin resets a user's password. The plaintext is shown a single time.</summary>
public record AdminResetPasswordResultDto(string Email, string TemporaryPassword);
