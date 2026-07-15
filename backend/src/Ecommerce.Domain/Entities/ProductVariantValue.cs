namespace Ecommerce.Domain.Entities;

/// <summary>Links a <see cref="ProductVariant"/> to one <see cref="ProductOptionValue"/> it is composed of.</summary>
public class ProductVariantValue
{
    public int ProductVariantId { get; set; }
    public ProductVariant? Variant { get; set; }

    public int ProductOptionValueId { get; set; }
    public ProductOptionValue? OptionValue { get; set; }
}
