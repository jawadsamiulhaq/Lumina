using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace Ecommerce.Application.Common;

public static partial class SlugGenerator
{
    /// <summary>Creates a URL-safe, lowercase, hyphenated slug from arbitrary text.</summary>
    public static string Generate(string input)
    {
        if (string.IsNullOrWhiteSpace(input)) return string.Empty;

        // Strip diacritics
        var normalized = input.Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder(capacity: normalized.Length);
        foreach (var c in normalized)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
                sb.Append(c);
        }

        var slug = sb.ToString().Normalize(NormalizationForm.FormC).ToLowerInvariant();
        slug = NonAlphanumeric().Replace(slug, "-");
        slug = MultiHyphen().Replace(slug, "-").Trim('-');
        return slug;
    }

    [GeneratedRegex("[^a-z0-9]+")]
    private static partial Regex NonAlphanumeric();

    [GeneratedRegex("-{2,}")]
    private static partial Regex MultiHyphen();
}
