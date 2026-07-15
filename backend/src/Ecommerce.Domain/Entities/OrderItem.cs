namespace Ecommerce.Domain.Entities;

public class OrderItem
{
    public int Id { get; set; }

    public int OrderId { get; set; }
    public Order? Order { get; set; }

    /// <summary>Nullable so the historical order survives product deletion.</summary>
    public int? ProductId { get; set; }
    public Product? Product { get; set; }

    /// <summary>Purchased variant, if any. Nullable so history survives variant deletion.</summary>
    public int? ProductVariantId { get; set; }
    public ProductVariant? ProductVariant { get; set; }

    // Snapshots taken at purchase time
    public string ProductName { get; set; } = string.Empty;
    public string? ProductSlug { get; set; }
    public string? ImageUrl { get; set; }

    /// <summary>Human-readable variant snapshot, e.g. "Size: M, Color: Red".</summary>
    public string? VariantDescription { get; set; }

    public int UnitPriceInCents { get; set; }
    public int Quantity { get; set; }

    public int LineTotalInCents => UnitPriceInCents * Quantity;
}
