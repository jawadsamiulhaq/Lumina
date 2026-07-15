namespace Ecommerce.Domain.Entities;

/// <summary>Join row granting a <see cref="Permission"/> to an Identity role.</summary>
public class RolePermission
{
    /// <summary>FK to the Identity role (identity.Roles). Kept as a bare int to avoid coupling Domain to Identity.</summary>
    public int RoleId { get; set; }

    public int PermissionId { get; set; }
    public Permission? Permission { get; set; }
}
