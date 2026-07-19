using Ecommerce.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ecommerce.Infrastructure.Persistence.Configurations;

public class EmailTemplateConfiguration : IEntityTypeConfiguration<EmailTemplate>
{
    public void Configure(EntityTypeBuilder<EmailTemplate> b)
    {
        b.ToTable("EmailTemplates");
        b.Property(x => x.Key).IsRequired().HasMaxLength(100);
        b.Property(x => x.Subject).IsRequired().HasMaxLength(300);
        b.Property(x => x.HtmlBody).IsRequired();
        b.HasIndex(x => x.Key).IsUnique();
    }
}
