namespace Ecommerce.Application.DTOs;

public record ProductImageDto(int Id, string Url, string? AltText, int SortOrder, bool IsPrimary);

public record ProductOptionValueDto(int Id, string Value, string? ImageUrl);

public record ProductOptionDto(int Id, string Name, IReadOnlyList<ProductOptionValueDto> Values);

public record ProductVariantDto(
    int Id,
    string? Sku,
    /// <summary>Effective price (override, or the product base price) — for display.</summary>
    int PriceInCents,
    /// <summary>Raw override, or null when the base price applies — for admin editing.</summary>
    int? PriceOverrideInCents,
    int Stock,
    bool IsActive,
    /// <summary>Ids of the option values this variant is composed of.</summary>
    IReadOnlyList<int> OptionValueIds,
    /// <summary>Human-readable label, e.g. "Size: M, Color: Red".</summary>
    string Description);

public record ProductListItemDto(
    int Id,
    string Name,
    string Slug,
    int PriceInCents,
    int Stock,
    bool IsActive,
    bool IsFeatured,
    string CategoryName,
    string CategorySlug,
    string? PrimaryImageUrl,
    double AverageRating,
    int ReviewCount,
    bool HasVariants);

public record ProductDetailDto(
    int Id,
    string Name,
    string Slug,
    string Description,
    int PriceInCents,
    int Stock,
    bool IsActive,
    bool IsFeatured,
    int CategoryId,
    string CategoryName,
    string CategorySlug,
    IReadOnlyList<ProductImageDto> Images,
    double AverageRating,
    int ReviewCount,
    DateTime CreatedAt,
    bool HasVariants,
    IReadOnlyList<ProductOptionDto> Options,
    IReadOnlyList<ProductVariantDto> Variants);

public class ProductImageInput
{
    public string Url { get; set; } = string.Empty;
    public string? AltText { get; set; }
    public int SortOrder { get; set; }
    public bool IsPrimary { get; set; }
}

public class ProductOptionValueInput
{
    public string Value { get; set; } = string.Empty;

    /// <summary>Optional image (must match one of the product's Images[].Url) shown when this value is selected.</summary>
    public string? ImageUrl { get; set; }
}

public class ProductOptionInput
{
    public string Name { get; set; } = string.Empty;
    public List<ProductOptionValueInput> Values { get; set; } = new();
}

public class ProductVariantValueInput
{
    public string OptionName { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
}

public class ProductVariantInput
{
    public string? Sku { get; set; }
    /// <summary>Optional price override; null means "use the product base price".</summary>
    public int? PriceInCents { get; set; }
    public int Stock { get; set; }
    public bool IsActive { get; set; } = true;
    /// <summary>The option values that define this variant (one per option).</summary>
    public List<ProductVariantValueInput> Values { get; set; } = new();
}

public class CreateProductRequest
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int PriceInCents { get; set; }
    public int Stock { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsFeatured { get; set; }
    public int CategoryId { get; set; }
    public List<ProductImageInput> Images { get; set; } = new();

    /// <summary>Option axes (e.g. Size, Color). Empty for a simple product.</summary>
    public List<ProductOptionInput> Options { get; set; } = new();

    /// <summary>Purchasable variants; each references one value per option.</summary>
    public List<ProductVariantInput> Variants { get; set; } = new();
}

public class UpdateProductRequest : CreateProductRequest { }

public enum ProductSort
{
    Newest = 0,
    PriceAsc = 1,
    PriceDesc = 2,
    NameAsc = 3,
    TopRated = 4
}

public class ProductQuery
{
    public string? Search { get; set; }
    public string? CategorySlug { get; set; }
    public int? MinPriceCents { get; set; }
    public int? MaxPriceCents { get; set; }
    public ProductSort Sort { get; set; } = ProductSort.Newest;
    public bool? FeaturedOnly { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 12;

    /// <summary>Admin-only: include soft-deleted / inactive products.</summary>
    public bool IncludeInactive { get; set; }
}
