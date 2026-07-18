using System.Security.Cryptography;

namespace Ecommerce.Infrastructure.Identity;

/// <summary>Generates strong random passwords that satisfy the configured Identity password policy.</summary>
public static class TemporaryPassword
{
    private const string Upper = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // no I/O
    private const string Lower = "abcdefghijkmnpqrstuvwxyz"; // no l/o
    private const string Digits = "23456789";                // no 0/1
    private const string All = Upper + Lower + Digits;

    public static string Generate(int length = 12)
    {
        if (length < 8) length = 8;

        // Guarantee at least one of each required class, then fill the rest.
        var chars = new List<char>
        {
            Upper[RandomNumberGenerator.GetInt32(Upper.Length)],
            Lower[RandomNumberGenerator.GetInt32(Lower.Length)],
            Digits[RandomNumberGenerator.GetInt32(Digits.Length)],
        };
        while (chars.Count < length)
            chars.Add(All[RandomNumberGenerator.GetInt32(All.Length)]);

        // Fisher–Yates shuffle so the required chars aren't always in front.
        for (var i = chars.Count - 1; i > 0; i--)
        {
            var j = RandomNumberGenerator.GetInt32(i + 1);
            (chars[i], chars[j]) = (chars[j], chars[i]);
        }

        return new string(chars.ToArray());
    }
}
