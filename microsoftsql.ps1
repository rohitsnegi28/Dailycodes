# Ensure SqlClient package is installed
# Install-Package -Name Microsoft.Data.SqlClient -Force

# Import the SqlClient namespace
Add-Type -Path (Get-Package Microsoft.Data.SqlClient).Source

# Method 1: Using Windows Authentication (Integrated Security)
function Connect-ToSqlServerWindowsAuth {
    param(
        [string]$ServerName = "localhost",
        [string]$DatabaseName = "YourDatabase"
    )

    try {
        # Establish connection using Windows Authentication
        $connectionString = "Server=$ServerName;Database=$DatabaseName;Integrated Security=True;TrustServerCertificate=True;"
        $connection = New-Object Microsoft.Data.SqlClient.SqlConnection($connectionString)
        
        # Open the connection
        $connection.Open()
        
        Write-Host "Successfully connected to $ServerName/$DatabaseName using Windows Authentication" -ForegroundColor Green
        
        # Return the connection object for further use if needed
        return $connection
    }
    catch {
        Write-Host "Connection failed: $_" -ForegroundColor Red
    }
    finally {
        # Close connection if it's open
        if ($connection -and $connection.State -eq 'Open') {
            $connection.Close()
        }
    }
}

# Method 2: Using SQL Server Authentication
function Connect-ToSqlServerSqlAuth {
    param(
        [string]$ServerName = "localhost",
        [string]$DatabaseName = "YourDatabase",
        [string]$Username,
        [securestring]$Password
    )

    try {
        # Convert secure string to plain text for connection string
        $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($Password)
        $PlainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

        # Establish connection using SQL Server Authentication
        $connectionString = "Server=$ServerName;Database=$DatabaseName;User ID=$Username;Password=$PlainPassword;TrustServerCertificate=True;"
        $connection = New-Object Microsoft.Data.SqlClient.SqlConnection($connectionString)
        
        # Open the connection
        $connection.Open()
        
        Write-Host "Successfully connected to $ServerName/$DatabaseName using SQL Authentication" -ForegroundColor Green
        
        # Return the connection object for further use if needed
        return $connection
    }
    catch {
        Write-Host "Connection failed: $_" -ForegroundColor Red
    }
    finally {
        # Securely clear the password from memory
        if ($PlainPassword) {
            [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR)
        }
        
        # Close connection if it's open
        if ($connection -and $connection.State -eq 'Open') {
            $connection.Close()
        }
    }
}

# Example of executing a query
function Invoke-SqlQuery {
    param(
        [Microsoft.Data.SqlClient.SqlConnection]$Connection,
        [string]$Query
    )

    try {
        $command = New-Object Microsoft.Data.SqlClient.SqlCommand($Query, $Connection)
        $reader = $command.ExecuteReader()

        $results = @()
        while ($reader.Read()) {
            $row = @{}
            for ($i = 0; $i -lt $reader.FieldCount; $i++) {
                $row[$reader.GetName($i)] = $reader.GetValue($i)
            }
            $results += $row
        }

        $reader.Close()
        return $results
    }
    catch {
        Write-Host "Query execution failed: $_" -ForegroundColor Red
    }
}

# Example Usage for Windows Authentication
# $windowsAuthConnection = Connect-ToSqlServerWindowsAuth -ServerName "YourServerName" -DatabaseName "YourDatabaseName"

# Example Usage for SQL Authentication
# $securePassword = ConvertTo-SecureString "YourPassword" -AsPlainText -Force
# $sqlAuthConnection = Connect-ToSqlServerSqlAuth -ServerName "YourServerName" -DatabaseName "YourDatabaseName" -Username "YourUsername" -Password $securePassword

# Example of executing a query
# $queryResults = Invoke-SqlQuery -Connection $sqlAuthConnection -Query "SELECT * FROM YourTable"