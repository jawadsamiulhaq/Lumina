using Ecommerce.Application.Common;
using Ecommerce.Application.DTOs;
using Ecommerce.Application.Interfaces;
using Ecommerce.Domain.Entities;
using Ecommerce.Domain.Enums;
using Ecommerce.Infrastructure.Identity;
using Ecommerce.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Infrastructure.Services;

public class ReviewService : IReviewService
{
    private readonly AppDbContext _db;
    private readonly UserManager<ApplicationUser> _userManager;

    public ReviewService(AppDbContext db, UserManager<ApplicationUser> userManager)
    {
        _db = db;
        _userManager = userManager;
    }

    public async Task<IReadOnlyList<ReviewDto>> GetForProductAsync(string productSlug, CancellationToken ct = default)
    {
        var productId = await _db.Products
            .Where(p => p.Slug == productSlug)
            .Select(p => (int?)p.Id)
            .FirstOrDefaultAsync(ct)
            ?? throw new NotFoundException("Product", productSlug);

        return await _db.Reviews
            .AsNoTracking()
            .Where(r => r.ProductId == productId)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new ReviewDto(r.Id, r.Rating, r.Comment, r.UserName, r.CreatedAt))
            .ToListAsync(ct);
    }

    public async Task<ReviewDto> CreateAsync(int userId, string productSlug, CreateReviewRequest request, CancellationToken ct = default)
    {
        var product = await _db.Products.FirstOrDefaultAsync(p => p.Slug == productSlug, ct)
            ?? throw new NotFoundException("Product", productSlug);

        // Must have purchased (an order that reached Paid or beyond containing this product)
        var purchased = await _db.Orders
            .Where(o => o.UserId == userId && o.Status != OrderStatus.Pending && o.Status != OrderStatus.Cancelled)
            .SelectMany(o => o.Items)
            .AnyAsync(i => i.ProductId == product.Id, ct);

        if (!purchased)
            throw new ForbiddenException("You can only review products you have purchased.");

        if (await _db.Reviews.AnyAsync(r => r.ProductId == product.Id && r.UserId == userId, ct))
            throw new ConflictException("You have already reviewed this product.");

        var user = await _userManager.FindByIdAsync(userId.ToString());
        var displayName = user is null
            ? "Customer"
            : string.IsNullOrWhiteSpace(user.FirstName) ? (user.Email ?? "Customer") : $"{user.FirstName} {user.LastName}".Trim();

        var review = new Review
        {
            ProductId = product.Id,
            UserId = userId,
            UserName = displayName,
            Rating = request.Rating,
            Comment = request.Comment.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        _db.Reviews.Add(review);
        await _db.SaveChangesAsync(ct);
        return new ReviewDto(review.Id, review.Rating, review.Comment, review.UserName, review.CreatedAt);
    }
}
