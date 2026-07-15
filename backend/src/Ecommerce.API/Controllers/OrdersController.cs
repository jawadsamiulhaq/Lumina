using Ecommerce.Application.Common;
using Ecommerce.Application.DTOs;
using Ecommerce.Application.Interfaces;
using Ecommerce.Domain.Constants;
using Ecommerce.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.API.Controllers;

[Authorize]
public class OrdersController : BaseApiController
{
    private readonly IOrderService _orders;
    private readonly ICurrentUserService _currentUser;

    public OrdersController(IOrderService orders, ICurrentUserService currentUser)
    {
        _orders = orders;
        _currentUser = currentUser;
    }

    /// <summary>Creates a Stripe Checkout session from the current user's cart.</summary>
    [HttpPost("checkout")]
    [ProducesResponseType(typeof(CheckoutSessionDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<CheckoutSessionDto>> Checkout(CreateCheckoutRequest request, CancellationToken ct)
        => Ok(await _orders.CreateCheckoutSessionAsync(_currentUser.RequireUserId(), request, ct));

    [HttpGet]
    public async Task<ActionResult<PagedResult<OrderListItemDto>>> MyOrders(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 10, CancellationToken ct = default)
        => Ok(await _orders.GetForUserAsync(_currentUser.RequireUserId(), page, pageSize, ct));

    [HttpGet("{id:int}")]
    public async Task<ActionResult<OrderDto>> MyOrder(int id, CancellationToken ct)
        => Ok(await _orders.GetByIdForUserAsync(id, _currentUser.RequireUserId(), ct));

    // ---- Admin ----

    [Authorize(Roles = Roles.Admin)]
    [HttpGet("admin")]
    public async Task<ActionResult<PagedResult<OrderListItemDto>>> AdminList(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] OrderStatus? status = null, CancellationToken ct = default)
        => Ok(await _orders.GetAllAsync(page, pageSize, status, ct));

    [Authorize(Roles = Roles.Admin)]
    [HttpGet("admin/{id:int}")]
    public async Task<ActionResult<OrderDto>> AdminGet(int id, CancellationToken ct)
        => Ok(await _orders.GetByIdAsync(id, ct));

    [Authorize(Roles = Roles.Admin)]
    [HttpPut("admin/{id:int}/status")]
    public async Task<ActionResult<OrderDto>> UpdateStatus(int id, UpdateOrderStatusRequest request, CancellationToken ct)
        => Ok(await _orders.UpdateStatusAsync(id, request.Status, ct));
}
