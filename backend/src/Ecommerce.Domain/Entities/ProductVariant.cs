namespace Ecommerce.Domain.Entities;

/// <summary>
/// A concrete, purchasable combination of option values (e.g. Size=M, Color=Red) with its own
/// stock and optional price/SKU. A product with no variants behaves as a simple product.
/// </summary>
public class ProductVariant
{
    public int Id { get; set; }

    public int ProductId { get; set; }
    public Product? Product { get; set; }

    public string? Sku { get; set; }

    /// <summary>Optional override; when null the parent <see cref="Product.PriceInCents"/> applies.</summary>
    public int? PriceInCents { get; set; }

    public int Stock { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<ProductVariantValue> Values { get; set; } = new List<ProductVariantValue>();
}
