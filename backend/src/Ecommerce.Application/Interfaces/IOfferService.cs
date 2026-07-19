using Ecommerce.Application.DTOs;

namespace Ecommerce.Application.Interfaces;

public interface IOfferService
{
    /// <summary>Offers currently live on the storefront (active and within their time window).</summary>
    Task<IReadOnlyList<OfferDto>> GetActiveAsync(CancellationToken ct = default);

    Task<IReadOnlyList<AdminOfferDto>> GetAllAsync(CancellationToken ct = default);
    Task<AdminOfferDto> GetByIdAsync(int id, CancellationToken ct = default);
    Task<AdminOfferDto> CreateAsync(CreateOfferRequest request, CancellationToken ct = default);
    Task<AdminOfferDto> UpdateAsync(int id, UpdateOfferRequest request, CancellationToken ct = default);
    Task DeleteAsync(int id, CancellationToken ct = default);
}
