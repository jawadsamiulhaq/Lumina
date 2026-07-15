namespace Ecommerce.Domain.Entities;

/// <summary>A single value on a <see cref="ProductOption"/>, e.g. "M" or "Red".</summary>
public class ProductOptionValue
{
    public int Id { get; set; }

    public int ProductOptionId { get; set; }
    public ProductOption? Option { get; set; }

    public string Value { get; set; } = string.Empty;
    public int SortOrder { get; set; }
}
