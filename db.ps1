# Azure SQL Database Connection using Service Principal

# Database Connection Parameters
$tenantId = "your-tenant-id"       # Azure AD Tenant ID
$clientId = "your-client-id"        # Service Principal App (Client) ID
$clientSecret = "your-client-secret" # Service Principal Client Secret
$sqlServerName = "your-sql-server-name"
$databaseName = "your-database-name"

# Construct Connection String with Direct Azure AD Authentication
$connectionString = "Server=tcp:$sqlServerName.database.windows.net,1433;" +
                    "Initial Catalog=$databaseName;" +
                    "Persist Security Info=False;" +
                    "User ID=$clientId;" +
                    "Password=$clientSecret;" +
                    "MultipleActiveResultSets=False;" +
                    "Encrypt=True;" +
                    "TrustServerCertificate=False;" +
                    "Authentication=Active Directory OAuth"

try {
    # Create SQL Connection
    $sqlConnection = New-Object System.Data.SqlClient.SqlConnection($connectionString)
    
    # Open the connection
    $sqlConnection.Open()
    
    # Create a command to test connection
    $sqlCommand = $sqlConnection.CreateCommand()
    $sqlCommand.CommandText = "SELECT SUSER_SNAME()"
    
    # Execute query
    $result = $sqlCommand.ExecuteScalar()
    Write-Host "Successfully connected. Current user: $result"
    
    # Example: Run a sample query
    $sqlCommand.CommandText = "SELECT TOP 5 * FROM YourTableName"
    $sqlAdapter = New-Object System.Data.SqlClient.SqlDataAdapter($sqlCommand)
    $dataTable = New-Object System.Data.DataTable
    $sqlAdapter.Fill($dataTable)
    
    # Display results
    $dataTable | Format-Table -AutoSize
    
    # Close the connection
    $sqlConnection.Close()
}
catch {
    Write-Error "Database connection error: $_"
}