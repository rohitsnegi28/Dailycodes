.using System;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Moq;
using Newtonsoft.Json;
using Xunit;

public class CustomSessionMiddlewareTests
{
    [Fact]
    public async Task CustomSessionMiddleware_CallsPostApisAndSetsExpirationTime()
    {
        // Arrange
        var mockNext = new Mock<RequestDelegate>();
        var mockHttpClient = new Mock<HttpClient>();

        var middleware = new CustomSessionMiddleware(mockNext.Object, mockHttpClient.Object);

        var mockHttpContext = new Mock<HttpContext>();
        mockHttpContext.SetupGet(c => c.Session).Returns(new MockHttpSession());

        var sessionId = "testSessionId";
        var sessionInfoApiUrl = $"https://api.example.com/sessioninfo";
        var sessionValidateApiUrl = $"https://api.example.com/sessionvalidate";

        // Example setup for session info response with dynamic maxIdleExpirationTime
        var sessionInfoResponse = new HttpResponseMessage
        {
            StatusCode = HttpStatusCode.OK,
            Content = new StringContent(GetSessionInfoResponse(DateTime.UtcNow.AddMinutes(30))),
        };
        var sessionValidateResponse = new HttpResponseMessage
        {
            StatusCode = HttpStatusCode.OK,
            Content = new StringContent("{ \"valid\": true }"),
        };

        mockHttpClient.SetupSequence(c => c.SendAsync(It.IsAny<HttpRequestMessage>(), It.IsAny<CancellationToken>()))
                     .ReturnsAsync(sessionInfoResponse)
                     .ReturnsAsync(sessionValidateResponse);

        // Act
        await middleware.Invoke(mockHttpContext.Object);

        // Assert
        mockHttpClient.Verify(c => c.SendAsync(It.Is<HttpRequestMessage>(req => req.RequestUri.ToString() == sessionInfoApiUrl && req.Method == HttpMethod.Post), It.IsAny<CancellationToken>()), Times.Once);
        mockHttpClient.Verify(c => c.SendAsync(It.Is<HttpRequestMessage>(req => req.RequestUri.ToString() == sessionValidateApiUrl && req.Method == HttpMethod.Post), It.IsAny<CancellationToken>()), Times.Once);
        mockNext.Verify(next => next(It.IsAny<HttpContext>()), Times.Once);

        // Verify session expiration time is set correctly
        var expirationTime = mockHttpContext.Object.Session.GetString("MaxIdleExpirationTime");
        Assert.NotNull(expirationTime);

        var expectedExpirationTime = DateTime.UtcNow.AddMinutes(30).ToString("o");
        Assert.Equal(expectedExpirationTime, expirationTime);
    }

    // Helper method to create session info JSON response dynamically
    private string GetSessionInfoResponse(DateTime maxIdleExpirationTime)
    {
        var sessionInfo = new
        {
            maxIdleExpirationTime = maxIdleExpirationTime.ToString("o")
        };
        return JsonConvert.SerializeObject(sessionInfo);
    }
}

public class MockHttpSession : ISession
{
    private readonly Dictionary<string, byte[]> _sessionData = new Dictionary<string, byte[]>();

    public Task LoadAsync(CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException();
    }

    public Task CommitAsync(CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException();
    }

    public Task ClearAsync(CancellationToken cancellationToken = default)
    {
        _sessionData.Clear();
        return Task.CompletedTask;
    }

    public void SetString(string key, string value)
    {
        _sessionData[key] = Encoding.UTF8.GetBytes(value);
    }

    public string GetString(string key)
    {
        if (_sessionData.TryGetValue(key, out var value))
        {
            return Encoding.UTF8.GetString(value);
        }
        return null;
    }

    // Implement other members of ISession as needed for your Based on the provided code, it looks like your `HttpRequestMessage` setup for the `HttpClient` includes headers and other configurations needed for authentication. To address the `401 Unauthorized` issue in your unit tests, ensure the mock `HttpClient` properly simulates the API behavior, including successful responses for authentication.

Here's an example to properly mock the `HttpClient` for your test setup:

### Unit Test Setup with Mocked HttpClient

```csharp
using System;
using System.Net;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Moq;
using Moq.Protected;
using Newtonsoft.Json;
using Xunit;

public class CustomSessionMiddlewareTests
{
    [Fact]
    public async Task CustomSessionMiddleware_CallsPostApisAndSetsExpirationTime()
    {
        // Arrange
        var mockNext = new Mock<RequestDelegate>();
        var mockHttpMessageHandler = new Mock<HttpMessageHandler>();
        var client = new HttpClient(mockHttpMessageHandler.Object);
        var middleware = new CustomSessionMiddleware(mockNext.Object, client);

        var mockHttpContext = new Mock<HttpContext>();
        mockHttpContext.SetupGet(c => c.Session).Returns(new MockHttpSession());

        var sessionId = "testSessionId";
        var sessionInfoApiUrl = "https://api.example.com/sessioninfo";
        var sessionValidateApiUrl = "https://api.example.com/sessionvalidate";

        // Example setup for session info response with dynamic maxIdleExpirationTime
        var sessionInfoResponse = new HttpResponseMessage
        {
            StatusCode = HttpStatusCode.OK,
            Content = new StringContent(GetSessionInfoResponse(DateTime.UtcNow.AddMinutes(30))),
        };
        var sessionValidateResponse = new HttpResponseMessage
        {
            StatusCode = HttpStatusCode.OK,
            Content = new StringContent("{ \"valid\": true }"),
        };

        // Mocking the HttpClient SendAsync method
        mockHttpMessageHandler.Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.Is<HttpRequestMessage>(req =>
                    req.Method == HttpMethod.Post && req.RequestUri == new Uri(sessionInfoApiUrl)),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(sessionInfoResponse);

        mockHttpMessageHandler.Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.Is<HttpRequestMessage>(req =>
                    req.Method == HttpMethod.Post && req.RequestUri == new Uri(sessionValidateApiUrl)),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(sessionValidateResponse);

        // Act
        await middleware.Invoke(mockHttpContext.Object);

        // Assert
        mockHttpMessageHandler.Protected().Verify(
            "SendAsync",
            Times.Once(),
            ItExpr.Is<HttpRequestMessage>(req => req.Method == HttpMethod.Post && req.RequestUri == new Uri(sessionInfoApiUrl)),
            ItExpr.IsAny<CancellationToken>());

        mockHttpMessageHandler.Protected().Verify(
            "SendAsync",
            Times.Once(),
            ItExpr.Is<HttpRequestMessage>(req => req.Method == HttpMethod.Post && req.RequestUri == new Uri(sessionValidateApiUrl)),
            ItExpr.IsAny<CancellationToken>());

        mockNext.Verify(next => next(It.IsAny<HttpContext>()), Times.Once);

        // Verify session expiration time is set correctly
        var expirationTime = mockHttpContext.Object.Session.GetString("MaxIdleExpirationTime");
        Assert.NotNull(expirationTime);

        var expectedExpirationTime = DateTime.UtcNow.AddMinutes(30).ToString("o");
        Assert.Equal(expectedExpirationTime, expirationTime);
    }

    // Helper method to create session info JSON response dynamically
    private string GetSessionInfoResponse(DateTime maxIdleExpirationTime)
    {
        var sessionInfo = new
        {
            maxIdleExpirationTime = maxIdleExpirationTime.ToString("o")
        };
        return JsonConvert.SerializeObject(sessionInfo);
    }
}

public class MockHttpSession : ISession
{
    private readonly Dictionary<string, byte[]> _sessionData = new Dictionary<string, byte[]>();

    public Task LoadAsync(CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException();
    }

    public Task CommitAsync(CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException();
    }

    public Task ClearAsync(CancellationToken cancellationToken = default)
    {
        _sessionData.Clear();
        return Task.CompletedTask;
    }

    public void SetString(string key, string value)
    {
        _sessionData[key] = Encoding.UTF8.GetBytes(value);
    }

    public string GetString(string key)
    {
        if (_sessionData.TryGetValue(key, out var value))
        {
            return Encoding.UTF8.GetString(value);
        }
        return null;
    }

    // Implement other members of ISession as needed for your tests
}
```

### Explanation

- **Mocking HttpClient**: Instead of directly mocking `HttpClient`, we're mocking the `HttpMessageHandler` which `HttpClient` uses to send requests. This allows us to simulate specific HTTP responses for `POST` requests to the session info and session validation endpoints.
- **Protected SendAsync**: The `Protected().Setup<Task<HttpResponseMessage>>("SendAsync", ...)` method mocks the `SendAsync` method of `HttpMessageHandler` to return the predefined `HttpResponseMessage` objects.
- **Verification**: The unit test verifies that the middleware correctly sends `POST` requests to the session information and session validation APIs, and it asserts that the `MaxIdleExpirationTime` is set in the session correctly based on the dynamic response.

### Notes

- **Authentication Headers**: Ensure that any necessary authentication headers or tokens are included in the `HttpRequestMessage` setup within the middleware if required by your API.
- **Session Handling**: `MockHttpSession` simulates session behavior, allowing you to set and retrieve session data within the test.

By following this approach, you can effectively mock and test your custom session middleware that interacts with `POST` APIs, ensuring it handles different scenarios and data structures as expected. Adjust the middleware and tests further based on your specific API responses and application requirements.


