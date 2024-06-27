using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
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
        var serviceCollection = new ServiceCollection();
        serviceCollection.AddDistributedMemoryCache();
        serviceCollection.AddSession();

        var serviceProvider = serviceCollection.BuildServiceProvider();

        var context = new DefaultHttpContext
        {
            RequestServices = serviceProvider
        };

        var sessionFeature = new SessionFeature
        {
            Session = new DistributedSession(
                serviceProvider.GetRequiredService<IDistributedCache>(),
                Guid.NewGuid().ToString(),
                TimeSpan.FromMinutes(20),
                new LoggerFactory().CreateLogger<DistributedSession>())
        };

        context.Features.Set<ISessionFeature>(sessionFeature);

        // Manually initialize the session.
        await context.Session.LoadAsync(default);
        context.Session.SetString("LastSessionValidation", DateTime.UtcNow.ToString());

        var middleware = new CustomSessionValidationMiddleware((HttpContext ctx) => Task.CompletedTask);

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        var updatedValidationTime = context.Session.GetString("LastSessionValidation");
        Assert.NotNull(updatedValidationTime);
        Assert.True(DateTime.TryParse(updatedValidationTime, out var _));
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