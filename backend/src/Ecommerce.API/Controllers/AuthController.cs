using Ecommerce.API.Extensions;
using Ecommerce.Application.DTOs;
using Ecommerce.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Ecommerce.API.Controllers;

[EnableRateLimiting("auth")]
public class AuthController : BaseApiController
{
    private readonly IAuthService _auth;
    private readonly ICurrentUserService _currentUser;

    public AuthController(IAuthService auth, ICurrentUserService currentUser)
    {
        _auth = auth;
        _currentUser = currentUser;
    }

    [HttpPost("register")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request, CancellationToken ct)
    {
        var result = await _auth.RegisterAsync(request, ct);
        return AuthOk(result);
    }

    [HttpPost("login")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request, CancellationToken ct)
    {
        var result = await _auth.LoginAsync(request, ct);
        return AuthOk(result);
    }

    [HttpPost("refresh")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<AuthResponse>> Refresh(CancellationToken ct)
    {
        var token = RefreshTokenCookie.Get(HttpContext) ?? string.Empty;
        var result = await _auth.RefreshAsync(token, ct);
        return AuthOk(result);
    }

    [HttpPost("logout")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Logout(CancellationToken ct)
    {
        var token = RefreshTokenCookie.Get(HttpContext);
        if (!string.IsNullOrEmpty(token))
            await _auth.RevokeAsync(token, ct);
        RefreshTokenCookie.Clear(HttpContext);
        return NoContent();
    }

    [Authorize]
    [HttpGet("me")]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<UserDto>> Me(CancellationToken ct)
    {
        var userId = _currentUser.RequireUserId();
        return Ok(await _auth.GetByIdAsync(userId, ct));
    }

    private ActionResult<AuthResponse> AuthOk(AuthResult result)
    {
        RefreshTokenCookie.Set(HttpContext, result.RefreshToken, result.RefreshTokenExpiresAt);
        return Ok(new AuthResponse(result.AccessToken, result.AccessTokenExpiresAt, result.User));
    }
}
