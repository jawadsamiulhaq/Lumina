using Ecommerce.Application.DTOs;
using FluentValidation;

namespace Ecommerce.Application.Validators;

public class CreateOfferRequestValidator : AbstractValidator<CreateOfferRequest>
{
    public CreateOfferRequestValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(160);
        RuleFor(x => x.Subtitle).MaximumLength(300);
        RuleFor(x => x.DiscountLabel).MaximumLength(40);
        RuleFor(x => x.CtaText).NotEmpty().MaximumLength(60);
        RuleFor(x => x.CtaUrl).NotEmpty().MaximumLength(500);
        RuleFor(x => x.SortOrder).GreaterThanOrEqualTo(0);
        RuleFor(x => x.EndsAt).GreaterThan(x => x.StartsAt).WithMessage("End time must be after the start time.");
    }
}

public class UpdateOfferRequestValidator : AbstractValidator<UpdateOfferRequest>
{
    public UpdateOfferRequestValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(160);
        RuleFor(x => x.Subtitle).MaximumLength(300);
        RuleFor(x => x.DiscountLabel).MaximumLength(40);
        RuleFor(x => x.CtaText).NotEmpty().MaximumLength(60);
        RuleFor(x => x.CtaUrl).NotEmpty().MaximumLength(500);
        RuleFor(x => x.SortOrder).GreaterThanOrEqualTo(0);
        RuleFor(x => x.EndsAt).GreaterThan(x => x.StartsAt).WithMessage("End time must be after the start time.");
    }
}
