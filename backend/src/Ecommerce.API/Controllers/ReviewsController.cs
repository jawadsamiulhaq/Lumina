using Ecommerce.Application.DTOs;
using Ecommerce.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.API.Controllers;

[ApiController]
[Route("api/v1/products/{slug}/reviews")]
[Produces("application/json")]
public class ReviewsController : ControllerBase
{
    private readonly IReviewService _reviews;
    private readonly ICurrentUserService _currentUser;

    public ReviewsController(IReviewService reviews, ICurrentUserService currentUser)
    {
        _reviews = reviews;
        _currentUser = currentUser;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<ReviewDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<ReviewDto>>> List(string slug, CancellationToken ct)
        => Ok(await _reviews.GetForProductAsync(slug, ct));

    [Authorize]
    [HttpPost]
    [ProducesResponseType(typeof(ReviewDto), StatusCodes.Status201Created)]
    public async Task<ActionResult<ReviewDto>> Create(string slug, CreateReviewRequest request, CancellationToken ct)
    {
        var userId = _currentUser.RequireUserId();
        var review = await _reviews.CreateAsync(userId, slug, request, ct);
        return StatusCode(StatusCodes.Status201Created, review);
    }
}
