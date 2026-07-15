namespace Ecommerce.Application.DTOs;

public record ReviewDto(
    int Id,
    int Rating,
    string Comment,
    string UserName,
    DateTime CreatedAt);

public record ReviewSummaryDto(double AverageRating, int ReviewCount);

public class CreateReviewRequest
{
    public int Rating { get; set; }
    public string Comment { get; set; } = string.Empty;
}
