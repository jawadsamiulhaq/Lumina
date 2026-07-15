using Ecommerce.Application.DTOs;
using Ecommerce.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.API.Controllers;

[Authorize]
public class CartController : BaseApiController
{
    private readonly ICartService _cart;
    private readonly ICurrentUserService _currentUser;

    public CartController(ICartService cart, ICurrentUserService currentUser)
    {
        _cart = cart;
        _currentUser = currentUser;
    }

    [HttpGet]
    [ProducesResponseType(typeof(CartDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<CartDto>> Get(CancellationToken ct)
        => Ok(await _cart.GetAsync(_currentUser.RequireUserId(), ct));

    [HttpPost("items")]
    public async Task<ActionResult<CartDto>> Add(AddCartItemRequest request, CancellationToken ct)
        => Ok(await _cart.AddAsync(_currentUser.RequireUserId(), request, ct));

    [HttpPut("items/{cartItemId:int}")]
    public async Task<ActionResult<CartDto>> Update(int cartItemId, UpdateCartItemRequest request, CancellationToken ct)
        => Ok(await _cart.UpdateItemAsync(_currentUser.RequireUserId(), cartItemId, request, ct));

    [HttpDelete("items/{cartItemId:int}")]
    public async Task<ActionResult<CartDto>> Remove(int cartItemId, CancellationToken ct)
        => Ok(await _cart.RemoveItemAsync(_currentUser.RequireUserId(), cartItemId, ct));

    [HttpDelete]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Clear(CancellationToken ct)
    {
        await _cart.ClearAsync(_currentUser.RequireUserId(), ct);
        return NoContent();
    }
}
