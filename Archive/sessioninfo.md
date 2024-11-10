To achieve the goal of fetching session information with each API call, checking if the session info is still valid based on a timeout, and then appending the session info to the API response headers, you can follow these steps:

### 1. Modify Backend (.NET)
You need to intercept API requests to fetch the latest session info from CIAM, append it to the response headers, and check for expiration.

#### a. Middleware for Fetching Session Info
Create a middleware to fetch session info and append it to the response headers:

```csharp
using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;

public class SessionInfoMiddleware
{
    private readonly RequestDelegate _next;
    private readonly HttpClient _httpClient;
    private readonly string _ciamApiUrl;

    public SessionInfoMiddleware(RequestDelegate next, HttpClient httpClient, IConfiguration configuration)
    {
        _next = next;
        _httpClient = httpClient;
        _ciamApiUrl = configuration["CiamApiUrl"]; // Fetch from configuration
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var response = await _httpClient.GetAsync(_ciamApiUrl);

        if (response.IsSuccessStatusCode)
        {
            var sessionInfo = await response.Content.ReadAsAsync<SessionInfo>();
            context.Response.OnStarting(() =>
            {
                context.Response.Headers.Add("Max-Session-Expiration-Time", sessionInfo.MaxSessionExpirationTime.ToString("o"));
                context.Response.Headers.Add("Max-Idle-Expiration-Time", sessionInfo.MaxIdleExpirationTime.ToString("o"));
                return Task.CompletedTask;
            });
        }

        await _next(context);
    }
}

// Extension method to add middleware
public static class SessionInfoMiddlewareExtensions
{
    public static IApplicationBuilder UseSessionInfoMiddleware(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<SessionInfoMiddleware>();
    }
}
```

#### b. Configure Middleware in Startup
Register the middleware in the `Startup` class:

```csharp
public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
{
    // Other configurations...

    app.UseSessionInfoMiddleware();

    // Other configurations...
}
```

### 2. Frontend Integration (React)
In your React application, check session info with each API call and handle expiration.

#### a. Fetch API Wrapper
Create a wrapper around the fetch API to intercept responses and check for session info:

```javascript
// fetchWrapper.js
export const fetchWrapper = async (url, options = {}) => {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error('API call failed');
  }

  const maxSessionExpirationTime = response.headers.get('Max-Session-Expiration-Time');
  const maxIdleExpirationTime = response.headers.get('Max-Idle-Expiration-Time');

  if (maxSessionExpirationTime && maxIdleExpirationTime) {
    const now = new Date();
    const sessionExpirationTime = new Date(maxSessionExpirationTime);
    const idleExpirationTime = new Date(maxIdleExpirationTime);

    if (now >= sessionExpirationTime || now >= idleExpirationTime) {
      // Handle session expiration (e.g., log out the user)
      console.log('Session expired. Please log in again.');
      // Redirect to login page or show session expired message
    }
  }

  return response.json();
};
```

#### b. Use Fetch Wrapper in API Calls
Use the `fetchWrapper` for making API calls in your React components:

```javascript
import React, { useEffect, useState } from 'react';
import { fetchWrapper } from './fetchWrapper';

const App = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await fetchWrapper('/api/your-endpoint');
        setData(result);
      } catch (error) {
        console.error('Failed to fetch data', error);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      {data ? (
        <div>
          {/* Render your data here */}
        </div>
      ) : (
        <div>Loading...</div>
      )}
    </div>
  );
};

export default App;
```

### Summary
1. **Middleware**: Create a middleware in your .NET backend to fetch session info from CIAM and append it to the response headers.
2. **Frontend Wrapper**: Create a wrapper around the fetch API to intercept responses and check for session expiration based on headers.
3. **Integration**: Use the fetch wrapper in your React components to handle API calls and session management.