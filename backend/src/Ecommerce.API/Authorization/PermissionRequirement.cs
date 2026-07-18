using Microsoft.AspNetCore.Authorization;

namespace Ecommerce.API.Authorization;

/// <summary>Requires the authenticated user to hold a specific permission.</summary>
public sealed class PermissionRequirement : IAuthorizationRequirement
{
    public string Permission { get; }

    public PermissionRequirement(string permission) => Permission = permission;
}
