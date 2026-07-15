using Ecommerce.Application.DTOs;

namespace Ecommerce.Application.Interfaces;

public interface IReviewService
{
    Task<IReadOnlyList<ReviewDto>> GetForProductAsync(string productSlug, CancellationToken ct = default);
    Task<ReviewDto> CreateAsync(int userId, string productSlug, CreateReviewRequest request, CancellationToken ct = default);
}
