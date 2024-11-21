# Ensure Microsoft.Data.SqlClient is available
function Ensure-SqlClient {
    $nugetPackage = "Microsoft.Data.SqlClient"
    $assemblyPath = Join-Path $env:USERPROFILE ".nuget\packages\$nugetPackage"

    if (-not (Test-Path $assemblyPath)) {
        Write-Host "Downloading and installing $nugetPackage from NuGet..." -ForegroundColor Green

        # Install NuGet package
        Install-Package -Name $nugetPackage -Source https://api.nuget.org/v3/index.json -Scope CurrentUser -Force

        # Find the most recent DLL version
        $latestVersion = Get-ChildItem -Path "$assemblyPath" | Sort-Object Name -Descending | Select-Object -First 1
        $dllPath = Join-Path $latestVersion.FullName "lib\netstandard2.0\Microsoft.Data.SqlClient.dll"

        if (-not (Test-Path $dllPath)) {
            throw "Failed to locate the Microsoft.Data.SqlClient.dll."
        }

        return $dllPath
    } else {
        # Find already downloaded DLL
        $latestVersion = Get-ChildItem -Path "$assemblyPath" | Sort-Object Name -Descending | Select-Object -First 1
        return Join-Path $latestVersion.FullName "lib\netstandard2.0\Microsoft.Data.SqlClient.dll"
    }
}

# Load the Microsoft.Data.SqlClient assembly
$dllPath = Ensure-SqlClient
Add-Type -Path $dllPath

# Hardcoded connection string and SQL query
$connectionString = "Server=your_server_name;Database=your_database_name;User Id=your_username;Password=your_password;"
$query = "SELECT TOP 10 * FROM your_table_name;"

# Function to execute a SQL query
function Execute-SqlQuery {
    param (
        [string]$connectionString,
        [string]$query
    )

    try {
        # Create a SQL connection
        $connection = New-Object Microsoft.Data.SqlClient.SqlConnection($connectionString)
        $connection.Open()

        # Create a SQL command
        $command = $connection.CreateCommand()
        $command.CommandText = $query

        # Execute and fetch results
        $dataAdapter = New-Object Microsoft.Data.SqlClient.SqlDataAdapter $command
        $dataTable = New-Object System.Data.DataTable
        $dataAdapter.Fill($dataTable)

        return $dataTable
    }
    catch {
        Write-Error "An error occurred: $_"
    }
    finally {
        # Ensure connection is closed
        if ($connection.State -eq [System.Data.ConnectionState]::Open) {
            $connection.Close()
        }
    }
}

# Execute the query and display results
$results = Execute-SqlQuery -connectionString $connectionString -query $query

if ($results.Rows.Count -gt 0) {
    $results | Format-Table -AutoSize
} else {
    Write-Output "No records found."
}