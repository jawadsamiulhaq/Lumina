using Ecommerce.Application.DTOs;

namespace Ecommerce.Application.Interfaces;

public interface IAdminUserService
{
    Task<IReadOnlyList<AdminUserDto>> GetAllAsync(CancellationToken ct = default);
    Task<AdminUserDto> SetAdminRoleAsync(string userId, bool isAdmin, CancellationToken ct = default);

    Task<AdminUserDto> CreateAsync(CreateUserRequest request, CancellationToken ct = default);
    Task<AdminUserDto> UpdateAsync(string userId, UpdateUserRequest request, CancellationToken ct = default);
    Task DeleteAsync(string userId, CancellationToken ct = default);
    Task<AdminUserDto> SetRolesAsync(string userId, IReadOnlyList<string> roles, CancellationToken ct = default);
    Task<AdminUserDto> LockAsync(string userId, int minutes, CancellationToken ct = default);
    Task<AdminUserDto> UnlockAsync(string userId, CancellationToken ct = default);

    /// <summary>Generates a new temporary password for the user and returns it once (never stored in plaintext).</summary>
    Task<AdminResetPasswordResultDto> ResetPasswordAsync(string userId, CancellationToken ct = default);
}

public interface IRoleService
{
    Task<IReadOnlyList<RoleDto>> GetAllAsync(CancellationToken ct = default);
    Task<IReadOnlyList<PermissionDto>> GetPermissionsAsync(CancellationToken ct = default);
    Task<RoleDto> CreateAsync(CreateRoleRequest request, CancellationToken ct = default);
    Task<RoleDto> UpdateAsync(string roleId, UpdateRoleRequest request, CancellationToken ct = default);
    Task DeleteAsync(string roleId, CancellationToken ct = default);
    Task<RoleDto> SetPermissionsAsync(string roleId, IReadOnlyList<string> permissions, CancellationToken ct = default);
}

public interface IDashboardService
{
    Task<DashboardStatsDto> GetStatsAsync(CancellationToken ct = default);
}
