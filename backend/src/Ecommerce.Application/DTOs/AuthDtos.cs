namespace Ecommerce.Application.DTOs;

public class RegisterRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
}

public class LoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class ForgotPasswordRequest
{
    public string Email { get; set; } = string.Empty;
}

public class ResetPasswordRequest
{
    public string Email { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}

public class ChangePasswordRequest
{
    public string CurrentPassword { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}

public record UserDto(
    string Id,
    string Email,
    string FirstName,
    string LastName,
    IReadOnlyList<string> Roles,
    IReadOnlyList<string> Permissions);

/// <summary>
/// Access token returned in the body; the refresh token is set as an httpOnly cookie
/// by the API layer and never exposed to JavaScript.
/// </summary>
public record AuthResult(
    string AccessToken,
    DateTime AccessTokenExpiresAt,
    string RefreshToken,
    DateTime RefreshTokenExpiresAt,
    UserDto User,
    bool IsImpersonating = false,
    string? ImpersonatorName = null);

/// <summary>Body returned to the client (no refresh token — that lives in the cookie).</summary>
public record AuthResponse(
    string AccessToken,
    DateTime AccessTokenExpiresAt,
    UserDto User,
    bool IsImpersonating = false,
    string? ImpersonatorName = null);
