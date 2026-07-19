using System.Security.Claims;
using Ecommerce.Application.Common;
using Ecommerce.Application.Interfaces;
using Ecommerce.Domain.Constants;
using Microsoft.AspNetCore.Http;

namespace Ecommerce.Infrastructure.Services;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _accessor;

    public CurrentUserService(IHttpContextAccessor accessor) => _accessor = accessor;

    private ClaimsPrincipal? User => _accessor.HttpContext?.User;

    public int? UserId =>
        int.TryParse(User?.FindFirstValue(ClaimTypes.NameIdentifier) ?? User?.FindFirstValue("sub"), out var id)
            ? id
            : null;

    public string? Email => User?.FindFirstValue(ClaimTypes.Email);

    public int? ImpersonatorId =>
        int.TryParse(User?.FindFirstValue(Permissions.ImpersonatorClaim), out var id) ? id : null;

    public bool IsAuthenticated => User?.Identity?.IsAuthenticated ?? false;

    public IReadOnlyList<string> Roles =>
        User?.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList() ?? new List<string>();

    public bool IsInRole(string role) => User?.IsInRole(role) ?? false;

    public int RequireUserId() =>
        UserId ?? throw new UnauthorizedException("Authentication is required.");
}
