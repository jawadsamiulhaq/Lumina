namespace Ecommerce.Domain.Entities;

public class Cart
{
    public int Id { get; set; }

    /// <summary>One cart per Identity user.</summary>
    public int UserId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<CartItem> Items { get; set; } = new List<CartItem>();
}
