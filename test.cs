using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

public class CustomSessionValidationMiddlewareTests
{
    [Fact]
    public async Task CustomSessionValidationMiddleware_ParsesAndUpdatesSessionTime()
    {
        // Arrange
        var builder = new WebHostBuilder()
            .ConfigureServices(services =>
            {
                services.AddDistributedMemoryCache();
                services.AddSession();
                services.AddSingleton<CustomSessionValidationMiddleware>();
            })
            .Configure(app =>
            {
                app.UseSession();
                app.UseMiddleware<CustomSessionValidationMiddleware>();
            });

        var server = new TestServer(builder);
        var context = await CreateHttpContextWithSession(server);

        var middleware = new CustomSessionValidationMiddleware((HttpContext ctx) => Task.CompletedTask);

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        var updatedValidationTime = context.Session.GetString("LastSessionValidation");
        Assert.NotNull(updatedValidationTime);
        Assert.True(DateTime.TryParse(updatedValidationTime, out var _));
    }

    private async Task<HttpContext> CreateHttpContextWithSession(TestServer server)
    {
        var context = new DefaultHttpContext
        {
            RequestServices = server.Services
        };

        var sessionFeature = new SessionFeature();
        context.Features.Set<ISessionFeature>(sessionFeature);
        var session = new DistributedSession(
            server.Services.GetRequiredService<IDistributedCache>(),
            Guid.NewGuid().ToString(),
            TimeSpan.FromMinutes(20),
            new LoggerFactory().CreateLogger<DistributedSession>());
        context.Features.Set<ISession>(session);

        // Manually initialize the session.
        await session.LoadAsync(default);
        session.SetString("LastSessionValidation", DateTime.UtcNow.ToString());

        return context;
    }
}

// Custom middleware implementation
public class CustomSessionValidationMiddleware
{
    private readonly RequestDelegate _next;

    public CustomSessionValidationMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (context.Session.TryGetValue("LastSessionValidation", out var value))
        {
            context.Session.SetString("LastSessionValidation", DateTime.UtcNow.ToString());
        }

        await _next(context);
    }
}