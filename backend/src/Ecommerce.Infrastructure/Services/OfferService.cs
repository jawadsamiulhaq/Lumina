using Ecommerce.Application.Common;
using Ecommerce.Application.DTOs;
using Ecommerce.Application.Interfaces;
using Ecommerce.Domain.Entities;
using Ecommerce.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Infrastructure.Services;

public class OfferService : IOfferService
{
    private readonly AppDbContext _db;

    public OfferService(AppDbContext db) => _db = db;

    public async Task<IReadOnlyList<OfferDto>> GetActiveAsync(CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var offers = await _db.Offers
            .AsNoTracking()
            .Where(o => o.IsActive && o.StartsAt <= now && o.EndsAt > now)
            .OrderBy(o => o.SortOrder).ThenBy(o => o.EndsAt)
            .ToListAsync(ct);
        return offers.Select(o => new OfferDto(
            o.Id, o.Title, o.Subtitle, o.DiscountLabel, o.ImageUrl, o.CtaText, o.CtaUrl,
            AsUtc(o.StartsAt), AsUtc(o.EndsAt))).ToList();
    }

    public async Task<IReadOnlyList<AdminOfferDto>> GetAllAsync(CancellationToken ct = default)
    {
        var offers = await _db.Offers
            .AsNoTracking()
            .OrderBy(o => o.SortOrder).ThenByDescending(o => o.CreatedAt)
            .ToListAsync(ct);
        return offers.Select(ToAdminDto).ToList();
    }

    public async Task<AdminOfferDto> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var offer = await _db.Offers.AsNoTracking().FirstOrDefaultAsync(o => o.Id == id, ct)
            ?? throw new NotFoundException("Offer", id);
        return ToAdminDto(offer);
    }

    public async Task<AdminOfferDto> CreateAsync(CreateOfferRequest request, CancellationToken ct = default)
    {
        var offer = new Offer();
        Apply(offer, request);
        _db.Offers.Add(offer);
        await _db.SaveChangesAsync(ct);
        return ToAdminDto(offer);
    }

    public async Task<AdminOfferDto> UpdateAsync(int id, UpdateOfferRequest request, CancellationToken ct = default)
    {
        var offer = await _db.Offers.FirstOrDefaultAsync(o => o.Id == id, ct)
            ?? throw new NotFoundException("Offer", id);
        Apply(offer, request);
        await _db.SaveChangesAsync(ct);
        return ToAdminDto(offer);
    }

    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        var offer = await _db.Offers.FirstOrDefaultAsync(o => o.Id == id, ct)
            ?? throw new NotFoundException("Offer", id);
        _db.Offers.Remove(offer);
        await _db.SaveChangesAsync(ct);
    }

    private static void Apply(Offer offer, CreateOfferRequest r)
    {
        offer.Title = r.Title.Trim();
        offer.Subtitle = string.IsNullOrWhiteSpace(r.Subtitle) ? null : r.Subtitle.Trim();
        offer.DiscountLabel = string.IsNullOrWhiteSpace(r.DiscountLabel) ? null : r.DiscountLabel.Trim();
        offer.ImageUrl = string.IsNullOrWhiteSpace(r.ImageUrl) ? null : r.ImageUrl.Trim();
        offer.CtaText = string.IsNullOrWhiteSpace(r.CtaText) ? "Shop now" : r.CtaText.Trim();
        offer.CtaUrl = string.IsNullOrWhiteSpace(r.CtaUrl) ? "/products" : r.CtaUrl.Trim();
        offer.StartsAt = ToUtc(r.StartsAt);
        offer.EndsAt = ToUtc(r.EndsAt);
        offer.IsActive = r.IsActive;
        offer.SortOrder = r.SortOrder;
    }

    /// <summary>Normalises an incoming value to a UTC instant for storage.</summary>
    private static DateTime ToUtc(DateTime dt) => dt.Kind switch
    {
        DateTimeKind.Utc => dt,
        DateTimeKind.Local => dt.ToUniversalTime(),
        _ => DateTime.SpecifyKind(dt, DateTimeKind.Utc), // assume already UTC (client sends ISO 'Z')
    };

    /// <summary>Marks a value read from the DB as UTC so it serialises with a 'Z' suffix.</summary>
    private static DateTime AsUtc(DateTime dt) => DateTime.SpecifyKind(dt, DateTimeKind.Utc);

    private static AdminOfferDto ToAdminDto(Offer o) =>
        new(o.Id, o.Title, o.Subtitle, o.DiscountLabel, o.ImageUrl, o.CtaText, o.CtaUrl,
            AsUtc(o.StartsAt), AsUtc(o.EndsAt), o.IsActive, o.SortOrder, Status(o), AsUtc(o.CreatedAt));

    private static string Status(Offer o)
    {
        var now = DateTime.UtcNow;
        if (!o.IsActive) return "Disabled";
        if (o.StartsAt > now) return "Scheduled";
        if (o.EndsAt <= now) return "Expired";
        return "Active";
    }
}
