using Ecommerce.API.Authorization;
using Ecommerce.Application.DTOs;
using Ecommerce.Application.Interfaces;
using Ecommerce.Domain.Constants;
using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.API.Controllers;

public class OffersController : BaseApiController
{
    private readonly IOfferService _offers;

    public OffersController(IOfferService offers) => _offers = offers;

    /// <summary>Public: offers currently live on the storefront.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<OfferDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<OfferDto>>> Active(CancellationToken ct)
        => Ok(await _offers.GetActiveAsync(ct));

    [HasPermission(Permissions.ManageOffers)]
    [HttpGet("admin")]
    [ProducesResponseType(typeof(IReadOnlyList<AdminOfferDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<AdminOfferDto>>> List(CancellationToken ct)
        => Ok(await _offers.GetAllAsync(ct));

    [HasPermission(Permissions.ManageOffers)]
    [HttpGet("admin/{id:int}")]
    public async Task<ActionResult<AdminOfferDto>> Get(int id, CancellationToken ct)
        => Ok(await _offers.GetByIdAsync(id, ct));

    [HasPermission(Permissions.ManageOffers)]
    [HttpPost]
    [ProducesResponseType(typeof(AdminOfferDto), StatusCodes.Status201Created)]
    public async Task<ActionResult<AdminOfferDto>> Create(CreateOfferRequest request, CancellationToken ct)
    {
        var created = await _offers.CreateAsync(request, ct);
        return CreatedAtAction(nameof(Get), new { id = created.Id }, created);
    }

    [HasPermission(Permissions.ManageOffers)]
    [HttpPut("{id:int}")]
    public async Task<ActionResult<AdminOfferDto>> Update(int id, UpdateOfferRequest request, CancellationToken ct)
        => Ok(await _offers.UpdateAsync(id, request, ct));

    [HasPermission(Permissions.ManageOffers)]
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        await _offers.DeleteAsync(id, ct);
        return NoContent();
    }
}
