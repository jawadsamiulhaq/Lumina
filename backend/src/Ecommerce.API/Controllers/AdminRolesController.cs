using Ecommerce.API.Authorization;
using Ecommerce.Application.DTOs;
using Ecommerce.Application.Interfaces;
using Ecommerce.Domain.Constants;
using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.API.Controllers;

[HasPermission(Permissions.ManageUsers)]
[ApiController]
[Route("api/v1/admin")]
[Produces("application/json")]
public class AdminRolesController : ControllerBase
{
    private readonly IRoleService _roles;

    public AdminRolesController(IRoleService roles) => _roles = roles;

    [HttpGet("roles")]
    [ProducesResponseType(typeof(IReadOnlyList<RoleDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<RoleDto>>> List(CancellationToken ct)
        => Ok(await _roles.GetAllAsync(ct));

    [HttpGet("permissions")]
    [ProducesResponseType(typeof(IReadOnlyList<PermissionDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<PermissionDto>>> ListPermissions(CancellationToken ct)
        => Ok(await _roles.GetPermissionsAsync(ct));

    [HttpPost("roles")]
    [ProducesResponseType(typeof(RoleDto), StatusCodes.Status201Created)]
    public async Task<ActionResult<RoleDto>> Create(CreateRoleRequest request, CancellationToken ct)
    {
        var created = await _roles.CreateAsync(request, ct);
        return CreatedAtAction(nameof(List), new { id = created.Id }, created);
    }

    [HttpPut("roles/{id}")]
    public async Task<ActionResult<RoleDto>> Update(string id, UpdateRoleRequest request, CancellationToken ct)
        => Ok(await _roles.UpdateAsync(id, request, ct));

    [HttpDelete("roles/{id}")]
    public async Task<IActionResult> Delete(string id, CancellationToken ct)
    {
        await _roles.DeleteAsync(id, ct);
        return NoContent();
    }

    [HttpPut("roles/{id}/permissions")]
    public async Task<ActionResult<RoleDto>> SetPermissions(string id, SetRolePermissionsRequest request, CancellationToken ct)
        => Ok(await _roles.SetPermissionsAsync(id, request.Permissions, ct));
}
