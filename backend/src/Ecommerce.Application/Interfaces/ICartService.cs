using Ecommerce.Application.DTOs;

namespace Ecommerce.Application.Interfaces;

public interface ICartService
{
    Task<CartDto> GetAsync(int userId, CancellationToken ct = default);
    Task<CartDto> AddAsync(int userId, AddCartItemRequest request, CancellationToken ct = default);
    Task<CartDto> UpdateItemAsync(int userId, int cartItemId, UpdateCartItemRequest request, CancellationToken ct = default);
    Task<CartDto> RemoveItemAsync(int userId, int cartItemId, CancellationToken ct = default);
    Task ClearAsync(int userId, CancellationToken ct = default);
}
