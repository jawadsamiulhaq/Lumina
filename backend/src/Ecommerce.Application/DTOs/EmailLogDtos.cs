namespace Ecommerce.Application.DTOs;

public record EmailLogListItemDto(
    int Id,
    string ToEmail,
    string Subject,
    string Status,
    bool HasError,
    DateTime CreatedAt);

public record EmailLogDto(
    int Id,
    string ToEmail,
    string Subject,
    string Body,
    string Status,
    string? Error,
    DateTime CreatedAt);
