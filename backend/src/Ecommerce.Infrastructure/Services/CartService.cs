using Ecommerce.Application.Common;
using Ecommerce.Application.DTOs;
using Ecommerce.Application.Interfaces;
using Ecommerce.Domain.Entities;
using Ecommerce.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Infrastructure.Services;

public class CartService : ICartService
{
    private readonly AppDbContext _db;

    public CartService(AppDbContext db) => _db = db;

    public async Task<CartDto> GetAsync(int userId, CancellationToken ct = default)
    {
        var cart = await LoadCartAsync(userId, create: false, ct);
        return ToDto(cart);
    }

    public async Task<CartDto> AddAsync(int userId, AddCartItemRequest request, CancellationToken ct = default)
    {
        var product = await _db.Products
            .Include(p => p.Variants)
            .FirstOrDefaultAsync(p => p.Id == request.ProductId && p.IsActive, ct)
            ?? throw new NotFoundException("Product", request.ProductId);

        var (variant, availableStock) = ResolveVariant(product, request.VariantId);

        var cart = await LoadCartAsync(userId, create: true, ct);
        var item = cart.Items.FirstOrDefault(i => i.ProductId == product.Id && i.ProductVariantId == variant?.Id);
        var newQty = (item?.Quantity ?? 0) + request.Quantity;

        if (newQty > availableStock)
            throw new BadRequestException($"Only {availableStock} unit(s) of '{product.Name}' are in stock.");

        if (item is null)
            cart.Items.Add(new CartItem { ProductId = product.Id, ProductVariantId = variant?.Id, Quantity = request.Quantity, CartId = cart.Id });
        else
            item.Quantity = newQty;

        cart.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return await GetAsync(userId, ct);
    }

    public async Task<CartDto> UpdateItemAsync(int userId, int cartItemId, UpdateCartItemRequest request, CancellationToken ct = default)
    {
        var cart = await LoadCartAsync(userId, create: true, ct);
        var item = cart.Items.FirstOrDefault(i => i.Id == cartItemId)
            ?? throw new NotFoundException("Cart item", cartItemId);

        if (request.Quantity <= 0)
        {
            _db.CartItems.Remove(item);
        }
        else
        {
            var stock = AvailableStock(item);
            if (request.Quantity > stock)
                throw new BadRequestException($"Only {stock} unit(s) in stock.");
            item.Quantity = request.Quantity;
        }

        cart.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return await GetAsync(userId, ct);
    }

    public async Task<CartDto> RemoveItemAsync(int userId, int cartItemId, CancellationToken ct = default)
    {
        var cart = await LoadCartAsync(userId, create: false, ct);
        var item = cart.Items.FirstOrDefault(i => i.Id == cartItemId);
        if (item is not null)
        {
            _db.CartItems.Remove(item);
            cart.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
        }
        return await GetAsync(userId, ct);
    }

    public async Task ClearAsync(int userId, CancellationToken ct = default)
    {
        var cart = await LoadCartAsync(userId, create: false, ct);
        if (cart.Items.Count > 0)
        {
            _db.CartItems.RemoveRange(cart.Items);
            cart.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
        }
    }

    // ---- helpers ----

    private async Task<Cart> LoadCartAsync(int userId, bool create, CancellationToken ct)
    {
        var cart = await _db.Carts
            .Include(c => c.Items).ThenInclude(i => i.Product).ThenInclude(p => p!.Images)
            .Include(c => c.Items).ThenInclude(i => i.ProductVariant).ThenInclude(v => v!.Values).ThenInclude(vv => vv.OptionValue).ThenInclude(ov => ov!.Option)
            .FirstOrDefaultAsync(c => c.UserId == userId, ct);

        if (cart is null)
        {
            cart = new Cart { UserId = userId };
            if (create)
            {
                _db.Carts.Add(cart);
                await _db.SaveChangesAsync(ct);
            }
        }
        return cart;
    }

    /// <summary>Validates the chosen variant against the product and returns it with its available stock.</summary>
    private static (ProductVariant? Variant, int Stock) ResolveVariant(Product product, int? variantId)
    {
        var activeVariants = product.Variants.Where(v => v.IsActive).ToList();

        if (activeVariants.Count > 0)
        {
            if (variantId is null)
                throw new BadRequestException("Please choose an option before adding this item to your cart.");
            var variant = activeVariants.FirstOrDefault(v => v.Id == variantId)
                ?? throw new BadRequestException("The selected option is no longer available.");
            return (variant, variant.Stock);
        }

        if (variantId is not null)
            throw new BadRequestException("This product does not have options.");
        return (null, product.Stock);
    }

    private static int AvailableStock(CartItem item) =>
        item.ProductVariant is not null ? item.ProductVariant.Stock : item.Product?.Stock ?? 0;

    private static CartDto ToDto(Cart cart)
    {
        var items = cart.Items
            .Where(i => i.Product is not null)
            .OrderBy(i => i.CreatedAt)
            .Select(i =>
            {
                var p = i.Product!;
                var unitPrice = VariantHelpers.EffectivePrice(p, i.ProductVariant);
                var img = p.Images.OrderByDescending(im => im.IsPrimary).ThenBy(im => im.SortOrder)
                    .Select(im => im.Url).FirstOrDefault();
                var label = i.ProductVariant is not null ? VariantHelpers.BuildDescription(i.ProductVariant) : null;
                return new CartItemDto(i.Id, p.Id, p.Name, p.Slug, unitPrice, i.Quantity, AvailableStock(i), img,
                    unitPrice * i.Quantity, i.ProductVariantId, label);
            })
            .ToList();

        return new CartDto(items, items.Sum(i => i.LineTotalInCents), items.Sum(i => i.Quantity));
    }
}
