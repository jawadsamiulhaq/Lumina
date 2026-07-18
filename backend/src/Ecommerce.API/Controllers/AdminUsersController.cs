using Ecommerce.API.Authorization;
using Ecommerce.Application.DTOs;
using Ecommerce.Application.Interfaces;
using Ecommerce.Domain.Constants;
using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.API.Controllers;

[HasPermission(Permissions.ManageUsers)]
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

    [HttpPost]
    [ProducesResponseType(typeof(AdminUserDto), StatusCodes.Status201Created)]
    public async Task<ActionResult<AdminUserDto>> Create(CreateUserRequest request, CancellationToken ct)
    {
        var created = await _users.CreateAsync(request, ct);
        return CreatedAtAction(nameof(List), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<AdminUserDto>> Update(string id, UpdateUserRequest request, CancellationToken ct)
        => Ok(await _users.UpdateAsync(id, request, ct));

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id, CancellationToken ct)
    {
        await _users.DeleteAsync(id, ct);
        return NoContent();
    }

    public record SetAdminRequest(bool IsAdmin);

    [HttpPut("{id}/role")]
    public async Task<ActionResult<AdminUserDto>> SetRole(string id, SetAdminRequest request, CancellationToken ct)
        => Ok(await _users.SetAdminRoleAsync(id, request.IsAdmin, ct));

    [HttpPut("{id}/roles")]
    public async Task<ActionResult<AdminUserDto>> SetRoles(string id, SetUserRolesRequest request, CancellationToken ct)
        => Ok(await _users.SetRolesAsync(id, request.Roles, ct));

    [HttpPost("{id}/lock")]
    public async Task<ActionResult<AdminUserDto>> Lock(string id, LockUserRequest request, CancellationToken ct)
        => Ok(await _users.LockAsync(id, request.Minutes, ct));

    [HttpPost("{id}/unlock")]
    public async Task<ActionResult<AdminUserDto>> Unlock(string id, CancellationToken ct)
        => Ok(await _users.UnlockAsync(id, ct));
}
