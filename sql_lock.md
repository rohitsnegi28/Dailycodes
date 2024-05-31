To manage locks in SQL Server, you can use a combination of system views and dynamic management views (DMVs). Below are the steps and corresponding T-SQL queries to check for and delete table locks.

### Checking for Locks on a Table

To check for locks on a specific table, you can query the `sys.dm_tran_locks` DMV and join it with other system views to get detailed information.

```sql
-- Replace 'YourDatabase' and 'YourTable' with your database and table names
USE YourDatabase;
GO

SELECT 
    tl.resource_type,
    tl.resource_database_id,
    tl.resource_associated_entity_id AS TableID,
    OBJECT_NAME(tl.resource_associated_entity_id) AS TableName,
    tl.request_mode,
    tl.request_status,
    tl.request_session_id,
    es.login_name,
    es.host_name,
    es.program_name,
    es.client_interface_name,
    es.login_time,
    es.last_request_start_time,
    es.last_request_end_time
FROM 
    sys.dm_tran_locks AS tl
JOIN 
    sys.dm_exec_sessions AS es
ON 
    tl.request_session_id = es.session_id
WHERE 
    OBJECT_NAME(tl.resource_associated_entity_id) = 'YourTable';
GO
```

### Deleting Locks (Killing Sessions)

To release locks, you typically need to kill the sessions holding those locks. Be cautious, as killing a session can cause transaction rollbacks.

1. **Identify Sessions to Kill:**
   Use the query above to identify the session IDs (`request_session_id`) holding locks.

2. **Kill Sessions:**
   Use the `KILL` command to terminate those sessions.

```sql
-- Replace 'YourSessionID' with the session ID you want to kill
KILL YourSessionID;
GO
```

### Example: Checking and Deleting Locks on `YourTable`

Combining both steps, here’s an example where we check for locks on a table and then delete them:

```sql
-- Check for locks on 'YourTable'
USE YourDatabase;
GO

SELECT 
    tl.resource_type,
    tl.resource_database_id,
    tl.resource_associated_entity_id AS TableID,
    OBJECT_NAME(tl.resource_associated_entity_id) AS TableName,
    tl.request_mode,
    tl.request_status,
    tl.request_session_id,
    es.login_name,
    es.host_name,
    es.program_name,
    es.client_interface_name,
    es.login_time,
    es.last_request_start_time,
    es.last_request_end_time
FROM 
    sys.dm_tran_locks AS tl
JOIN 
    sys.dm_exec_sessions AS es
ON 
    tl.request_session_id = es.session_id
WHERE 
    OBJECT_NAME(tl.resource_associated_entity_id) = 'YourTable';
GO

-- Assuming the session ID to kill is 52 (Replace it with your actual session ID)
KILL 52;
GO
```

### Automating the Process (Be Very Careful)

You can automate this process, but be extremely cautious. Automatically killing sessions can lead to data loss and other issues.

```sql
-- Automate killing sessions holding locks on 'YourTable'
USE YourDatabase;
GO

DECLARE @session_id INT;

DECLARE cur CURSOR FOR
SELECT 
    tl.request_session_id
FROM 
    sys.dm_tran_locks AS tl
WHERE 
    OBJECT_NAME(tl.resource_associated_entity_id) = 'YourTable';

OPEN cur;

FETCH NEXT FROM cur INTO @session_id;

WHILE @@FETCH_STATUS = 0
BEGIN
    -- Print the session ID (optional)
    PRINT 'Killing session: ' + CAST(@session_id AS NVARCHAR(10));

    -- Kill the session
    EXEC('KILL ' + @session_id);

    FETCH NEXT FROM cur INTO @session_id;
END

CLOSE cur;
DEALLOCATE cur;
GO
```

### Important Considerations

1. **Backup First**: Always backup your database before performing such operations.
2. **Test in Development**: Test any automated script in a development environment before using it in production.
3. **Monitor Impact**: Monitor the impact of killing sessions, as it may affect users and applications.
4. **Graceful Handling**: Consider implementing more graceful handling, such as informing users or retrying transactions instead of killing sessions