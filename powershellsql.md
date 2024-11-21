To connect to a SQL Server using the Microsoft SQL Client in PowerShell, you can use the System.Data.SqlClient.SqlConnection class or the Microsoft.Data.SqlClient library (newer and preferred for recent implementations). Here’s a step-by-step guide:

Step 1: Import Necessary Assembly

If you’re using the Microsoft.Data.SqlClient library, make sure it’s installed. For System.Data.SqlClient, it’s part of .NET Framework.

For Microsoft.Data.SqlClient, you can install it via NuGet:

Install-Package Microsoft.Data.SqlClient -Scope CurrentUser

Step 2: Define Connection String

Prepare the connection string with the necessary credentials.

# Define your SQL Server connection details
$Server = "YourServerName"
$Database = "YourDatabaseName"
$Username = "YourUsername"  # Omit for integrated authentication
$Password = "YourPassword"  # Omit for integrated authentication

# Integrated Security (Windows Authentication)
$ConnectionString = "Server=$Server;Database=$Database;Integrated Security=True;"

# SQL Server Authentication
# $ConnectionString = "Server=$Server;Database=$Database;User Id=$Username;Password=$Password;"

Step 3: Connect to SQL Server

Use System.Data.SqlClient or Microsoft.Data.SqlClient to create the connection.

Using System.Data.SqlClient

# Import System.Data.SqlClient
Add-Type -AssemblyName "System.Data"

# Create a new SQL connection
$SqlConnection = New-Object System.Data.SqlClient.SqlConnection
$SqlConnection.ConnectionString = $ConnectionString
$SqlConnection.Open()

Write-Output "Connection to SQL Server established successfully!"

# Close the connection after use
$SqlConnection.Close()

Using Microsoft.Data.SqlClient

# Import Microsoft.Data.SqlClient
Add-Type -Path "C:\path\to\Microsoft.Data.SqlClient.dll"

# Create a new SQL connection
$SqlConnection = New-Object Microsoft.Data.SqlClient.SqlConnection
$SqlConnection.ConnectionString = $ConnectionString
$SqlConnection.Open()

Write-Output "Connection to SQL Server established successfully!"

# Close the connection after use
$SqlConnection.Close()

Step 4: Execute Queries

You can use SqlCommand to execute SQL queries or stored procedures.

# Define a query
$Query = "SELECT TOP 10 * FROM YourTable"

# Create a SqlCommand
$SqlCommand = $SqlConnection.CreateCommand()
$SqlCommand.CommandText = $Query

# Execute the query and load results into a DataTable
$SqlAdapter = New-Object System.Data.SqlClient.SqlDataAdapter $SqlCommand
$DataTable = New-Object System.Data.DataTable
$SqlAdapter.Fill($DataTable)

# Display results
$DataTable | Format-Table

# Close the connection
$SqlConnection.Close()

Notes:

	1.	Authentication:
	•	For Windows Authentication, use Integrated Security=True in your connection string.
	•	For SQL Server Authentication, include User Id and Password in the connection string.
	2.	Error Handling: Add try-catch blocks to handle exceptions effectively.

try {
    $SqlConnection.Open()
    Write-Output "Connection Successful"
} catch {
    Write-Error "Failed to connect: $_"
} finally {
    $SqlConnection.Close()
}

	3.	Modules: Consider using the DBATools or SQLServer PowerShell modules for simplified SQL Server interactions.