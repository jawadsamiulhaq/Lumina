namespace Ecommerce.Domain.Entities;

/// <summary>A granular capability that can be granted to a role (e.g. "products.manage").</summary>
public class Permission
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }

    public ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
}
