namespace Ecommerce.Application.DTOs;

public record CartItemDto(
    int Id,
    int ProductId,
    string Name,
    string Slug,
    int UnitPriceInCents,
    int Quantity,
    int Stock,
    string? ImageUrl,
    int LineTotalInCents,
    int? VariantId,
    string? VariantLabel);

public record CartDto(
    IReadOnlyList<CartItemDto> Items,
    int SubtotalInCents,
    int ItemCount);

public class AddCartItemRequest
{
    public int ProductId { get; set; }
    /// <summary>Required when the product has variants; must be null for a simple product.</summary>
    public int? VariantId { get; set; }
    public int Quantity { get; set; } = 1;
}

public class UpdateCartItemRequest
{
    public int Quantity { get; set; }
}
