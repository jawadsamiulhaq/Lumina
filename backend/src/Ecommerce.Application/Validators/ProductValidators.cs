using Ecommerce.Application.DTOs;
using FluentValidation;

namespace Ecommerce.Application.Validators;

public class CreateProductRequestValidator : AbstractValidator<CreateProductRequest>
{
    public CreateProductRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Description).NotEmpty().MaximumLength(5000);
        RuleFor(x => x.PriceInCents).GreaterThan(0).WithMessage("Price must be greater than zero.");
        RuleFor(x => x.Stock).GreaterThanOrEqualTo(0);
        RuleFor(x => x.CategoryId).GreaterThan(0).WithMessage("A category is required.");
        RuleForEach(x => x.Images).ChildRules(img =>
        {
            img.RuleFor(i => i.Url).NotEmpty().MaximumLength(1000);
            img.RuleFor(i => i.SortOrder).GreaterThanOrEqualTo(0);
        });

        RuleForEach(x => x.Options).ChildRules(opt =>
        {
            opt.RuleFor(o => o.Name).NotEmpty().MaximumLength(100);
            opt.RuleFor(o => o.Values).NotEmpty().WithMessage("Each option needs at least one value.");
        });

        RuleForEach(x => x.Variants).ChildRules(v =>
        {
            v.RuleFor(x => x.Stock).GreaterThanOrEqualTo(0);
            v.RuleFor(x => x.PriceInCents).GreaterThan(0)
                .When(x => x.PriceInCents.HasValue)
                .WithMessage("Variant price must be greater than zero.");
            v.RuleFor(x => x.Values).NotEmpty().WithMessage("Each variant must specify its option values.");
        });
    }
}

public class UpdateProductRequestValidator : AbstractValidator<UpdateProductRequest>
{
    public UpdateProductRequestValidator()
    {
        Include(new CreateProductRequestValidator());
    }
}
