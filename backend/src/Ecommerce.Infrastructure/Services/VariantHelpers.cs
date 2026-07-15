using Ecommerce.Domain.Entities;

namespace Ecommerce.Infrastructure.Services;

/// <summary>Shared logic for resolving a variant's effective price and human-readable label.</summary>
internal static class VariantHelpers
{
    /// <summary>Variant override price, or the product base price when there is no override/variant.</summary>
    public static int EffectivePrice(Product product, ProductVariant? variant) =>
        variant?.PriceInCents ?? product.PriceInCents;

    /// <summary>e.g. "Size: M, Color: Red". Requires Values → OptionValue → Option to be loaded.</summary>
    public static string BuildDescription(ProductVariant variant) =>
        string.Join(", ", variant.Values
            .Where(v => v.OptionValue?.Option is not null)
            .OrderBy(v => v.OptionValue!.Option!.SortOrder)
            .ThenBy(v => v.OptionValue!.Option!.Name)
            .Select(v => $"{v.OptionValue!.Option!.Name}: {v.OptionValue.Value}"));
}
