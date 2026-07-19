using System.Reflection;
using Ecommerce.Domain.Entities;
using Ecommerce.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Infrastructure.Persistence;

public class AppDbContext : IdentityDbContext<ApplicationUser, IdentityRole<int>, int>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<ProductImage> ProductImages => Set<ProductImage>();
    public DbSet<ProductOption> ProductOptions => Set<ProductOption>();
    public DbSet<ProductOptionValue> ProductOptionValues => Set<ProductOptionValue>();
    public DbSet<ProductVariant> ProductVariants => Set<ProductVariant>();
    public DbSet<ProductVariantValue> ProductVariantValues => Set<ProductVariantValue>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<Cart> Carts => Set<Cart>();
    public DbSet<CartItem> CartItems => Set<CartItem>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<Permission> Permissions => Set<Permission>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
    public DbSet<EmailTemplate> EmailTemplates => Set<EmailTemplate>();
    public DbSet<EmailLog> EmailLogs => Set<EmailLog>();
    public DbSet<Offer> Offers => Set<Offer>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        builder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());

        // Move the Identity tables into the "identity" schema and drop the "AspNet" prefix,
        // e.g. dbo.AspNetUsers -> identity.Users. The Permissions/RolePermissions tables are
        // placed in the same schema by their own configuration.
        builder.Entity<ApplicationUser>().ToTable("Users", "identity");
        builder.Entity<IdentityRole<int>>().ToTable("Roles", "identity");
        builder.Entity<IdentityUserRole<int>>().ToTable("UserRoles", "identity");
        builder.Entity<IdentityUserClaim<int>>().ToTable("UserClaims", "identity");
        builder.Entity<IdentityUserLogin<int>>().ToTable("UserLogins", "identity");
        builder.Entity<IdentityUserToken<int>>().ToTable("UserTokens", "identity");
        builder.Entity<IdentityRoleClaim<int>>().ToTable("RoleClaims", "identity");
    }
}
