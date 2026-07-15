using Ecommerce.Domain.Entities;
using Ecommerce.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ecommerce.Infrastructure.Persistence.Configurations;

public class CartConfiguration : IEntityTypeConfiguration<Cart>
{
    public void Configure(EntityTypeBuilder<Cart> b)
    {
        b.Property(x => x.UserId).IsRequired();
        b.HasIndex(x => x.UserId).IsUnique();
        b.HasMany(x => x.Items)
            .WithOne(i => i.Cart)
            .HasForeignKey(i => i.CartId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class CartItemConfiguration : IEntityTypeConfiguration<CartItem>
{
    public void Configure(EntityTypeBuilder<CartItem> b)
    {
        // One row per (cart, product, chosen variant). Simple products have a null variant,
        // which SQL Server treats as a single distinct value, so one row per product still holds.
        b.HasIndex(x => new { x.CartId, x.ProductId, x.ProductVariantId }).IsUnique();
        b.HasOne(x => x.Product)
            .WithMany()
            .HasForeignKey(x => x.ProductId)
            .OnDelete(DeleteBehavior.Cascade);
        b.HasOne(x => x.ProductVariant)
            .WithMany()
            .HasForeignKey(x => x.ProductVariantId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class ReviewConfiguration : IEntityTypeConfiguration<Review>
{
    public void Configure(EntityTypeBuilder<Review> b)
    {
        b.Property(x => x.UserId).IsRequired();
        b.Property(x => x.UserName).IsRequired().HasMaxLength(200);
        b.Property(x => x.Comment).IsRequired().HasMaxLength(2000);
        // One review per user per product
        b.HasIndex(x => new { x.ProductId, x.UserId }).IsUnique();
    }
}

public class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> b)
    {
        b.Property(x => x.TokenHash).IsRequired().HasMaxLength(200);
        b.Property(x => x.ReplacedByTokenHash).HasMaxLength(200);
        b.Ignore(x => x.IsActive);
        b.HasIndex(x => x.TokenHash);
        b.HasOne(x => x.User)
            .WithMany(u => u.RefreshTokens)
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
