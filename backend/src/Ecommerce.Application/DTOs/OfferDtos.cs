namespace Ecommerce.Application.DTOs;

/// <summary>Public offer shape returned to the storefront (active offers only).</summary>
public record OfferDto(
    int Id,
    string Title,
    string? Subtitle,
    string? DiscountLabel,
    string? ImageUrl,
    string CtaText,
    string CtaUrl,
    DateTime StartsAt,
    DateTime EndsAt);

/// <summary>Admin view of an offer, including scheduling state.</summary>
public record AdminOfferDto(
    int Id,
    string Title,
    string? Subtitle,
    string? DiscountLabel,
    string? ImageUrl,
    string CtaText,
    string CtaUrl,
    DateTime StartsAt,
    DateTime EndsAt,
    bool IsActive,
    int SortOrder,
    string Status,
    DateTime CreatedAt);

public class CreateOfferRequest
{
    public string Title { get; set; } = string.Empty;
    public string? Subtitle { get; set; }
    public string? DiscountLabel { get; set; }
    public string? ImageUrl { get; set; }
    public string CtaText { get; set; } = "Shop now";
    public string CtaUrl { get; set; } = "/products";
    public DateTime StartsAt { get; set; }
    public DateTime EndsAt { get; set; }
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }
}

public class UpdateOfferRequest : CreateOfferRequest;
