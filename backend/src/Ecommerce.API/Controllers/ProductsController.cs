using Ecommerce.API.Authorization;
using Ecommerce.Application.Common;
using Ecommerce.Application.DTOs;
using Ecommerce.Application.Interfaces;
using Ecommerce.Domain.Constants;
using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.API.Controllers;

public class ProductsController : BaseApiController
{
    private readonly IProductService _products;

    public ProductsController(IProductService products) => _products = products;

    /// <summary>Paged, filterable, sortable product list (public — active products only).</summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<ProductListItemDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<ProductListItemDto>>> List([FromQuery] ProductQuery query, CancellationToken ct)
    {
        query.IncludeInactive = false; // never expose inactive products on the public endpoint
        return Ok(await _products.GetPagedAsync(query, ct));
    }

    [HttpGet("{slug}")]
    [ProducesResponseType(typeof(ProductDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProductDetailDto>> GetBySlug(string slug, CancellationToken ct)
        => Ok(await _products.GetBySlugAsync(slug, includeInactive: false, ct));

    // ---- Admin ----

    [HasPermission(Permissions.ManageProducts)]
    [HttpGet("admin")]
    public async Task<ActionResult<PagedResult<ProductListItemDto>>> AdminList([FromQuery] ProductQuery query, CancellationToken ct)
    {
        query.IncludeInactive = true;
        return Ok(await _products.GetPagedAsync(query, ct));
    }

    [HasPermission(Permissions.ManageProducts)]
    [HttpGet("admin/{id:int}")]
    public async Task<ActionResult<ProductDetailDto>> AdminGet(int id, CancellationToken ct)
        => Ok(await _products.GetByIdAsync(id, ct));

    [HasPermission(Permissions.ManageProducts)]
    [HttpPost]
    [ProducesResponseType(typeof(ProductDetailDto), StatusCodes.Status201Created)]
    public async Task<ActionResult<ProductDetailDto>> Create(CreateProductRequest request, CancellationToken ct)
    {
        var created = await _products.CreateAsync(request, ct);
        return CreatedAtAction(nameof(GetBySlug), new { slug = created.Slug }, created);
    }

    [HasPermission(Permissions.ManageProducts)]
    [HttpPut("{id:int}")]
    public async Task<ActionResult<ProductDetailDto>> Update(int id, UpdateProductRequest request, CancellationToken ct)
        => Ok(await _products.UpdateAsync(id, request, ct));

    [HasPermission(Permissions.ManageProducts)]
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        await _products.DeleteAsync(id, ct);
        return NoContent();
    }
}
