using Ecommerce.Application.DTOs;

namespace Ecommerce.Application.Interfaces;

public interface IAuthService
{
    Task<AuthResult> RegisterAsync(RegisterRequest request, CancellationToken ct = default);
    Task<AuthResult> LoginAsync(LoginRequest request, CancellationToken ct = default);
    Task<AuthResult> RefreshAsync(string rawRefreshToken, CancellationToken ct = default);
    Task RevokeAsync(string rawRefreshToken, CancellationToken ct = default);
    Task<UserDto> GetByIdAsync(int userId, CancellationToken ct = default);

    /// <summary>Emails a password-reset link if the address belongs to an account. Never reveals whether it does.</summary>
    Task ForgotPasswordAsync(string email, CancellationToken ct = default);
    Task ResetPasswordAsync(ResetPasswordRequest request, CancellationToken ct = default);
    Task ChangePasswordAsync(int userId, ChangePasswordRequest request, CancellationToken ct = default);

    /// <summary>Issues a session for <paramref name="targetUserId"/> tagged as being impersonated by <paramref name="impersonatorId"/>.</summary>
    Task<AuthResult> ImpersonateAsync(int targetUserId, int impersonatorId, CancellationToken ct = default);

    /// <summary>Ends an impersonation session and returns a normal session for the original admin.</summary>
    Task<AuthResult> StopImpersonationAsync(int impersonatorId, string rawRefreshToken, CancellationToken ct = default);
}
