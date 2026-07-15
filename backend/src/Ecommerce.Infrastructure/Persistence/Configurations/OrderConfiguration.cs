using Ecommerce.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ecommerce.Infrastructure.Persistence.Configurations;

public class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> b)
    {
        b.Property(x => x.UserId).IsRequired();
        b.Property(x => x.Email).IsRequired().HasMaxLength(256);
        b.Property(x => x.ShippingFullName).IsRequired().HasMaxLength(200);
        b.Property(x => x.ShippingLine1).IsRequired().HasMaxLength(300);
        b.Property(x => x.ShippingLine2).HasMaxLength(300);
        b.Property(x => x.ShippingCity).IsRequired().HasMaxLength(150);
        b.Property(x => x.ShippingState).HasMaxLength(150);
        b.Property(x => x.ShippingPostalCode).IsRequired().HasMaxLength(30);
        b.Property(x => x.ShippingCountry).IsRequired().HasMaxLength(100);
        b.Property(x => x.StripeSessionId).HasMaxLength(200);
        b.Property(x => x.StripePaymentIntentId).HasMaxLength(200);
        b.Property(x => x.Status).HasConversion<int>();

        b.HasIndex(x => x.UserId);
        b.HasIndex(x => x.Status);
        b.HasIndex(x => x.StripeSessionId);

        b.HasMany(x => x.Items)
            .WithOne(i => i.Order)
            .HasForeignKey(i => i.OrderId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class OrderItemConfiguration : IEntityTypeConfiguration<OrderItem>
{
    public void Configure(EntityTypeBuilder<OrderItem> b)
    {
        b.Property(x => x.ProductName).IsRequired().HasMaxLength(200);
        b.Property(x => x.ProductSlug).HasMaxLength(230);
        b.Property(x => x.ImageUrl).HasMaxLength(1000);
        b.Property(x => x.VariantDescription).HasMaxLength(300);
        b.Ignore(x => x.LineTotalInCents);

        // Keep order history when a product is deleted.
        b.HasOne(x => x.Product)
            .WithMany()
            .HasForeignKey(x => x.ProductId)
            .OnDelete(DeleteBehavior.SetNull);

        // NO ACTION (not SET NULL) to avoid multiple cascade paths on OrderItems — SQL Server
        // forbids two SET NULL paths (Products + ProductVariants). Order history is preserved by
        // the snapshot columns (VariantDescription, ProductName, UnitPriceInCents) regardless.
        b.HasOne(x => x.ProductVariant)
            .WithMany()
            .HasForeignKey(x => x.ProductVariantId)
            .OnDelete(DeleteBehavior.NoAction);
    }
}
