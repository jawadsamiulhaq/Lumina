using Ecommerce.Application.Common;
using Ecommerce.Application.DTOs;
using Ecommerce.Application.Interfaces;
using Ecommerce.Domain.Entities;
using Ecommerce.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Infrastructure.Services;

public class CategoryService : ICategoryService
{
    private readonly AppDbContext _db;

    public CategoryService(AppDbContext db) => _db = db;

    public async Task<IReadOnlyList<CategoryDto>> GetAllAsync(CancellationToken ct = default)
    {
        return await _db.Categories
            .AsNoTracking()
            .OrderBy(c => c.Name)
            .Select(c => new CategoryDto(c.Id, c.Name, c.Slug, c.Products.Count(p => p.IsActive)))
            .ToListAsync(ct);
    }

    public async Task<CategoryDto> CreateAsync(CreateCategoryRequest request, CancellationToken ct = default)
    {
        var slug = await GenerateUniqueSlugAsync(request.Name, null, ct);
        var category = new Category { Name = request.Name.Trim(), Slug = slug };
        _db.Categories.Add(category);
        await _db.SaveChangesAsync(ct);
        return new CategoryDto(category.Id, category.Name, category.Slug, 0);
    }

    public async Task<CategoryDto> UpdateAsync(int id, UpdateCategoryRequest request, CancellationToken ct = default)
    {
        var category = await _db.Categories.FirstOrDefaultAsync(c => c.Id == id, ct)
            ?? throw new NotFoundException("Category", id);

        if (!string.Equals(category.Name, request.Name.Trim(), StringComparison.Ordinal))
        {
            category.Name = request.Name.Trim();
            category.Slug = await GenerateUniqueSlugAsync(request.Name, id, ct);
        }

        await _db.SaveChangesAsync(ct);
        var count = await _db.Products.CountAsync(p => p.CategoryId == id && p.IsActive, ct);
        return new CategoryDto(category.Id, category.Name, category.Slug, count);
    }

    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        var category = await _db.Categories.FirstOrDefaultAsync(c => c.Id == id, ct)
            ?? throw new NotFoundException("Category", id);

        if (await _db.Products.AnyAsync(p => p.CategoryId == id, ct))
            throw new ConflictException("Cannot delete a category that still has products. Reassign or remove them first.");

        _db.Categories.Remove(category);
        await _db.SaveChangesAsync(ct);
    }

    private async Task<string> GenerateUniqueSlugAsync(string name, int? excludeId, CancellationToken ct)
    {
        var baseSlug = SlugGenerator.Generate(name);
        if (string.IsNullOrEmpty(baseSlug)) baseSlug = "category";
        var slug = baseSlug;
        var suffix = 1;
        while (await _db.Categories.AnyAsync(c => c.Slug == slug && (excludeId == null || c.Id != excludeId), ct))
            slug = $"{baseSlug}-{++suffix}";
        return slug;
    }
}
