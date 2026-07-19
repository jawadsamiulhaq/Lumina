namespace Ecommerce.Domain.Constants;

/// <summary>
/// Named capabilities that can be granted to roles. Seeded into identity.Permissions and
/// mapped to roles via identity.RolePermissions.
/// </summary>
public static class Permissions
{
    /// <summary>JWT claim type under which each granted permission is emitted.</summary>
    public const string ClaimType = "permission";

    /// <summary>JWT claim carrying the admin's id while they impersonate another user.</summary>
    public const string ImpersonatorClaim = "impersonator_id";

    public const string ManageProducts = "products.manage";
    public const string ManageCategories = "categories.manage";
    public const string ManageOrders = "orders.manage";
    public const string ManageUsers = "users.manage";
    public const string ImpersonateUsers = "users.impersonate";
    public const string ViewDashboard = "dashboard.view";
    public const string ViewOrders = "orders.view";
    public const string ViewOrderStats = "orders.stats";
    public const string ManageSettings = "settings.manage";
    public const string WriteReviews = "reviews.write";

    /// <summary>All permissions with their descriptions, used for seeding.</summary>
    public static readonly (string Name, string Description)[] All =
    {
        (ManageProducts, "Create, update and delete products"),
        (ManageCategories, "Create, update and delete categories"),
        (ManageOrders, "View all orders and update their status"),
        (ManageUsers, "View users and change their roles"),
        (ImpersonateUsers, "Sign in as another (non-admin) user"),
        (ViewDashboard, "View the admin dashboard"),
        (ViewOrders, "View own orders"),
        (ViewOrderStats, "View order counts by status"),
        (ManageSettings, "Manage store settings and email templates"),
        (WriteReviews, "Write product reviews"),
    };

    public static readonly string[] Admin =
    {
        ManageProducts, ManageCategories, ManageOrders, ManageUsers, ImpersonateUsers, ViewDashboard, ViewOrders, ViewOrderStats, ManageSettings, WriteReviews,
    };

    public static readonly string[] Customer =
    {
        ViewOrders, WriteReviews,
    };
}
