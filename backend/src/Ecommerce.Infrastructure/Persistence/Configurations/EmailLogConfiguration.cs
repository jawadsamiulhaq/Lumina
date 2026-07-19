using Ecommerce.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ecommerce.Infrastructure.Persistence.Configurations;

public class EmailLogConfiguration : IEntityTypeConfiguration<EmailLog>
{
    public void Configure(EntityTypeBuilder<EmailLog> b)
    {
        b.ToTable("EmailLogs");
        b.Property(x => x.ToEmail).IsRequired().HasMaxLength(256);
        b.Property(x => x.Subject).IsRequired().HasMaxLength(300);
        b.Property(x => x.Body).IsRequired();
        b.Property(x => x.Error).HasMaxLength(2000);
        b.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
        b.HasIndex(x => x.CreatedAt);
    }
}
