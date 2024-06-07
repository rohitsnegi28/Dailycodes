using System.Net;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Moq;
using Moq.Protected;
using Xunit;

namespace MLC.Fsaat.BFF.SessionManagement.Tests
{
    public class ClamSessionValidationMiddlewareTests
    {
        private readonly Mock<HttpMessageHandler> _httpMessageHandlerMock;
        private readonly Mock<HttpContext> _httpContextMock;
        private readonly Mock<RequestDelegate> _nextMock;
        private readonly Mock<IFsaatApiConfigManager> _fsaatApiConfigManagerMock;
        private readonly HttpClient _httpClient;

        public ClamSessionValidationMiddlewareTests()
        {
            _httpMessageHandlerMock = new Mock<HttpMessageHandler>();
            _httpClient = new HttpClient(_httpMessageHandlerMock.Object);
            _httpContextMock = new Mock<HttpContext>();
            _nextMock = new Mock<RequestDelegate>();
            _fsaatApiConfigManagerMock = new Mock<IFsaatApiConfigManager>();
        }

        [Fact]
        public async Task InvokeAsync_AuthenticationNeeded_DoesNotInvokeNext()
        {
            // Arrange
            _fsaatApiConfigManagerMock
                .Setup(m => m.IsAuthenticationNeeded())
                .Returns(true);

            var middleware = new ClamSessionValidationMiddleware(_nextMock.Object);

            // Act
            await middleware.InvokeAsync(_httpContextMock.Object);

            // Assert
            _nextMock.Verify(n => n.Invoke(It.IsAny<HttpContext>()), Times.Never);
        }

        [Fact]
        public async Task InvokeAsync_AuthenticationNotNeeded_InvokesNext()
        {
            // Arrange
            _fsaatApiConfigManagerMock
                .Setup(m => m.IsAuthenticationNeeded())
                .Returns(false);

            _httpMessageHandlerMock
                .Protected()
                .Setup<Task<HttpResponseMessage>>(
                    "SendAsync",
                    ItExpr.IsAny<HttpRequestMessage>(),
                    ItExpr.IsAny<CancellationToken>()
                )
                .ReturnsAsync(new HttpResponseMessage
                {
                    StatusCode = HttpStatusCode.OK,
                    Content = new StringContent("{\"valid\": true}")
                });

            var middleware = new ClamSessionValidationMiddleware(_nextMock.Object);

            // Act
            await middleware.InvokeAsync(_httpContextMock.Object);

            // Assert
            _nextMock.Verify(n => n.Invoke(It.IsAny<HttpContext>()), Times.Once);
        }

        // Add more test cases as necessary to cover different scenarios
    }
}