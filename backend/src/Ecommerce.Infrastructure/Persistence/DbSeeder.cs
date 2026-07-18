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

        // Categories (idempotent: add any that are missing)
        var existingCategoryNames = await db.Categories.Select(c => c.Name).ToListAsync(ct);
        var newCategories = SeedData.Categories
            .Where(name => !existingCategoryNames.Contains(name))
            .Select(name => new Category { Name = name, Slug = SlugGenerator.Generate(name) })
            .ToList();
        if (newCategories.Count > 0)
        {
            db.Categories.AddRange(newCategories);
            await db.SaveChangesAsync(ct);
            logger.LogInformation("Seeded {Count} new categories", newCategories.Count);
        }

        var categoryIdByName = await db.Categories.ToDictionaryAsync(c => c.Name, c => c.Id, ct);
        var existingSlugs = (await db.Products.Select(p => p.Slug).ToListAsync(ct)).ToHashSet();

        // Simple products (idempotent by slug)
        var simpleToAdd = new List<Product>();
        var order = existingSlugs.Count;
        foreach (var (name, categoryName, priceCents, stock, description, featured, imageKeyword) in SeedData.Products)
        {
            var slug = SlugGenerator.Generate(name);
            if (existingSlugs.Contains(slug) || !categoryIdByName.TryGetValue(categoryName, out var categoryId))
                continue;
            order++;
            var product = new Product
            {
                Name = name,
                Slug = slug,
                Description = description,
                PriceInCents = priceCents,
                Stock = stock,
                IsActive = true,
                IsFeatured = featured,
                CategoryId = categoryId,
                CreatedAt = DateTime.UtcNow.AddDays(-order),
                UpdatedAt = DateTime.UtcNow.AddDays(-order)
            };
            AddSeedImages(product, slug, imageKeyword);
            simpleToAdd.Add(product);
            existingSlugs.Add(slug);
        }
        if (simpleToAdd.Count > 0)
        {
            db.Products.AddRange(simpleToAdd);
            await db.SaveChangesAsync(ct);
            logger.LogInformation("Seeded {Count} simple products", simpleToAdd.Count);
        }

        // Products with variants (idempotent by slug)
        await SeedVariantProductsAsync(db, categoryIdByName, existingSlugs, logger, ct);

        // One-time repair for products seeded before real, curated photos were wired up (they used
        // to get random unrelated picsum.photos shots, then unreliable/slow loremflickr.com ones).
        // Never touches images an admin has since customized.
        await BackfillLegacySeedImagesAsync(db, logger, ct);
    }

    private static void AddSeedImages(Product product, string slug, string imageKeyword)
    {
        for (var img = 0; img < 3; img++)
        {
            product.Images.Add(new ProductImage
            {
                Url = UnsplashUrl(imageKeyword, img),
                AltText = $"{product.Name} image {img + 1}",
                SortOrder = img,
                IsPrimary = img == 0
            });
        }
    }

    /// <summary>
    /// Real, hand-picked Unsplash photo IDs per keyword (e.g. "espressomachine"), 4 per keyword —
    /// each verified to resolve on images.unsplash.com. Unsplash's CDN is fast/reliable and supports
    /// on-the-fly resizing (w=/q=/auto=format), so the frontend requests exactly the size it needs
    /// instead of downloading a full-resolution photo for a thumbnail.
    /// </summary>
    private static readonly Dictionary<string, string[]> UnsplashPhotoIdsByKeyword = new(StringComparer.OrdinalIgnoreCase)
    {
        ["headphones"] = new[] { "1505740420928-5e560c06d30e", "1618366712010-f4ae9c647dcb", "1545127398-14699f92334b", "1546435770-a3e426bf472b" },
        ["laptop"] = new[] { "1773332585815-f106a5d6ed6c", "1525547719571-a2d4ac8945e2", "1496181133206-80ce9b88a853", "1541807084-5c52b6b3adef" },
        ["smartwatch"] = new[] { "1579586337278-3befd40fd17a", "1660844817855-3ecc7ef21f12", "1508685096489-7aacd43bd3b1", "1546868871-7041f2a55e12" },
        ["speaker"] = new[] { "1608043152269-423dbba4e7e1", "1589256469067-ea99122bbdc4", "1529359744902-86b2ab9edaea", "1589003077984-894e133dabab" },
        ["actioncamera"] = new[] { "1484506399805-c273b8e91dce", "1603720913661-76d1053714e2", "1562878671-b3efe27953b9", "1477160814815-7f4479b86c97" },
        ["sweater"] = new[] { "1601379327928-bedfaf9da2d0", "1574201635302-388dd92a4c3f", "1610901157620-340856d0a50f", "1581497396202-5645e76a3a8e" },
        ["rainjacket"] = new[] { "1521223890158-f9f7c3d5d504", "1727515546577-f7d82a47b51d", "1548883354-94bcfe321cbb", "1655972670403-243839675e06" },
        ["jacket"] = new[] { "1611312449408-fcece27cdbb7", "1537465978529-d23b17165b3b", "1543076447-215ad9ba6923", "1495105787522-5334e3ffa0ef" },
        ["sneakers"] = new[] { "1542291026-7eec264c27ff", "1606107557195-0e29a4b5b4aa", "1571008887538-b36bb32f4571", "1560769629-975ec94e6a86" },
        ["belt"] = new[] { "1664286074176-5206ee5dc878", "1664285612706-b32633c95820", "1666723043169-22e29545675c", "1711443982852-b3df5c563448" },
        ["espressomachine"] = new[] { "1616388761741-a5936c6f61f6", "1620807773206-49c1f2957417", "1583165278997-0250ea5d72e2", "1475296204602-08d15839e95f" },
        ["knife"] = new[] { "1622021142947-da7dedc7c39a", "1614362705324-8da11fd16754", "1596633609591-e4e1e9e06b7f", "1604543248368-da42b20dce5b" },
        ["dutchoven"] = new[] { "1556910148-3adb7f0c665a", "1590794056226-79ef3a8147e1", "1595440431225-1c25fd023f71", "1601794244976-96676c187182" },
        ["lamp"] = new[] { "1517991104123-1d56a6e81ed9", "1580130281320-0ef0754f2bf7", "1585128719715-46776b56a0d1", "1642689703534-e41f29622078" },
        ["humidifiers"] = new[] { "1672925216623-f32a54d732e0", "1617775047746-5b36a40109f5", "1634681896994-0027a701b1d7", "1709745634912-2a79b938f3c2" },
        ["backpack"] = new[] { "1551632811-561732d1e306", "1501555088652-021faa106b9b", "1586022045497-31fcf76fa6cc", "1476979735039-2fdea9e9e407" },
        ["yoga"] = new[] { "1599901860904-17e6ed7083a0", "1552196563-55cd4e45efb3", "1579454566790-f9e5697ddf36", "1552196527-bffef41ef674" },
        ["dumbbell"] = new[] { "1638536532686-d610adfc8e5c", "1672344048213-76b6e77304bd", "1685633224688-6a77675eb119", "1576678927484-cc907957088c" },
        ["trekkingpole"] = new[] { "1635745488837-ffa006eaf9cf", "1593739742226-5e5e2fdb1f1c", "1632411316785-33d395035a3c", "1623783593139-f4f36b7bbb2f" },
        ["waterbottle"] = new[] { "1602143407151-7111542de6e8", "1616118132534-381148898bb4", "1625708458528-802ec79b1ed8", "1544003484-3cd181d17917" },
        ["serum"] = new[] { "1723951174326-2a97221d3b7f", "1619166855062-f63c187def3d", "1731599974318-97a336b9bd5f", "1638609269435-1b4421f8585c" },
        ["handcream"] = new[] { "1619451427882-6aaaded0cc61", "1601065732058-029db52c86b4", "1601049541289-9b1b7bbbfe19", "1506543277633-99deabfcd722" },
        ["clay"] = new[] { "1626783416763-67a92e5e7266", "1623225088166-eea1cdc9775a", "1516815989420-9cb5ef0fce78", "1465400325222-409b0b34be7c" },
        ["perfume"] = new[] { "1523293182086-7651a899d37f", "1541643600914-78b084683601", "1594035910387-fea47794261f", "1458538977777-0549b2370168" },
        ["buildingblocks"] = new[] { "1587654780291-39c9404d746b", "1633469924738-52101af51d87", "1644175897056-50f4d3a9a827", "1603558431750-dfa36513aee6" },
        ["puzzle"] = new[] { "1730804518415-75297e8d2a41", "1591040092219-081fb773589c", "1612611741189-a9b9eb01d515", "1637094408647-0d81d08f81b5" },
        ["rccar"] = new[] { "1591438252948-fa5dd3701c2a", "1727622738048-29e6f37b2a8c", "1727622738037-65923e2319d9", "1630029546304-981fdadbb842" },
        ["tshirt"] = new[] { "1581655353564-df123a1eb820", "1521572163474-6864f9cf17ab", "1583743814966-8936f5b7be1a", "1622445275463-afa2ab738c34" },
        ["hoodie"] = new[] { "1620799140188-3b2a02fd9a77", "1556821840-3a63f95609a7", "1680292783974-a9a336c10366", "1564557287817-3785e38ec1f5" },
        ["tumbler"] = new[] { "1683161532546-06bb13f914cc", "1729192293999-ffbdc97cbac9", "1718882705958-797686aac498", "1642698043660-a3827ca09337" },
    };

    /// <summary>
    /// Resolves the <paramref name="index"/>-th curated photo for a keyword (wrapping if there are
    /// more images/colors requested than curated photos).
    /// </summary>
    private static string UnsplashUrl(string imageKeyword, int index)
    {
        var ids = UnsplashPhotoIdsByKeyword[imageKeyword];
        return $"https://images.unsplash.com/photo-{ids[index % ids.Length]}";
    }

    /// <summary>
    /// Populates a (freshly cleared) product's Images collection. If it has a "Color" option, one
    /// photo per color is generated so the gallery visibly switches when a swatch is picked;
    /// otherwise generic shots are used. Returns the color -> image URL map for linking option values.
    /// </summary>
    private static Dictionary<string, string> ApplyProductImages(
        Product product, string slug, string imageKeyword, (string Name, string[] Values)[] options)
    {
        var colorOptionIndex = Array.FindIndex(options, o => string.Equals(o.Name, "Color", StringComparison.OrdinalIgnoreCase));
        var colorImageUrlByValue = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

        if (colorOptionIndex >= 0)
        {
            var colorValues = options[colorOptionIndex].Values;
            for (var ci = 0; ci < colorValues.Length; ci++)
            {
                // Same product keyword for every color (a stock photo can't render an actual
                // red/blue version of the item) but a distinct curated photo per color so each
                // swatch still shows a different, still-relevant real photo when clicked.
                var url = UnsplashUrl(imageKeyword, ci);
                product.Images.Add(new ProductImage
                {
                    Url = url,
                    AltText = $"{product.Name} in {colorValues[ci]}",
                    SortOrder = ci,
                    IsPrimary = ci == 0
                });
                colorImageUrlByValue[colorValues[ci]] = url;
            }
        }
        else
        {
            AddSeedImages(product, slug, imageKeyword);
        }

        return colorImageUrlByValue;
    }

    /// <summary>
    /// Repairs photos for products that were seeded before curated Unsplash images were wired up
    /// (they got random unrelated picsum.photos shots, or unreliable/slow loremflickr.com ones).
    /// Only touches rows whose images are still entirely from one of those legacy sources, so any
    /// image an admin has since uploaded/customized is left alone.
    /// </summary>
    private static async Task BackfillLegacySeedImagesAsync(AppDbContext db, ILogger logger, CancellationToken ct)
    {
        var simpleBySlug = SeedData.Products.ToDictionary(p => SlugGenerator.Generate(p.Name), p => p.ImageKeyword);
        var variantBySlug = SeedData.VariantProducts.ToDictionary(p => SlugGenerator.Generate(p.Name), p => p);
        var knownSlugs = simpleBySlug.Keys.Concat(variantBySlug.Keys).ToHashSet();
        if (knownSlugs.Count == 0) return;

        var candidates = await db.Products
            .Where(p => knownSlugs.Contains(p.Slug))
            .Include(p => p.Images)
            .Include(p => p.Options).ThenInclude(o => o.Values)
            .ToListAsync(ct);

        var updated = 0;
        foreach (var product in candidates)
        {
            var isLegacyPlaceholder = product.Images.Count > 0
                && product.Images.All(i => i.Url.Contains("picsum.photos", StringComparison.OrdinalIgnoreCase)
                    || i.Url.Contains("loremflickr.com", StringComparison.OrdinalIgnoreCase));
            if (!isLegacyPlaceholder) continue;

            db.ProductImages.RemoveRange(product.Images);
            product.Images.Clear();

            if (variantBySlug.TryGetValue(product.Slug, out var variantSeed))
            {
                var colorImageUrlByValue = ApplyProductImages(product, product.Slug, variantSeed.ImageKeyword, variantSeed.Options);
                var colorOption = product.Options.FirstOrDefault(o => string.Equals(o.Name, "Color", StringComparison.OrdinalIgnoreCase));
                if (colorOption is not null)
                {
                    foreach (var ov in colorOption.Values)
                    {
                        if (colorImageUrlByValue.TryGetValue(ov.Value, out var url))
                            ov.ImageUrl = url;
                    }
                }
            }
            else if (simpleBySlug.TryGetValue(product.Slug, out var keyword))
            {
                AddSeedImages(product, product.Slug, keyword);
            }

            updated++;
        }

        if (updated > 0)
        {
            await db.SaveChangesAsync(ct);
            logger.LogInformation("Backfilled relevant photos for {Count} previously-seeded products", updated);
        }
    }

    private static async Task SeedVariantProductsAsync(
        AppDbContext db,
        IReadOnlyDictionary<string, int> categoryIdByName,
        HashSet<string> existingSlugs,
        ILogger logger,
        CancellationToken ct)
    {
        var toAdd = new List<Product>();

        foreach (var seed in SeedData.VariantProducts)
        {
            var slug = SlugGenerator.Generate(seed.Name);
            if (existingSlugs.Contains(slug) || !categoryIdByName.TryGetValue(seed.Category, out var categoryId))
                continue;

            var product = new Product
            {
                Name = seed.Name,
                Slug = slug,
                Description = seed.Description,
                PriceInCents = seed.Price,
                IsActive = true,
                IsFeatured = seed.Featured,
                CategoryId = categoryId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            var colorImageUrlByValue = ApplyProductImages(product, slug, seed.ImageKeyword, seed.Options);
            var colorOptionIndex = Array.FindIndex(seed.Options, o => string.Equals(o.Name, "Color", StringComparison.OrdinalIgnoreCase));

            // Build the option axes (Size, Color…) with their values.
            var options = new List<ProductOption>();
            for (var oi = 0; oi < seed.Options.Length; oi++)
            {
                var (optionName, values) = seed.Options[oi];
                var option = new ProductOption { Name = optionName, SortOrder = oi };
                for (var vi = 0; vi < values.Length; vi++)
                {
                    var ov = new ProductOptionValue { Value = values[vi], SortOrder = vi };
                    if (oi == colorOptionIndex && colorImageUrlByValue.TryGetValue(values[vi], out var imageUrl))
                        ov.ImageUrl = imageUrl;
                    option.Values.Add(ov);
                }
                options.Add(option);
                product.Options.Add(option);
            }

            // Expand every combination of option values into a concrete variant.
            var combinations = CartesianProduct(options.Select(o => o.Values.ToList()).ToList());
            var idx = 0;
            var totalStock = 0;
            foreach (var combo in combinations)
            {
                idx++;
                var stock = idx % 7 == 0 ? 0 : 6 + (idx * 5 % 30); // vary stock; every 7th is out of stock
                totalStock += stock;

                var variant = new ProductVariant
                {
                    Sku = $"{slug}-{idx:D2}".ToUpperInvariant(),
                    Stock = stock,
                    IsActive = true,
                    PriceInCents = null // inherit the product's base price
                };
                foreach (var optionValue in combo)
                    variant.Values.Add(new ProductVariantValue { OptionValue = optionValue });
                product.Variants.Add(variant);
            }
            product.Stock = totalStock;

            toAdd.Add(product);
            existingSlugs.Add(slug);
        }

        if (toAdd.Count > 0)
        {
            db.Products.AddRange(toAdd);
            await db.SaveChangesAsync(ct);
            logger.LogInformation("Seeded {Count} products with variants", toAdd.Count);
        }
    }

    /// <summary>Returns every combination that picks one value from each option list.</summary>
    private static List<List<ProductOptionValue>> CartesianProduct(List<List<ProductOptionValue>> lists)
    {
        var result = new List<List<ProductOptionValue>> { new() };
        foreach (var list in lists)
        {
            var next = new List<List<ProductOptionValue>>();
            foreach (var partial in result)
                foreach (var item in list)
                    next.Add(new List<ProductOptionValue>(partial) { item });
            result = next;
        }
        return result;
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
