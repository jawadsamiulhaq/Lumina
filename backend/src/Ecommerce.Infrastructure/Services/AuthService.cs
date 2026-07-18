using Ecommerce.Application.Common;
using Ecommerce.Application.DTOs;
using Ecommerce.Application.Interfaces;
using Ecommerce.Domain.Constants;
using Ecommerce.Infrastructure.Identity;
using Ecommerce.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ITokenService _tokens;
    private readonly AppDbContext _db;

    public AuthService(UserManager<ApplicationUser> userManager, ITokenService tokens, AppDbContext db)
    {
        _userManager = userManager;
        _tokens = tokens;
        _db = db;
    }

    public async Task<AuthResult> RegisterAsync(RegisterRequest request, CancellationToken ct = default)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        if (await _userManager.FindByEmailAsync(email) is not null)
            throw new ConflictException("An account with this email already exists.");

        var user = new ApplicationUser
        {
            UserName = email,
            Email = email,
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
            throw new BadRequestException(string.Join(" ", result.Errors.Select(e => e.Description)));

        await _userManager.AddToRoleAsync(user, Roles.Customer);
        return await BuildAuthResultAsync(user, ct);
    }

    public async Task<AuthResult> LoginAsync(LoginRequest request, CancellationToken ct = default)
    {
        var user = await _userManager.FindByEmailAsync(request.Email.Trim().ToLowerInvariant());
        if (user is null || !await _userManager.CheckPasswordAsync(user, request.Password))
            throw new UnauthorizedException("Invalid email or password.");

        if (await _userManager.IsLockedOutAsync(user))
            throw new UnauthorizedException("This account is temporarily locked. Please try again later.");

        return await BuildAuthResultAsync(user, ct);
    }

    public async Task<AuthResult> RefreshAsync(string rawRefreshToken, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(rawRefreshToken))
            throw new UnauthorizedException("Missing refresh token.");

        var hash = _tokens.HashRefreshToken(rawRefreshToken);
        var stored = await _db.RefreshTokens.FirstOrDefaultAsync(t => t.TokenHash == hash, ct);
        if (stored is null || !stored.IsActive)
            throw new UnauthorizedException("Invalid or expired refresh token.");

        var user = await _userManager.FindByIdAsync(stored.UserId.ToString())
            ?? throw new UnauthorizedException("User no longer exists.");

        if (await _userManager.IsLockedOutAsync(user))
        {
            // Locked accounts can't refresh; revoke the token so it can't be reused.
            stored.RevokedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
            throw new UnauthorizedException("This account is temporarily locked. Please try again later.");
        }

        // Rotate: revoke the used token and issue a new one
        stored.RevokedAt = DateTime.UtcNow;
        var result = await BuildAuthResultAsync(user, ct, replacing: stored);
        return result;
    }

    public async Task RevokeAsync(string rawRefreshToken, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(rawRefreshToken)) return;
        var hash = _tokens.HashRefreshToken(rawRefreshToken);
        var stored = await _db.RefreshTokens.FirstOrDefaultAsync(t => t.TokenHash == hash, ct);
        if (stored is not null && stored.RevokedAt is null)
        {
            stored.RevokedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
        }
    }

    public async Task<UserDto> GetByIdAsync(int userId, CancellationToken ct = default)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString())
            ?? throw new NotFoundException("User", userId);
        var roles = await _userManager.GetRolesAsync(user);
        var permissions = await ResolvePermissionsAsync(roles, ct);
        return ToDto(user, roles, permissions);
    }

    // ---- helpers ----

    /// <summary>Effective permissions = the union of every permission granted to the user's roles.</summary>
    private async Task<List<string>> ResolvePermissionsAsync(IEnumerable<string> roleNames, CancellationToken ct)
    {
        var names = roleNames.ToList();
        if (names.Count == 0) return new List<string>();

        var roleIds = await _db.Roles
            .Where(r => names.Contains(r.Name!))
            .Select(r => r.Id)
            .ToListAsync(ct);

        return await _db.RolePermissions
            .Where(rp => roleIds.Contains(rp.RoleId))
            .Select(rp => rp.Permission!.Name)
            .Distinct()
            .ToListAsync(ct);
    }

    private async Task<AuthResult> BuildAuthResultAsync(ApplicationUser user, CancellationToken ct, RefreshToken? replacing = null)
    {
        var roles = await _userManager.GetRolesAsync(user);
        var permissions = await ResolvePermissionsAsync(roles, ct);
        var access = _tokens.CreateAccessToken(user.Id.ToString(), user.Email!, roles, permissions);

        var rawRefresh = _tokens.CreateRefreshToken();
        var refreshHash = _tokens.HashRefreshToken(rawRefresh);
        var refreshExpiry = _tokens.GetRefreshTokenExpiry();

        if (replacing is not null)
            replacing.ReplacedByTokenHash = refreshHash;

        _db.RefreshTokens.Add(new RefreshToken
        {
            UserId = user.Id,
            TokenHash = refreshHash,
            ExpiresAt = refreshExpiry,
            CreatedAt = DateTime.UtcNow
        });
        await _db.SaveChangesAsync(ct);

        return new AuthResult(access.Token, access.ExpiresAt, rawRefresh, refreshExpiry, ToDto(user, roles, permissions));
    }

    private static UserDto ToDto(ApplicationUser user, IEnumerable<string> roles, IEnumerable<string> permissions) =>
        new(user.Id.ToString(), user.Email ?? "", user.FirstName, user.LastName, roles.ToList(), permissions.ToList());
}
