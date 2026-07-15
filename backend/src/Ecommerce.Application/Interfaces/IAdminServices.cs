using Ecommerce.Application.DTOs;

namespace Ecommerce.Application.Interfaces;

public interface IAdminUserService
{
    Task<IReadOnlyList<AdminUserDto>> GetAllAsync(CancellationToken ct = default);
    Task<AdminUserDto> SetAdminRoleAsync(string userId, bool isAdmin, CancellationToken ct = default);
}

public interface IDashboardService
{
    Task<DashboardStatsDto> GetStatsAsync(CancellationToken ct = default);
}
