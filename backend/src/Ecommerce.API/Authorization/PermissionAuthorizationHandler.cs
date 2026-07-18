using Ecommerce.Domain.Constants;
using Microsoft.AspNetCore.Authorization;

namespace Ecommerce.API.Authorization;

/// <summary>
/// Grants access when the user carries the required permission claim. Members of the
/// <see cref="Roles.Admin"/> role always pass — the Admin role is the store super-user.
/// </summary>
public sealed class PermissionAuthorizationHandler : AuthorizationHandler<PermissionRequirement>
{
    protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, PermissionRequirement requirement)
    {
        if (context.User.IsInRole(Roles.Admin) ||
            context.User.HasClaim(Permissions.ClaimType, requirement.Permission))
        {
            context.Succeed(requirement);
        }

        return Task.CompletedTask;
    }
}
