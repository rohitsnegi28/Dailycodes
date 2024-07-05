If you need to call two APIs—one for session information and another to validate the session—within your custom session middleware, you'll want to structure your middleware to handle these calls asynchronously and manage their responses appropriately. Here’s how you can modify your middleware and write unit tests for it:

### Custom Session Middleware Structure

Let's assume your middleware needs to retrieve session information from one API endpoint and validate session validity from another. Here's how you could structure your middleware:

```csharp
public class CustomSessionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly HttpClient _httpClient;
    private readonly string _sessionInfoApiUrl = "https://api.example.com/sessioninfo";
    private readonly string _sessionValidateApiUrl = "https://api.example.com/sessionvalidate";

    public CustomSessionMiddleware(RequestDelegate next, HttpClient httpClient)
    {
        _next = next;
        _httpClient = httpClient;
    }

    public async Task Invoke(HttpContext context)
    {
        try
        {
            var sessionId = context.Session.GetString("SessionId");

            // Call API to fetch session information
            var sessionInfoResponse = await _httpClient.GetAsync($"{_sessionInfoApiUrl}/{sessionId}");
            sessionInfoResponse.EnsureSuccessStatusCode();
            var sessionInfoData = await sessionInfoResponse.Content.ReadAsStringAsync();

            // Call API to validate session
            var sessionValidateResponse = await _httpClient.GetAsync($"{_sessionValidateApiUrl}/{sessionId}");
            sessionValidateResponse.EnsureSuccessStatusCode();
            var sessionValidateData = await sessionValidateResponse.Content.ReadAsStringAsync();

            // Proceed to next middleware
            await _next(context);
        }
        catch (Exception ex)
        {
            // Handle exceptions
            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
            await context.Response.WriteAsync($"An error occurred: {ex.Message}");
        }
    }
}
```

### Unit Testing the Custom Session Middleware

To unit test this middleware, you'll mock `HttpContext` and `HttpClient`, and then verify that the middleware correctly handles the calls to the APIs. Here’s an example of how you might write unit tests using xUnit and Moq:

#### Unit Test Example

```csharp
using System;
using System.Net;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;

public class CustomSessionMiddlewareTests
{
    [Fact]
    public async Task CustomSessionMiddleware_CallsApisCorrectly()
    {
        // Arrange
        var mockNext = new Mock<RequestDelegate>();
        var mockHttpClient = new Mock<HttpClient>();

        var middleware = new CustomSessionMiddleware(mockNext.Object, mockHttpClient.Object);

        var mockHttpContext = new Mock<HttpContext>();
        mockHttpContext.SetupGet(c => c.Session).Returns(new MockHttpSession());

        var sessionId = "testSessionId";
        var sessionInfoApiUrl = $"https://api.example.com/sessioninfo/{sessionId}";
        var sessionValidateApiUrl = $"https://api.example.com/sessionvalidate/{sessionId}";

        // Example setup for HttpClient mock to return specific responses
        var sessionInfoResponse = new HttpResponseMessage
        {
            StatusCode = HttpStatusCode.OK,
            Content = new StringContent("{ \"userId\": 123 }"),
        };
        var sessionValidateResponse = new HttpResponseMessage
        {
            StatusCode = HttpStatusCode.OK,
            Content = new StringContent("{ \"valid\": true }"),
        };

        mockHttpClient.SetupSequence(c => c.GetAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
                     .ReturnsAsync(sessionInfoResponse)
                     .ReturnsAsync(sessionValidateResponse);

        // Act
        await middleware.Invoke(mockHttpContext.Object);

        // Assert
        mockHttpClient.Verify(c => c.GetAsync(sessionInfoApiUrl, It.IsAny<CancellationToken>()), Times.Once);
        mockHttpClient.Verify(c => c.GetAsync(sessionValidateApiUrl, It.IsAny<CancellationToken>()), Times.Once);
        mockNext.Verify(next => next(It.IsAny<HttpContext>()), Times.Once);
    }
}

public class MockHttpSession : ISession
{
    public Task LoadAsync(CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException();
    }

    // Implement other members of ISession as needed for your tests
}
```

### Explanation

- **CustomSessionMiddleware**: The middleware now makes two separate HTTP requests (`sessionInfoApiUrl` and `sessionValidateApiUrl`) to different endpoints, retrieves their responses, and handles them.
- **Unit Test**: The unit test sets up mock `HttpClient` to return specific responses for each API call (`sessionInfoResponse` and `sessionValidateResponse`). It verifies that each API is called exactly once and ensures the `Next` middleware is invoked.

### Notes

- **Error Handling**: Ensure your middleware handles errors and exceptions gracefully, as shown in the `try-catch` block within `Invoke`.
- **Mocking Dependencies**: Use `Moq` to mock `HttpContext` and `HttpClient` dependencies to simulate different scenarios and responses during testing.
- **Session Handling**: Implement `MockHttpSession` to mock `ISession` as needed for your tests, providing a controlled environment for session-related tests.

By following these steps, you can effectively write and test your custom session middleware to ensure it correctly interacts with multiple APIs and handles responses appropriately. Adjust the URLs and responses in the tests according to your actual API endpoints and expected behaviors.