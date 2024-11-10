using Microsoft.IdentityModel.Tokens;
using System.Security.Cryptography;

public class TokenService
{
    public static SecurityKey GenerateDummyIssuerSigningKey()
    {
        // Generate a symmetric security key (for example purposes)
        byte[] keyBytes = new byte[32]; // 256 bits
        using (var rng = RandomNumberGenerator.Create())
        {
            rng.GetBytes(keyBytes);
        }

        return new SymmetricSecurityKey(keyBytes);
    }
}

// Usage:
TokenValidationParameters validationParameters = new TokenValidationParameters
{
    // Other parameters...
    IssuerSigningKey = TokenService.GenerateDummyIssuerSigningKey(),
    // Other parameters...
};