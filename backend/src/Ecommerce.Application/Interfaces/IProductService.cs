using Ecommerce.Application.Common;
using Ecommerce.Application.DTOs;

namespace Ecommerce.Application.Interfaces;

public interface IProductService
{
    Task<PagedResult<ProductListItemDto>> GetPagedAsync(ProductQuery query, CancellationToken ct = default);
    Task<ProductDetailDto> GetBySlugAsync(string slug, bool includeInactive, CancellationToken ct = default);
    Task<ProductDetailDto> GetByIdAsync(int id, CancellationToken ct = default);
    Task<ProductDetailDto> CreateAsync(CreateProductRequest request, CancellationToken ct = default);
    Task<ProductDetailDto> UpdateAsync(int id, UpdateProductRequest request, CancellationToken ct = default);

    /// <summary>Hard-deletes when the product has no orders, otherwise soft-deletes (IsActive=false).</summary>
    Task DeleteAsync(int id, CancellationToken ct = default);
}
