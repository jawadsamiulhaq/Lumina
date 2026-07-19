using Ecommerce.Application.Common;
using Ecommerce.Application.DTOs;
using Ecommerce.Application.Interfaces;
using Ecommerce.Domain.Constants;
using Ecommerce.Infrastructure.Identity;
using Ecommerce.Infrastructure.Persistence;
using Ecommerce.Infrastructure.Settings;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Ecommerce.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ITokenService _tokens;
    private readonly AppDbContext _db;
    private readonly IEmailSender _email;
    private readonly FrontendSettings _frontend;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        UserManager<ApplicationUser> userManager,
        ITokenService tokens,
        AppDbContext db,
        IEmailSender email,
        IOptions<FrontendSettings> frontend,
        ILogger<AuthService> logger)
    {
        _userManager = userManager;
        _tokens = tokens;
        _db = db;
        _email = email;
        _frontend = frontend.Value;
        _logger = logger;
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

        // Preserve an impersonation session across refreshes so the admin stays "inside" the user.
        int? impersonatorId = stored.ImpersonatorId;
        string? impersonatorName = null;
        if (impersonatorId is int adminId)
        {
            var admin = await _userManager.FindByIdAsync(adminId.ToString());
            if (admin is null)
                impersonatorId = null; // admin gone — fall back to a normal session
            else
                impersonatorName = DisplayName(admin);
        }

        // Rotate: revoke the used token and issue a new one
        stored.RevokedAt = DateTime.UtcNow;
        var result = await BuildAuthResultAsync(user, ct, replacing: stored, impersonatorId: impersonatorId, impersonatorName: impersonatorName);
        return result;
    }

    public async Task<AuthResult> ImpersonateAsync(int targetUserId, int impersonatorId, CancellationToken ct = default)
    {
        if (targetUserId == impersonatorId)
            throw new BadRequestException("You can't impersonate yourself.");

        var target = await _userManager.FindByIdAsync(targetUserId.ToString())
            ?? throw new NotFoundException("User", targetUserId);

        // Never allow impersonating another administrator — that would be a privilege-escalation path.
        if (await _userManager.IsInRoleAsync(target, Roles.Admin))
            throw new BadRequestException("Administrators can't be impersonated.");

        if (await _userManager.IsLockedOutAsync(target))
            throw new BadRequestException("This account is locked and can't be impersonated.");

        var admin = await _userManager.FindByIdAsync(impersonatorId.ToString())
            ?? throw new UnauthorizedException("Your account no longer exists.");

        _logger.LogWarning("Impersonation started: admin {AdminId} ({AdminEmail}) is now acting as user {UserId} ({UserEmail}).",
            admin.Id, admin.Email, target.Id, target.Email);

        return await BuildAuthResultAsync(target, ct, impersonatorId: admin.Id, impersonatorName: DisplayName(admin));
    }

    public async Task<AuthResult> StopImpersonationAsync(int impersonatorId, string rawRefreshToken, CancellationToken ct = default)
    {
        var admin = await _userManager.FindByIdAsync(impersonatorId.ToString())
            ?? throw new UnauthorizedException("Your account no longer exists.");

        // Revoke the impersonation refresh token so it can't be reused.
        if (!string.IsNullOrWhiteSpace(rawRefreshToken))
        {
            var hash = _tokens.HashRefreshToken(rawRefreshToken);
            var stored = await _db.RefreshTokens.FirstOrDefaultAsync(t => t.TokenHash == hash, ct);
            if (stored is not null && stored.RevokedAt is null)
                stored.RevokedAt = DateTime.UtcNow;
        }

        _logger.LogWarning("Impersonation ended: admin {AdminId} ({AdminEmail}) returned to their own account.", admin.Id, admin.Email);

        return await BuildAuthResultAsync(admin, ct);
    }

    private static string DisplayName(ApplicationUser user)
    {
        var name = $"{user.FirstName} {user.LastName}".Trim();
        return string.IsNullOrEmpty(name) ? user.Email ?? "your account" : name;
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

    public async Task ForgotPasswordAsync(string email, CancellationToken ct = default)
    {
        var user = await _userManager.FindByEmailAsync(email.Trim().ToLowerInvariant());
        // Don't reveal whether the email exists — always behave the same to the caller.
        if (user is null || string.IsNullOrEmpty(user.Email)) return;

        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        var link = $"{_frontend.BaseUrl.TrimEnd('/')}/reset-password" +
                   $"?email={Uri.EscapeDataString(user.Email)}&token={Uri.EscapeDataString(token)}";

        var body =
            $"<p>Hi {System.Net.WebUtility.HtmlEncode(user.FirstName)},</p>" +
            "<p>We received a request to reset your password. Click the link below to choose a new one. " +
            "If you didn't request this, you can safely ignore this email.</p>" +
            $"<p><a href=\"{link}\">Reset your password</a></p>" +
            "<p>This link will expire shortly for your security.</p>";

        await _email.SendAsync(user.Email, "Reset your Lumina password", body, ct);
    }

    public async Task ResetPasswordAsync(ResetPasswordRequest request, CancellationToken ct = default)
    {
        var user = await _userManager.FindByEmailAsync(request.Email.Trim().ToLowerInvariant());
        // Use a generic error so this endpoint can't be used to enumerate accounts.
        if (user is null)
            throw new BadRequestException("This reset link is invalid or has expired.");

        var result = await _userManager.ResetPasswordAsync(user, request.Token, request.NewPassword);
        if (!result.Succeeded)
        {
            var invalidToken = result.Errors.Any(e => e.Code == "InvalidToken");
            throw new BadRequestException(invalidToken
                ? "This reset link is invalid or has expired."
                : string.Join(" ", result.Errors.Select(e => e.Description)));
        }
    }

    public async Task ChangePasswordAsync(int userId, ChangePasswordRequest request, CancellationToken ct = default)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString())
            ?? throw new NotFoundException("User", userId);

        var result = await _userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
        if (!result.Succeeded)
        {
            var wrongCurrent = result.Errors.Any(e => e.Code == "PasswordMismatch");
            throw new BadRequestException(wrongCurrent
                ? "Your current password is incorrect."
                : string.Join(" ", result.Errors.Select(e => e.Description)));
        }
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

    private async Task<AuthResult> BuildAuthResultAsync(
        ApplicationUser user,
        CancellationToken ct,
        RefreshToken? replacing = null,
        int? impersonatorId = null,
        string? impersonatorName = null)
    {
        var roles = await _userManager.GetRolesAsync(user);
        var permissions = await ResolvePermissionsAsync(roles, ct);
        var access = _tokens.CreateAccessToken(user.Id.ToString(), user.Email!, roles, permissions, impersonatorId);

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
            CreatedAt = DateTime.UtcNow,
            ImpersonatorId = impersonatorId
        });
        await _db.SaveChangesAsync(ct);

        return new AuthResult(
            access.Token, access.ExpiresAt, rawRefresh, refreshExpiry, ToDto(user, roles, permissions),
            IsImpersonating: impersonatorId is not null,
            ImpersonatorName: impersonatorName);
    }

    private static UserDto ToDto(ApplicationUser user, IEnumerable<string> roles, IEnumerable<string> permissions) =>
        new(user.Id.ToString(), user.Email ?? "", user.FirstName, user.LastName, roles.ToList(), permissions.ToList());
}
