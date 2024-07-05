using System;
using System.Net;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using Moq;
using Moq.Protected;
using Xunit;

public class HttpClientTests
{
    [Fact]
    public async Task TestHttpClient()
    {
        // Arrange
        var mockHttpMessageHandler = new Mock<HttpMessageHandler>();

        mockHttpMessageHandler
            .Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.Is<HttpRequestMessage>(req =>
                    req.Method == HttpMethod.Post &&
                    req.RequestUri == new Uri("https://mytesturl")),
                ItExpr.IsAny<CancellationToken>()
            )
            .ReturnsAsync(new HttpResponseMessage
            {
                StatusCode = HttpStatusCode.OK,
                Content = new StringContent("{ \"username\": \"<user ciam id>\", \"realm\": \"<realm>\", \"latestAccessTime\": \"2020-08-10T22:36:54Z\", \"maxIdleExpirationTime\": \"2020-08-10T23:06:54Z\", \"maxSessionExpirationTime\": \"2020-08-11T00:34:13Z\", \"properties\": {} }")
            });

        var httpClient = new HttpClient(mockHttpMessageHandler.Object);

        // Act
        var response = await httpClient.PostAsync(
            "https://mytesturl",
            new StringContent("{}", System.Text.Encoding.UTF8, "application/json")
        );

        var responseString = await response.Content.ReadAsStringAsync();

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Contains("\"username\": \"<user ciam id>\"", responseString);
    }
}