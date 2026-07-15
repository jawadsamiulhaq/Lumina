using Ecommerce.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ecommerce.Infrastructure.Persistence.Configurations;

public class ProductOptionConfiguration : IEntityTypeConfiguration<ProductOption>
{
    public void Configure(EntityTypeBuilder<ProductOption> b)
    {
        b.Property(x => x.Name).IsRequired().HasMaxLength(100);
        b.HasOne(x => x.Product)
            .WithMany(p => p.Options)
            .HasForeignKey(x => x.ProductId)
            .OnDelete(DeleteBehavior.Cascade);
        b.HasMany(x => x.Values)
            .WithOne(v => v.Option)
            .HasForeignKey(v => v.ProductOptionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class ProductOptionValueConfiguration : IEntityTypeConfiguration<ProductOptionValue>
{
    public void Configure(EntityTypeBuilder<ProductOptionValue> b)
    {
        b.Property(x => x.Value).IsRequired().HasMaxLength(100);
    }
}

public class ProductVariantConfiguration : IEntityTypeConfiguration<ProductVariant>
{
    public void Configure(EntityTypeBuilder<ProductVariant> b)
    {
        b.Property(x => x.Sku).HasMaxLength(100);
        b.HasOne(x => x.Product)
            .WithMany(p => p.Variants)
            .HasForeignKey(x => x.ProductId)
            .OnDelete(DeleteBehavior.Cascade);
        b.HasMany(x => x.Values)
            .WithOne(v => v.Variant)
            .HasForeignKey(v => v.ProductVariantId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class ProductVariantValueConfiguration : IEntityTypeConfiguration<ProductVariantValue>
{
    public void Configure(EntityTypeBuilder<ProductVariantValue> b)
    {
        b.HasKey(x => new { x.ProductVariantId, x.ProductOptionValueId });

        // Restrict on the option-value side to avoid multiple cascade paths from Product.
        b.HasOne(x => x.OptionValue)
            .WithMany()
            .HasForeignKey(x => x.ProductOptionValueId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
