namespace Ecommerce.Application.Interfaces;

public record AccessToken(string Token, DateTime ExpiresAt);

public interface ITokenService
{
    AccessToken CreateAccessToken(string userId, string email, IEnumerable<string> roles, IEnumerable<string> permissions, int? impersonatorId = null);

    /// <summary>Returns a cryptographically-random opaque refresh token (raw value).</summary>
    string CreateRefreshToken();

    /// <summary>SHA-256 hash used to store refresh tokens at rest.</summary>
    string HashRefreshToken(string rawToken);

    DateTime GetRefreshTokenExpiry();
}
