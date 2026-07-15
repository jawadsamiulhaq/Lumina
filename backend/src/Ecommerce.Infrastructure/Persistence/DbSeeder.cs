using Ecommerce.Application.Common;
using Ecommerce.Domain.Constants;
using Ecommerce.Domain.Entities;
using Ecommerce.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Ecommerce.Infrastructure.Persistence;

public static class DbSeeder
{
    public const string AdminEmail = "admin@example.com";
    public const string AdminPassword = "Admin123!$";

    public static async Task SeedAsync(IServiceProvider services, CancellationToken ct = default)
    {
        using var scope = services.CreateScope();
        var sp = scope.ServiceProvider;
        var db = sp.GetRequiredService<AppDbContext>();
        var roleManager = sp.GetRequiredService<RoleManager<IdentityRole<int>>>();
        var userManager = sp.GetRequiredService<UserManager<ApplicationUser>>();
        var logger = sp.GetRequiredService<ILoggerFactory>().CreateLogger("DbSeeder");

        await db.Database.MigrateAsync(ct);

        // Roles
        foreach (var role in Roles.All)
        {
            if (!await roleManager.RoleExistsAsync(role))
                await roleManager.CreateAsync(new IdentityRole<int>(role));
        }

        // Permissions + role mappings
        await SeedPermissionsAsync(db, roleManager, ct);

        // Admin user
        if (await userManager.FindByEmailAsync(AdminEmail) is null)
        {
            var admin = new ApplicationUser
            {
                UserName = AdminEmail,
                Email = AdminEmail,
                EmailConfirmed = true,
                FirstName = "Store",
                LastName = "Admin",
                CreatedAt = DateTime.UtcNow
            };
            var result = await userManager.CreateAsync(admin, AdminPassword);
            if (result.Succeeded)
            {
                await userManager.AddToRolesAsync(admin, new[] { Roles.Admin, Roles.Customer });
                logger.LogInformation("Seeded admin user {Email}", AdminEmail);
            }
            else
            {
                logger.LogError("Failed to seed admin: {Errors}", string.Join(", ", result.Errors.Select(e => e.Description)));
            }
        }

        // Categories + products
        if (!await db.Categories.AnyAsync(ct))
        {
            var categories = SeedData.Categories.Select(name => new Category
            {
                Name = name,
                Slug = SlugGenerator.Generate(name)
            }).ToList();
            db.Categories.AddRange(categories);
            await db.SaveChangesAsync(ct);

            var byName = categories.ToDictionary(c => c.Name, c => c.Id);
            var products = new List<Product>();
            var i = 0;
            foreach (var (name, categoryName, priceCents, stock, description, featured) in SeedData.Products)
            {
                i++;
                var product = new Product
                {
                    Name = name,
                    Slug = SlugGenerator.Generate(name),
                    Description = description,
                    PriceInCents = priceCents,
                    Stock = stock,
                    IsActive = true,
                    IsFeatured = featured,
                    CategoryId = byName[categoryName],
                    CreatedAt = DateTime.UtcNow.AddDays(-i),
                    UpdatedAt = DateTime.UtcNow.AddDays(-i)
                };
                for (var img = 0; img < 3; img++)
                {
                    product.Images.Add(new ProductImage
                    {
                        Url = $"https://picsum.photos/seed/prod-{i}-{img}/900/900",
                        AltText = $"{name} image {img + 1}",
                        SortOrder = img,
                        IsPrimary = img == 0
                    });
                }
                products.Add(product);
            }
            db.Products.AddRange(products);
            await db.SaveChangesAsync(ct);
            logger.LogInformation("Seeded {CategoryCount} categories and {ProductCount} products",
                categories.Count, products.Count);
        }
    }

    private static async Task SeedPermissionsAsync(AppDbContext db, RoleManager<IdentityRole<int>> roleManager, CancellationToken ct)
    {
        // Ensure every known permission exists
        var existing = await db.Permissions.ToListAsync(ct);
        foreach (var (name, description) in Permissions.All)
        {
            if (existing.All(p => p.Name != name))
                db.Permissions.Add(new Permission { Name = name, Description = description });
        }
        await db.SaveChangesAsync(ct);

        var permIdByName = await db.Permissions.ToDictionaryAsync(p => p.Name, p => p.Id, ct);

        await MapRolePermissionsAsync(db, roleManager, permIdByName, Roles.Admin, Permissions.Admin, ct);
        await MapRolePermissionsAsync(db, roleManager, permIdByName, Roles.Customer, Permissions.Customer, ct);
    }

    private static async Task MapRolePermissionsAsync(
        AppDbContext db,
        RoleManager<IdentityRole<int>> roleManager,
        IReadOnlyDictionary<string, int> permIdByName,
        string roleName,
        string[] permissionNames,
        CancellationToken ct)
    {
        var role = await roleManager.FindByNameAsync(roleName);
        if (role is null) return;

        var granted = await db.RolePermissions
            .Where(rp => rp.RoleId == role.Id)
            .Select(rp => rp.PermissionId)
            .ToListAsync(ct);

        foreach (var name in permissionNames)
        {
            if (!permIdByName.TryGetValue(name, out var permissionId)) continue;
            if (!granted.Contains(permissionId))
                db.RolePermissions.Add(new RolePermission { RoleId = role.Id, PermissionId = permissionId });
        }
        await db.SaveChangesAsync(ct);
    }
}
