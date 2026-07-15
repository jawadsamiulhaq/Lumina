namespace Ecommerce.Domain.Entities;

/// <summary>An option axis for a product, e.g. "Size" or "Color".</summary>
public class ProductOption
{
    public int Id { get; set; }

    public int ProductId { get; set; }
    public Product? Product { get; set; }

    public string Name { get; set; } = string.Empty;
    public int SortOrder { get; set; }

    public ICollection<ProductOptionValue> Values { get; set; } = new List<ProductOptionValue>();
}
