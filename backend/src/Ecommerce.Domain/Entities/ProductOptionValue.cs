namespace Ecommerce.Domain.Entities;

/// <summary>A single value on a <see cref="ProductOption"/>, e.g. "M" or "Red".</summary>
public class ProductOptionValue
{
    public int Id { get; set; }

    public int ProductOptionId { get; set; }
    public ProductOption? Option { get; set; }

    public string Value { get; set; } = string.Empty;
    public int SortOrder { get; set; }

    /// <summary>
    /// Optional product image to show when this value is selected (e.g. a swatch photo for
    /// Color=Red). Stored as a plain URL — matching one of the parent product's image URLs —
    /// rather than a FK, since it's set in the same request that (re)creates the images.
    /// </summary>
    public string? ImageUrl { get; set; }
}
