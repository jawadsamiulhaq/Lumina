using Ecommerce.Application.Common;
using Ecommerce.Application.DTOs;
using Ecommerce.Application.Interfaces;
using Ecommerce.Domain.Constants;
using Ecommerce.Domain.Entities;
using Ecommerce.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Infrastructure.Services;

public class RoleService : IRoleService
{
    private readonly RoleManager<IdentityRole<int>> _roleManager;
    private readonly AppDbContext _db;

    public RoleService(RoleManager<IdentityRole<int>> roleManager, AppDbContext db)
    {
        _roleManager = roleManager;
        _db = db;
    }

    public async Task<IReadOnlyList<RoleDto>> GetAllAsync(CancellationToken ct = default)
    {
        var roles = await _roleManager.Roles.OrderBy(r => r.Name).ToListAsync(ct);

        var permsByRole = await _db.RolePermissions
            .Include(rp => rp.Permission)
            .GroupBy(rp => rp.RoleId)
            .Select(g => new { RoleId = g.Key, Names = g.Select(x => x.Permission!.Name).ToList() })
            .ToDictionaryAsync(x => x.RoleId, x => x.Names, ct);

        var memberCounts = await _db.UserRoles
            .GroupBy(ur => ur.RoleId)
            .Select(g => new { RoleId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.RoleId, x => x.Count, ct);

        return roles.Select(r => new RoleDto(
            r.Id.ToString(),
            r.Name ?? "",
            IsSystem(r.Name),
            permsByRole.TryGetValue(r.Id, out var p) ? p : new List<string>(),
            memberCounts.TryGetValue(r.Id, out var c) ? c : 0)).ToList();
    }

    public Task<IReadOnlyList<PermissionDto>> GetPermissionsAsync(CancellationToken ct = default)
        => Task.FromResult<IReadOnlyList<PermissionDto>>(
            Permissions.All.Select(p => new PermissionDto(p.Name, p.Description)).ToList());

    public async Task<RoleDto> CreateAsync(CreateRoleRequest request, CancellationToken ct = default)
    {
        var name = request.Name.Trim();
        if (string.IsNullOrWhiteSpace(name)) throw new BadRequestException("Role name is required.");
        if (await _roleManager.RoleExistsAsync(name))
            throw new ConflictException($"A role named '{name}' already exists.");

        var result = await _roleManager.CreateAsync(new IdentityRole<int>(name));
        if (!result.Succeeded)
            throw new BadRequestException(string.Join(" ", result.Errors.Select(e => e.Description)));

        return await GetOneAsync(name, ct);
    }

    public async Task<RoleDto> UpdateAsync(string roleId, UpdateRoleRequest request, CancellationToken ct = default)
    {
        var role = await FindAsync(roleId);
        if (IsSystem(role.Name)) throw new BadRequestException("System roles can't be renamed.");

        var name = request.Name.Trim();
        if (string.IsNullOrWhiteSpace(name)) throw new BadRequestException("Role name is required.");

        var existing = await _roleManager.FindByNameAsync(name);
        if (existing is not null && existing.Id != role.Id)
            throw new ConflictException($"A role named '{name}' already exists.");

        role.Name = name;
        var result = await _roleManager.UpdateAsync(role);
        if (!result.Succeeded)
            throw new BadRequestException(string.Join(" ", result.Errors.Select(e => e.Description)));

        return await GetOneAsync(name, ct);
    }

    public async Task DeleteAsync(string roleId, CancellationToken ct = default)
    {
        var role = await FindAsync(roleId);
        if (IsSystem(role.Name)) throw new BadRequestException("System roles can't be deleted.");

        // Detach the role from users and drop its permission grants before deleting.
        await _db.UserRoles.Where(ur => ur.RoleId == role.Id).ExecuteDeleteAsync(ct);
        await _db.RolePermissions.Where(rp => rp.RoleId == role.Id).ExecuteDeleteAsync(ct);

        var result = await _roleManager.DeleteAsync(role);
        if (!result.Succeeded)
            throw new BadRequestException(string.Join(" ", result.Errors.Select(e => e.Description)));
    }

    public async Task<RoleDto> SetPermissionsAsync(string roleId, IReadOnlyList<string> permissions, CancellationToken ct = default)
    {
        var role = await FindAsync(roleId);
        if (IsSystem(role.Name))
            throw new BadRequestException("Permissions for system roles are fixed and can't be changed.");

        var known = Permissions.All.Select(p => p.Name).ToHashSet(StringComparer.OrdinalIgnoreCase);
        var requested = permissions.Distinct(StringComparer.OrdinalIgnoreCase).ToList();
        var unknown = requested.FirstOrDefault(p => !known.Contains(p));
        if (unknown is not null) throw new BadRequestException($"Unknown permission '{unknown}'.");

        var permIdByName = await _db.Permissions.ToDictionaryAsync(p => p.Name, p => p.Id, ct);

        // Replace the role's grants wholesale.
        await _db.RolePermissions.Where(rp => rp.RoleId == role.Id).ExecuteDeleteAsync(ct);
        foreach (var name in requested)
        {
            if (permIdByName.TryGetValue(name, out var permId))
                _db.RolePermissions.Add(new RolePermission { RoleId = role.Id, PermissionId = permId });
        }
        await _db.SaveChangesAsync(ct);

        return await GetOneAsync(role.Name!, ct);
    }

    // ---- helpers ----

    private async Task<IdentityRole<int>> FindAsync(string roleId) =>
        await _roleManager.FindByIdAsync(roleId) ?? throw new NotFoundException("Role", roleId);

    private static bool IsSystem(string? name) =>
        name is not null && Roles.All.Contains(name, StringComparer.OrdinalIgnoreCase);

    private async Task<RoleDto> GetOneAsync(string name, CancellationToken ct)
    {
        var all = await GetAllAsync(ct);
        return all.First(r => string.Equals(r.Name, name, StringComparison.OrdinalIgnoreCase));
    }
}
