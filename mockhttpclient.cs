using System;
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

    // Implement other members of ISession as needed for your tests
}