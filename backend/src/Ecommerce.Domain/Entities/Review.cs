namespace Ecommerce.Domain.Entities;

public class Review
{
    public int Id { get; set; }

    public int ProductId { get; set; }
    public Product? Product { get; set; }

    public int UserId { get; set; }

    /// <summary>Display name snapshot so reviews render without an extra Identity lookup.</summary>
    public string UserName { get; set; } = string.Empty;

    public int Rating { get; set; } // 1-5
    public string Comment { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
