using Ecommerce.Application.Common;
using Ecommerce.Application.DTOs;
using Ecommerce.Application.Interfaces;
using Ecommerce.Domain.Entities;
using Ecommerce.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Infrastructure.Services;

public class ProductService : IProductService
{
    private readonly AppDbContext _db;

    public ProductService(AppDbContext db) => _db = db;

    public async Task<PagedResult<ProductListItemDto>> GetPagedAsync(ProductQuery query, CancellationToken ct = default)
    {
        var page = Math.Max(1, query.Page);
        var pageSize = Math.Clamp(query.PageSize, 1, 60);

        var q = _db.Products
            .AsNoTracking()
            .Include(p => p.Category)
            .Include(p => p.Images)
            .Include(p => p.Reviews)
            .Include(p => p.Variants)
            .AsQueryable();

        if (!query.IncludeInactive)
            q = q.Where(p => p.IsActive);

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var term = query.Search.Trim();
            q = q.Where(p => EF.Functions.Like(p.Name, $"%{term}%")
                          || EF.Functions.Like(p.Description, $"%{term}%"));
        }

        if (!string.IsNullOrWhiteSpace(query.CategorySlug))
            q = q.Where(p => p.Category!.Slug == query.CategorySlug);

        if (query.MinPriceCents is int min)
            q = q.Where(p => p.PriceInCents >= min);

        if (query.MaxPriceCents is int max)
            q = q.Where(p => p.PriceInCents <= max);

        if (query.FeaturedOnly == true)
            q = q.Where(p => p.IsFeatured);

        q = query.Sort switch
        {
            ProductSort.PriceAsc => q.OrderBy(p => p.PriceInCents).ThenByDescending(p => p.Id),
            ProductSort.PriceDesc => q.OrderByDescending(p => p.PriceInCents).ThenByDescending(p => p.Id),
            ProductSort.NameAsc => q.OrderBy(p => p.Name).ThenByDescending(p => p.Id),
            ProductSort.TopRated => q.OrderByDescending(p => p.Reviews.Any() ? p.Reviews.Average(r => r.Rating) : 0)
                                     .ThenByDescending(p => p.Id),
            _ => q.OrderByDescending(p => p.CreatedAt).ThenByDescending(p => p.Id)
        };

        var total = await q.CountAsync(ct);
        var entities = await q
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);
        var items = entities.Select(ToListItem).ToList();

        return new PagedResult<ProductListItemDto>(items, page, pageSize, total);
    }

    public async Task<ProductDetailDto> GetBySlugAsync(string slug, bool includeInactive, CancellationToken ct = default)
    {
        var product = await LoadWithGraph()
            .FirstOrDefaultAsync(p => p.Slug == slug && (includeInactive || p.IsActive), ct)
            ?? throw new NotFoundException("Product", slug);
        return ToDetail(product);
    }

    public async Task<ProductDetailDto> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var product = await LoadWithGraph().FirstOrDefaultAsync(p => p.Id == id, ct)
            ?? throw new NotFoundException("Product", id);
        return ToDetail(product);
    }

    public async Task<ProductDetailDto> CreateAsync(CreateProductRequest request, CancellationToken ct = default)
    {
        await EnsureCategoryExists(request.CategoryId, ct);

        var product = new Product
        {
            Name = request.Name.Trim(),
            Slug = await GenerateUniqueSlugAsync(request.Name, null, ct),
            Description = request.Description,
            PriceInCents = request.PriceInCents,
            Stock = request.Stock,
            IsActive = request.IsActive,
            IsFeatured = request.IsFeatured,
            CategoryId = request.CategoryId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        ApplyImages(product, request.Images);
        ApplyOptionsAndVariants(product, request.Options, request.Variants);

        _db.Products.Add(product);
        await _db.SaveChangesAsync(ct);
        return await GetByIdAsync(product.Id, ct);
    }

    public async Task<ProductDetailDto> UpdateAsync(int id, UpdateProductRequest request, CancellationToken ct = default)
    {
        var product = await _db.Products
            .Include(p => p.Images)
            .Include(p => p.Options).ThenInclude(o => o.Values)
            .Include(p => p.Variants).ThenInclude(v => v.Values).ThenInclude(vv => vv.OptionValue).ThenInclude(ov => ov!.Option)
            .FirstOrDefaultAsync(p => p.Id == id, ct)
            ?? throw new NotFoundException("Product", id);

        await EnsureCategoryExists(request.CategoryId, ct);

        if (!string.Equals(product.Name, request.Name.Trim(), StringComparison.Ordinal))
            product.Slug = await GenerateUniqueSlugAsync(request.Name, id, ct);

        product.Name = request.Name.Trim();
        product.Description = request.Description;
        product.PriceInCents = request.PriceInCents;
        product.Stock = request.Stock;
        product.IsActive = request.IsActive;
        product.IsFeatured = request.IsFeatured;
        product.CategoryId = request.CategoryId;
        product.UpdatedAt = DateTime.UtcNow;

        _db.ProductImages.RemoveRange(product.Images);
        product.Images.Clear();
        ApplyImages(product, request.Images);

        await ReconcileOptionsAndVariantsAsync(product, request.Options, request.Variants, ct);

        await _db.SaveChangesAsync(ct);
        return await GetByIdAsync(product.Id, ct);
    }

    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        var product = await _db.Products.FirstOrDefaultAsync(p => p.Id == id, ct)
            ?? throw new NotFoundException("Product", id);

        var hasOrders = await _db.OrderItems.AnyAsync(oi => oi.ProductId == id, ct);
        if (hasOrders)
        {
            // Soft-delete to preserve order history
            product.IsActive = false;
            product.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            _db.Products.Remove(product);
        }
        await _db.SaveChangesAsync(ct);
    }

    // ---- helpers ----

    private IQueryable<Product> LoadWithGraph() => _db.Products
        .AsNoTracking()
        .Include(p => p.Category)
        .Include(p => p.Images)
        .Include(p => p.Reviews)
        .Include(p => p.Options).ThenInclude(o => o.Values)
        .Include(p => p.Variants).ThenInclude(v => v.Values).ThenInclude(vv => vv.OptionValue).ThenInclude(ov => ov!.Option);

    private async Task EnsureCategoryExists(int categoryId, CancellationToken ct)
    {
        if (!await _db.Categories.AnyAsync(c => c.Id == categoryId, ct))
            throw new BadRequestException($"Category '{categoryId}' does not exist.");
    }

    private static void ApplyImages(Product product, List<ProductImageInput> images)
    {
        var ordered = images.OrderBy(i => i.SortOrder).ToList();
        var hasPrimary = ordered.Any(i => i.IsPrimary);
        for (var i = 0; i < ordered.Count; i++)
        {
            var input = ordered[i];
            product.Images.Add(new ProductImage
            {
                Url = input.Url,
                AltText = input.AltText,
                SortOrder = i,
                IsPrimary = input.IsPrimary || (!hasPrimary && i == 0)
            });
        }
    }

    /// <summary>Signature identifying a variant by its (option, value) pairs, case-insensitive and order-independent.</summary>
    private static string VariantSignature(IEnumerable<(string Option, string Value)> pairs) =>
        string.Join("|", pairs
            .Select(p => $"{p.Option.Trim().ToLowerInvariant()}={p.Value.Trim().ToLowerInvariant()}")
            .OrderBy(s => s, StringComparer.Ordinal));

    private static string ExistingVariantSignature(ProductVariant v) =>
        VariantSignature(v.Values
            .Where(x => x.OptionValue?.Option is not null)
            .Select(x => (x.OptionValue!.Option!.Name, x.OptionValue.Value)));

    /// <summary>Builds fresh option/value/variant graph on a new product.</summary>
    private static void ApplyOptionsAndVariants(Product product, List<ProductOptionInput> options, List<ProductVariantInput> variants)
    {
        var valueLookup = new Dictionary<(string, string), ProductOptionValue>();

        var optIndex = 0;
        foreach (var opt in options)
        {
            var name = opt.Name.Trim();
            if (name.Length == 0) continue;

            var option = new ProductOption { Name = name, SortOrder = optIndex++ };
            var valIndex = 0;
            foreach (var val in opt.Values.Select(v => v.Trim()).Where(v => v.Length > 0).Distinct(StringComparer.OrdinalIgnoreCase))
            {
                var ov = new ProductOptionValue { Value = val, SortOrder = valIndex++ };
                option.Values.Add(ov);
                valueLookup[(name.ToLowerInvariant(), val.ToLowerInvariant())] = ov;
            }
            product.Options.Add(option);
        }

        foreach (var vin in variants)
            product.Variants.Add(BuildVariant(vin, valueLookup));
    }

    private static ProductVariant BuildVariant(ProductVariantInput vin, IReadOnlyDictionary<(string, string), ProductOptionValue> valueLookup)
    {
        var variant = new ProductVariant
        {
            Sku = string.IsNullOrWhiteSpace(vin.Sku) ? null : vin.Sku.Trim(),
            PriceInCents = vin.PriceInCents,
            Stock = vin.Stock,
            IsActive = vin.IsActive,
        };
        foreach (var vv in vin.Values)
        {
            if (valueLookup.TryGetValue((vv.OptionName.Trim().ToLowerInvariant(), vv.Value.Trim().ToLowerInvariant()), out var ov))
                variant.Values.Add(new ProductVariantValue { OptionValue = ov });
        }
        return variant;
    }

    /// <summary>
    /// Reconciles a product's options/variants with the requested set. When no existing variant is
    /// referenced by a cart or order, it rebuilds cleanly. Otherwise it edits in place (update matched
    /// variants, add new ones, soft-deactivate removed ones) so referential integrity/history is preserved.
    /// </summary>
    private async Task ReconcileOptionsAndVariantsAsync(Product product, List<ProductOptionInput> optionInputs, List<ProductVariantInput> variantInputs, CancellationToken ct)
    {
        var existingIds = product.Variants.Select(v => v.Id).ToList();
        var locked = new HashSet<int>();
        if (existingIds.Count > 0)
        {
            locked.UnionWith(await _db.OrderItems
                .Where(oi => oi.ProductVariantId != null && existingIds.Contains(oi.ProductVariantId!.Value))
                .Select(oi => oi.ProductVariantId!.Value).ToListAsync(ct));
            locked.UnionWith(await _db.CartItems
                .Where(ci => ci.ProductVariantId != null && existingIds.Contains(ci.ProductVariantId!.Value))
                .Select(ci => ci.ProductVariantId!.Value).ToListAsync(ct));
        }

        // Clean path: nothing references existing variants → wipe and rebuild from the request.
        if (locked.Count == 0)
        {
            if (product.Variants.Count > 0) _db.ProductVariants.RemoveRange(product.Variants);
            if (product.Options.Count > 0) _db.ProductOptions.RemoveRange(product.Options);
            product.Variants.Clear();
            product.Options.Clear();
            ApplyOptionsAndVariants(product, optionInputs, variantInputs);
            return;
        }

        // Locked path: additive reconcile that never hard-deletes referenced rows.
        var valueLookup = new Dictionary<(string, string), ProductOptionValue>();
        var optIndex = 0;
        foreach (var opt in optionInputs)
        {
            var name = opt.Name.Trim();
            if (name.Length == 0) continue;

            var option = product.Options.FirstOrDefault(o => string.Equals(o.Name, name, StringComparison.OrdinalIgnoreCase))
                         ?? AddOption(product, name);
            option.SortOrder = optIndex++;

            var valIndex = 0;
            foreach (var val in opt.Values.Select(v => v.Trim()).Where(v => v.Length > 0).Distinct(StringComparer.OrdinalIgnoreCase))
            {
                var ov = option.Values.FirstOrDefault(v => string.Equals(v.Value, val, StringComparison.OrdinalIgnoreCase))
                         ?? AddOptionValue(option, val);
                ov.SortOrder = valIndex++;
                valueLookup[(name.ToLowerInvariant(), val.ToLowerInvariant())] = ov;
            }
        }

        var existingBySig = product.Variants
            .GroupBy(ExistingVariantSignature)
            .ToDictionary(g => g.Key, g => g.First());
        var desiredSigs = new HashSet<string>();

        foreach (var vin in variantInputs)
        {
            var pairs = vin.Values.Select(p => (p.OptionName, p.Value)).ToList();
            var sig = VariantSignature(pairs);
            desiredSigs.Add(sig);

            if (existingBySig.TryGetValue(sig, out var existing))
            {
                existing.Sku = string.IsNullOrWhiteSpace(vin.Sku) ? null : vin.Sku.Trim();
                existing.PriceInCents = vin.PriceInCents;
                existing.Stock = vin.Stock;
                existing.IsActive = vin.IsActive;
            }
            else
            {
                product.Variants.Add(BuildVariant(vin, valueLookup));
            }
        }

        // Variants dropped from the request: deactivate if referenced, else remove.
        foreach (var v in product.Variants.Where(v => v.Id != 0).ToList())
        {
            if (desiredSigs.Contains(ExistingVariantSignature(v))) continue;
            if (locked.Contains(v.Id)) v.IsActive = false;
            else _db.ProductVariants.Remove(v);
        }
    }

    private static ProductOption AddOption(Product product, string name)
    {
        var option = new ProductOption { Name = name };
        product.Options.Add(option);
        return option;
    }

    private static ProductOptionValue AddOptionValue(ProductOption option, string value)
    {
        var ov = new ProductOptionValue { Value = value };
        option.Values.Add(ov);
        return ov;
    }

    private async Task<string> GenerateUniqueSlugAsync(string name, int? excludeId, CancellationToken ct)
    {
        var baseSlug = SlugGenerator.Generate(name);
        if (string.IsNullOrEmpty(baseSlug)) baseSlug = "product";
        var slug = baseSlug;
        var suffix = 1;
        while (await _db.Products.AnyAsync(p => p.Slug == slug && (excludeId == null || p.Id != excludeId), ct))
            slug = $"{baseSlug}-{++suffix}";
        return slug;
    }

    private static ProductListItemDto ToListItem(Product p)
    {
        var activeVariants = p.Variants.Where(v => v.IsActive).ToList();
        var hasVariants = activeVariants.Count > 0;
        // For variant products, show the cheapest "from" price and total available stock.
        var price = hasVariants ? activeVariants.Min(v => v.PriceInCents ?? p.PriceInCents) : p.PriceInCents;
        var stock = hasVariants ? activeVariants.Sum(v => v.Stock) : p.Stock;

        return new(
            p.Id, p.Name, p.Slug, price, stock, p.IsActive, p.IsFeatured,
            p.Category!.Name, p.Category.Slug,
            p.Images.OrderByDescending(i => i.IsPrimary).ThenBy(i => i.SortOrder).Select(i => i.Url).FirstOrDefault(),
            p.Reviews.Count == 0 ? 0 : Math.Round(p.Reviews.Average(r => r.Rating), 2),
            p.Reviews.Count,
            hasVariants);
    }

    private static ProductDetailDto ToDetail(Product p)
    {
        var options = p.Options
            .OrderBy(o => o.SortOrder).ThenBy(o => o.Name)
            .Select(o => new ProductOptionDto(
                o.Id, o.Name,
                o.Values.OrderBy(v => v.SortOrder).ThenBy(v => v.Value)
                    .Select(v => new ProductOptionValueDto(v.Id, v.Value)).ToList()))
            .ToList();

        var variants = p.Variants
            .OrderBy(v => v.Id)
            .Select(v => new ProductVariantDto(
                v.Id, v.Sku, VariantHelpers.EffectivePrice(p, v), v.PriceInCents, v.Stock, v.IsActive,
                v.Values.Select(x => x.ProductOptionValueId).ToList(),
                VariantHelpers.BuildDescription(v)))
            .ToList();

        return new(
            p.Id, p.Name, p.Slug, p.Description, p.PriceInCents, p.Stock, p.IsActive, p.IsFeatured,
            p.CategoryId, p.Category!.Name, p.Category.Slug,
            p.Images.OrderByDescending(i => i.IsPrimary).ThenBy(i => i.SortOrder)
                .Select(i => new ProductImageDto(i.Id, i.Url, i.AltText, i.SortOrder, i.IsPrimary)).ToList(),
            p.Reviews.Count == 0 ? 0 : Math.Round(p.Reviews.Average(r => r.Rating), 2),
            p.Reviews.Count,
            p.CreatedAt,
            variants.Count > 0,
            options,
            variants);
    }
}
