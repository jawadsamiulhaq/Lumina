namespace Ecommerce.Domain.Constants;

/// <summary>Application role names used for role-based authorization.</summary>
public static class Roles
{
    public const string Admin = "Admin";
    public const string Customer = "Customer";

    public static readonly string[] All = { Admin, Customer };
}
