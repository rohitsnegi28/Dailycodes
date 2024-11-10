Creating a custom health check API to determine which database (primary or archive) is connected involves several steps. Here's a detailed guide on how to implement this in your .NET Core application:

### Step-by-Step Guide to Implement a Custom Health Check API for Database Connection

1. **Define the Health Check Class:**
   Create a custom health check class that implements `IHealthCheck`. This class will check which database (primary or archive) is connected.

   ```csharp
   using Microsoft.Extensions.Diagnostics.HealthChecks;
   using System.Threading;
   using System.Threading.Tasks;
   using Microsoft.Extensions.Configuration;
   using System.Data.SqlClient;

   public class DatabaseConnectionHealthCheck : IHealthCheck
   {
       private readonly string _primaryConnectionString;
       private readonly string _archiveConnectionString;

       public DatabaseConnectionHealthCheck(IConfiguration configuration)
       {
           _primaryConnectionString = configuration.GetConnectionString("PrimaryDatabase");
           _archiveConnectionString = configuration.GetConnectionString("ArchiveDatabase");
       }

       public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
       {
           string connectedDatabase = string.Empty;

           // Check primary database connection
           if (await CanConnectToDatabase(_primaryConnectionString))
           {
               connectedDatabase = "Primary Database";
           }
           else if (await CanConnectToDatabase(_archiveConnectionString))
           {
               connectedDatabase = "Archive Database";
           }
           else
           {
               return HealthCheckResult.Unhealthy("Neither primary nor archive database is connected.");
           }

           return HealthCheckResult.Healthy($"Connected to: {connectedDatabase}");
       }

       private async Task<bool> CanConnectToDatabase(string connectionString)
       {
           try
           {
               using (var connection = new SqlConnection(connectionString))
               {
                   await connection.OpenAsync();
                   return true;
               }
           }
           catch
           {
               return false;
           }
       }
   }
   ```

2. **Register the Health Check in `Startup.cs` or `Program.cs`:**
   Register the custom health check service in the `ConfigureServices` method.

   ```csharp
   public void ConfigureServices(IServiceCollection services)
   {
       services.AddControllers();

       // Register custom health check
       services.AddHealthChecks()
               .AddCheck<DatabaseConnectionHealthCheck>("database_connection_health_check");
   }
   ```

3. **Configure the Health Check Endpoint:**
   Configure the endpoint in the `Configure` method to expose the health check endpoint.

   ```csharp
   public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
   {
       if (env.IsDevelopment())
       {
           app.UseDeveloperExceptionPage();
       }

       app.UseRouting();
       app.UseStaticFiles();

       app.UseEndpoints(endpoints =>
       {
           endpoints.MapControllers();
           endpoints.MapHealthChecks("/health"); // Add this line to map health check endpoint
           endpoints.MapFallbackToFile("index.html");
       });
   }
   ```

4. **Add Connection Strings to `appsettings.json`:**
   Ensure your `appsettings.json` file has the connection strings for the primary and archive databases.

   ```json
   {
       "ConnectionStrings": {
           "PrimaryDatabase": "YourPrimaryDatabaseConnectionString",
           "ArchiveDatabase": "YourArchiveDatabaseConnectionString"
       },
       "Logging": {
           "LogLevel": {
               "Default": "Information",
               "Microsoft": "Warning",
               "Microsoft.Hosting.Lifetime": "Information"
           }
       },
       "AllowedHosts": "*"
   }
   ```

5. **Testing the Custom Health Check Endpoint:**
   - Start your application:
     ```bash
     dotnet run
     ```
   - Navigate to `http://localhost:5000/health` in your browser or use a tool like `curl` or Postman to see the health status:
     ```bash
     curl http://localhost:5000/health
     ```

   You should see a response indicating which database (primary or archive) is connected:

   ```json
   {
       "status": "Healthy",
       "results": {
           "database_connection_health_check": {
               "status": "Healthy",
               "description": "Connected to: Primary Database"
           }
       }
   }
   ```

By following these steps, you will have a custom health check API that checks which database (primary or archive) is connected and provides this information in the health check endpoint.