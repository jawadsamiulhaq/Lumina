using Ecommerce.Application.DTOs;
using Ecommerce.Application.Interfaces;
using Ecommerce.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.API.Controllers;

[Authorize(Roles = Roles.Admin)]
[ApiController]
[Route("api/v1/admin/users")]
[Produces("application/json")]
public class AdminUsersController : ControllerBase
{
    private readonly IAdminUserService _users;

    public AdminUsersController(IAdminUserService users) => _users = users;

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<AdminUserDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<AdminUserDto>>> List(CancellationToken ct)
        => Ok(await _users.GetAllAsync(ct));

    public record SetAdminRequest(bool IsAdmin);

    [HttpPut("{id}/role")]
    public async Task<ActionResult<AdminUserDto>> SetRole(string id, SetAdminRequest request, CancellationToken ct)
        => Ok(await _users.SetAdminRoleAsync(id, request.IsAdmin, ct));
}
