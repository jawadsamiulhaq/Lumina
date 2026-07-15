using Ecommerce.Application.Common;
using Ecommerce.Application.DTOs;
using Ecommerce.Application.Interfaces;
using Ecommerce.Domain.Constants;
using Ecommerce.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Infrastructure.Services;

public class AdminUserService : IAdminUserService
{
    private readonly UserManager<ApplicationUser> _userManager;

    public AdminUserService(UserManager<ApplicationUser> userManager) => _userManager = userManager;

    public async Task<IReadOnlyList<AdminUserDto>> GetAllAsync(CancellationToken ct = default)
    {
        var users = await _userManager.Users.OrderBy(u => u.Email).ToListAsync(ct);
        var result = new List<AdminUserDto>(users.Count);
        foreach (var u in users)
        {
            var roles = await _userManager.GetRolesAsync(u);
            result.Add(new AdminUserDto(u.Id.ToString(), u.Email ?? "", u.FirstName, u.LastName, roles.ToList(), u.CreatedAt));
        }
        return result;
    }

    public async Task<AdminUserDto> SetAdminRoleAsync(string userId, bool isAdmin, CancellationToken ct = default)
    {
        var user = await _userManager.FindByIdAsync(userId)
            ?? throw new NotFoundException("User", userId);

        var isCurrentlyAdmin = await _userManager.IsInRoleAsync(user, Roles.Admin);
        if (isAdmin && !isCurrentlyAdmin)
            await _userManager.AddToRoleAsync(user, Roles.Admin);
        else if (!isAdmin && isCurrentlyAdmin)
            await _userManager.RemoveFromRoleAsync(user, Roles.Admin);

        var roles = await _userManager.GetRolesAsync(user);
        return new AdminUserDto(user.Id.ToString(), user.Email ?? "", user.FirstName, user.LastName, roles.ToList(), user.CreatedAt);
    }
}
