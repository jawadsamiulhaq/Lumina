using Ecommerce.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ecommerce.Infrastructure.Persistence.Configurations;

public class OfferConfiguration : IEntityTypeConfiguration<Offer>
{
    public void Configure(EntityTypeBuilder<Offer> b)
    {
        b.Property(x => x.Title).IsRequired().HasMaxLength(160);
        b.Property(x => x.Subtitle).HasMaxLength(300);
        b.Property(x => x.DiscountLabel).HasMaxLength(40);
        b.Property(x => x.ImageUrl).HasMaxLength(1000);
        b.Property(x => x.CtaText).IsRequired().HasMaxLength(60);
        b.Property(x => x.CtaUrl).IsRequired().HasMaxLength(500);
        b.HasIndex(x => new { x.IsActive, x.StartsAt, x.EndsAt });
    }
}
