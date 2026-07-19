using Ecommerce.API.Authorization;
using Ecommerce.API.Extensions;
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
    private readonly IAuthService _auth;
    private readonly ICurrentUserService _currentUser;

    public AdminUsersController(IAdminUserService users, IAuthService auth, ICurrentUserService currentUser)
    {
        _users = users;
        _auth = auth;
        _currentUser = currentUser;
    }

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

    [HttpPost("{id}/reset-password")]
    [ProducesResponseType(typeof(AdminResetPasswordResultDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<AdminResetPasswordResultDto>> ResetPassword(string id, CancellationToken ct)
        => Ok(await _users.ResetPasswordAsync(id, ct));

    [HasPermission(Permissions.ImpersonateUsers)]
    [HttpPost("{id:int}/impersonate")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<AuthResponse>> Impersonate(int id, CancellationToken ct)
    {
        var result = await _auth.ImpersonateAsync(id, _currentUser.RequireUserId(), ct);
        RefreshTokenCookie.Set(HttpContext, result.RefreshToken, result.RefreshTokenExpiresAt);
        return Ok(new AuthResponse(result.AccessToken, result.AccessTokenExpiresAt, result.User, result.IsImpersonating, result.ImpersonatorName));
    }
}
