using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Text.Json;

class Program
{
    private static async Task Main(string[] args)
    {
        var tokenResponse = await GetTokenAsync();
        var accessToken = ExtractAccessToken(tokenResponse);
        Console.WriteLine($"Access Token: {accessToken}");

        var apiResponse = await CallApiAsync(accessToken);
        Console.WriteLine($"API Response: {apiResponse}");

        var apId = ExtractApId(apiResponse);
        Console.WriteLine($"ApID: {apId}");
    }

    private static async Task<string> GetTokenAsync()
    {
        var client = new HttpClient();
        var url = "https://login.microsoftonline.com/{your-tenant-id}/oauth2/v2.0/token";
        
        var values = new Dictionary<string, string>
        {
            { "scope", "https://{your-resource-url}/.default" },
            { "grant_type", "client_credentials" },
            { "client_id", "{your-client-id}" },
            { "client_secret", "{your-client-secret}" }
        };

        var content = new FormUrlEncodedContent(values);
        var response = await client.PostAsync(url, content);
        var responseString = await response.Content.ReadAsStringAsync();

        return responseString;
    }

    private static string ExtractAccessToken(string jsonResponse)
    {
        using (JsonDocument doc = JsonDocument.Parse(jsonResponse))
        {
            JsonElement root = doc.RootElement;
            string accessToken = root.GetProperty("access_token").GetString();
            return accessToken;
        }
    }

    private static async Task<string> CallApiAsync(string accessToken)
    {
        var client = new HttpClient();
        var apiUrl = "https://{your-api-url}/path/to/your/api/endpoint";
        
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        
        var response = await client.GetAsync(apiUrl);
        var responseString = await response.Content.ReadAsStringAsync();

        return responseString;
    }

    private static string ExtractApId(string jsonResponse)
    {
        using (JsonDocument doc = JsonDocument.Parse(jsonResponse))
        {
            JsonElement root = doc.RootElement;
            string apId = root.GetProperty("samlAttributes").GetProperty("ApID").GetString();
            return apId;
        }
    }
}