using Microsoft.AspNetCore.Authorization;

namespace Ecommerce.API.Authorization;

/// <summary>
/// Authorizes an endpoint by permission, e.g. <c>[HasPermission(Permissions.ManageUsers)]</c>.
/// Backed by <see cref="PermissionPolicyProvider"/>, which materialises a policy per permission.
/// </summary>
public sealed class HasPermissionAttribute : AuthorizeAttribute
{
    public const string PolicyPrefix = "perm:";

    public HasPermissionAttribute(string permission) => Policy = PolicyPrefix + permission;
}
