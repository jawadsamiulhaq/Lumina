namespace Ecommerce.API.Extensions;

/// <summary>Helpers for the httpOnly refresh-token cookie.</summary>
public static class RefreshTokenCookie
{
    public const string Name = "refreshToken";
    private const string Path = "/api/v1/auth";

    public static void Set(HttpContext ctx, string token, DateTime expiresUtc)
    {
        ctx.Response.Cookies.Append(Name, token, new CookieOptions
        {
            HttpOnly = true,
            Secure = ctx.Request.IsHttps,
            SameSite = SameSiteMode.Lax,
            Expires = expiresUtc,
            Path = Path,
            IsEssential = true
        });
    }

    public static string? Get(HttpContext ctx) =>
        ctx.Request.Cookies.TryGetValue(Name, out var token) ? token : null;

    public static void Clear(HttpContext ctx)
    {
        ctx.Response.Cookies.Append(Name, string.Empty, new CookieOptions
        {
            HttpOnly = true,
            Secure = ctx.Request.IsHttps,
            SameSite = SameSiteMode.Lax,
            Expires = DateTimeOffset.UnixEpoch,
            Path = Path,
            IsEssential = true
        });
    }
}
