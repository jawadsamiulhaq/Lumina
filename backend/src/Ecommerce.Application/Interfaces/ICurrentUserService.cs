namespace Ecommerce.Application.Interfaces;

public interface ICurrentUserService
{
    int? UserId { get; }
    string? Email { get; }
    bool IsAuthenticated { get; }
    IReadOnlyList<string> Roles { get; }
    bool IsInRole(string role);

    /// <summary>Returns the user id or throws <see cref="Common.UnauthorizedException"/> when anonymous.</summary>
    int RequireUserId();
}
