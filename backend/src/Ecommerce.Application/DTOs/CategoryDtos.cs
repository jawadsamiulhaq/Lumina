namespace Ecommerce.Application.DTOs;

public record CategoryDto(int Id, string Name, string Slug, int ProductCount);

public class CreateCategoryRequest
{
    public string Name { get; set; } = string.Empty;
}

public class UpdateCategoryRequest
{
    public string Name { get; set; } = string.Empty;
}
