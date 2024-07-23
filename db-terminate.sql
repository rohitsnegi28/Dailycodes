USE master;
GO

DECLARE @DatabaseName NVARCHAR(50) = 'your_database_name';

DECLARE @kill varchar(8000) = '';
SELECT @kill = @kill + 'KILL ' + CONVERT(varchar(5), session_id) + ';'
FROM sys.dm_exec_sessions
WHERE database_id = DB_ID(@DatabaseName) AND session_id <> @@SPID;

EXEC(@kill);
GO