using Ecommerce.Application.Common;
using Ecommerce.Application.DTOs;
using Ecommerce.Application.Interfaces;
using Ecommerce.Domain.Constants;
using Ecommerce.Infrastructure.Identity;
using Ecommerce.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Infrastructure.Services;

public class AdminUserService : IAdminUserService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<IdentityRole<int>> _roleManager;
    private readonly ICurrentUserService _currentUser;
    private readonly AppDbContext _db;

    public AdminUserService(
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole<int>> roleManager,
        ICurrentUserService currentUser,
        AppDbContext db)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _currentUser = currentUser;
        _db = db;
    }

    public async Task<IReadOnlyList<AdminUserDto>> GetAllAsync(CancellationToken ct = default)
    {
        var users = await _userManager.Users.OrderBy(u => u.Email).ToListAsync(ct);
        var result = new List<AdminUserDto>(users.Count);
        foreach (var u in users)
            result.Add(await ToDtoAsync(u));
        return result;
    }

    public async Task<AdminUserDto> SetAdminRoleAsync(string userId, bool isAdmin, CancellationToken ct = default)
    {
        var user = await FindAsync(userId);

        var isCurrentlyAdmin = await _userManager.IsInRoleAsync(user, Roles.Admin);
        if (isAdmin && !isCurrentlyAdmin)
            await _userManager.AddToRoleAsync(user, Roles.Admin);
        else if (!isAdmin && isCurrentlyAdmin)
        {
            await EnsureNotLastAdminAsync(user, ct);
            await _userManager.RemoveFromRoleAsync(user, Roles.Admin);
        }

        return await ToDtoAsync(user);
    }

    public async Task<AdminUserDto> CreateAsync(CreateUserRequest request, CancellationToken ct = default)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(email)) throw new BadRequestException("Email is required.");
        if (await _userManager.FindByEmailAsync(email) is not null)
            throw new ConflictException("An account with this email already exists.");

        var roles = await ValidateRolesAsync(request.Roles);

        var user = new ApplicationUser
        {
            UserName = email,
            Email = email,
            EmailConfirmed = true,
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
            throw new BadRequestException(string.Join(" ", result.Errors.Select(e => e.Description)));

        if (roles.Count > 0)
            await _userManager.AddToRolesAsync(user, roles);

        return await ToDtoAsync(user);
    }

    public async Task<AdminUserDto> UpdateAsync(string userId, UpdateUserRequest request, CancellationToken ct = default)
    {
        var user = await FindAsync(userId);
        var email = request.Email.Trim().ToLowerInvariant();

        var byEmail = await _userManager.FindByEmailAsync(email);
        if (byEmail is not null && byEmail.Id != user.Id)
            throw new ConflictException("Another account already uses this email.");

        user.FirstName = request.FirstName.Trim();
        user.LastName = request.LastName.Trim();
        user.Email = email;
        user.UserName = email;
        var update = await _userManager.UpdateAsync(user);
        if (!update.Succeeded)
            throw new BadRequestException(string.Join(" ", update.Errors.Select(e => e.Description)));

        await SyncRolesAsync(user, request.Roles, ct);
        return await ToDtoAsync(user);
    }

    public async Task<AdminUserDto> SetRolesAsync(string userId, IReadOnlyList<string> roles, CancellationToken ct = default)
    {
        var user = await FindAsync(userId);
        await SyncRolesAsync(user, roles, ct);
        return await ToDtoAsync(user);
    }

    public async Task DeleteAsync(string userId, CancellationToken ct = default)
    {
        var user = await FindAsync(userId);
        if (user.Id == _currentUser.UserId)
            throw new BadRequestException("You can't delete your own account.");
        await EnsureNotLastAdminAsync(user, ct);

        // Remove dependent refresh tokens first (no cascade configured for them).
        await _db.RefreshTokens.Where(t => t.UserId == user.Id).ExecuteDeleteAsync(ct);

        var result = await _userManager.DeleteAsync(user);
        if (!result.Succeeded)
            throw new BadRequestException(string.Join(" ", result.Errors.Select(e => e.Description)));
    }

    public async Task<AdminUserDto> LockAsync(string userId, int minutes, CancellationToken ct = default)
    {
        if (minutes <= 0) throw new BadRequestException("Lock duration must be greater than zero.");
        var user = await FindAsync(userId);
        if (user.Id == _currentUser.UserId)
            throw new BadRequestException("You can't lock your own account.");

        await _userManager.SetLockoutEnabledAsync(user, true);
        await _userManager.SetLockoutEndDateAsync(user, DateTimeOffset.UtcNow.AddMinutes(minutes));

        // Revoke active refresh tokens so the lock takes effect immediately.
        await _db.RefreshTokens
            .Where(t => t.UserId == user.Id && t.RevokedAt == null)
            .ExecuteUpdateAsync(s => s.SetProperty(t => t.RevokedAt, DateTime.UtcNow), ct);

        return await ToDtoAsync(user);
    }

    public async Task<AdminUserDto> UnlockAsync(string userId, CancellationToken ct = default)
    {
        var user = await FindAsync(userId);
        await _userManager.SetLockoutEndDateAsync(user, null);
        await _userManager.ResetAccessFailedCountAsync(user);
        return await ToDtoAsync(user);
    }

    // ---- helpers ----

    private async Task<ApplicationUser> FindAsync(string userId) =>
        await _userManager.FindByIdAsync(userId) ?? throw new NotFoundException("User", userId);

    /// <summary>Validates role names exist and returns them normalised; throws on unknown roles.</summary>
    private async Task<List<string>> ValidateRolesAsync(IReadOnlyList<string> roles)
    {
        var valid = new List<string>();
        foreach (var name in roles.Distinct(StringComparer.OrdinalIgnoreCase))
        {
            var role = await _roleManager.FindByNameAsync(name)
                ?? throw new BadRequestException($"Role '{name}' does not exist.");
            valid.Add(role.Name!);
        }
        return valid;
    }

    private async Task SyncRolesAsync(ApplicationUser user, IReadOnlyList<string> roles, CancellationToken ct)
    {
        var target = await ValidateRolesAsync(roles);
        var current = await _userManager.GetRolesAsync(user);

        var toRemove = current.Except(target, StringComparer.OrdinalIgnoreCase).ToList();
        var toAdd = target.Except(current, StringComparer.OrdinalIgnoreCase).ToList();

        // Don't let the last admin lose the Admin role.
        if (toRemove.Contains(Roles.Admin, StringComparer.OrdinalIgnoreCase))
            await EnsureNotLastAdminAsync(user, ct);

        if (toRemove.Count > 0) await _userManager.RemoveFromRolesAsync(user, toRemove);
        if (toAdd.Count > 0) await _userManager.AddToRolesAsync(user, toAdd);
    }

    private async Task EnsureNotLastAdminAsync(ApplicationUser user, CancellationToken ct)
    {
        if (!await _userManager.IsInRoleAsync(user, Roles.Admin)) return;
        var admins = await _userManager.GetUsersInRoleAsync(Roles.Admin);
        if (admins.Count <= 1)
            throw new BadRequestException("You can't remove the last administrator.");
    }

    private async Task<AdminUserDto> ToDtoAsync(ApplicationUser user)
    {
        var roles = await _userManager.GetRolesAsync(user);
        var lockoutEnd = user.LockoutEnd;
        var isLocked = lockoutEnd.HasValue && lockoutEnd.Value > DateTimeOffset.UtcNow;
        return new AdminUserDto(
            user.Id.ToString(),
            user.Email ?? "",
            user.FirstName,
            user.LastName,
            roles.ToList(),
            user.CreatedAt,
            isLocked,
            isLocked ? lockoutEnd!.Value.UtcDateTime : null);
    }
}
