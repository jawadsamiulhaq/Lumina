namespace Ecommerce.Domain.Entities;

/// <summary>A time-limited promotional banner shown on the storefront (display-only, no price effect).</summary>
public class Offer
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Subtitle { get; set; }

    /// <summary>Free-text discount badge, e.g. "30% OFF" or "Buy 1 Get 1".</summary>
    public string? DiscountLabel { get; set; }

    public string? ImageUrl { get; set; }
    public string CtaText { get; set; } = "Shop now";
    public string CtaUrl { get; set; } = "/products";

    public DateTime StartsAt { get; set; }
    public DateTime EndsAt { get; set; }
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
