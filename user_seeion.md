Certainly! Here are all the SQL queries and stored procedures formatted for an `md` (Markdown) file.

## Create Table

```sql
-- Drop the table if it already exists
IF OBJECT_ID('dbo.tbl_online_user_sessions', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.tbl_online_user_sessions;
END
GO

-- Create the table
CREATE TABLE dbo.tbl_online_user_sessions (
    [Key] NVARCHAR(255) PRIMARY KEY,
    SubjectId NVARCHAR(255) NOT NULL,
    SessionId NVARCHAR(255) NOT NULL,
    Scheme NVARCHAR(255) NOT NULL,
    Created DATETIME DEFAULT GETDATE(),
    Renewed DATETIME DEFAULT GETDATE(),
    Expires DATETIME NULL,
    Ticket NVARCHAR(MAX) NOT NULL
);
GO
```

## Stored Procedure to Insert Data (`sp_create_user_session`)

```sql
-- Drop the stored procedure if it already exists
IF OBJECT_ID('dbo.sp_create_user_session', 'P') IS NOT NULL
BEGIN
    DROP PROCEDURE dbo.sp_create_user_session;
END
GO

-- Create the stored procedure
CREATE PROCEDURE dbo.sp_create_user_session
    @Key NVARCHAR(255),
    @SubjectId NVARCHAR(255),
    @SessionId NVARCHAR(255),
    @Scheme NVARCHAR(255),
    @Expires DATETIME NULL,
    @Ticket NVARCHAR(MAX)
AS
BEGIN
    -- Set NOCOUNT to ON to prevent the message indicating the number of rows affected
    SET NOCOUNT ON;

    -- Insert a new record into tbl_online_user_sessions
    INSERT INTO dbo.tbl_online_user_sessions ([Key], SubjectId, SessionId, Scheme, Created, Renewed, Expires, Ticket)
    VALUES (@Key, @SubjectId, @SessionId, @Scheme, GETDATE(), GETDATE(), @Expires, @Ticket);

    -- Print a message indicating the data has been inserted
    PRINT 'New session record has been inserted into tbl_online_user_sessions';
END
GO
```

## Stored Procedure to Retrieve Data (`sp_get_user_session`)

```sql
-- Drop the stored procedure if it already exists
IF OBJECT_ID('dbo.sp_get_user_session', 'P') IS NOT NULL
BEGIN
    DROP PROCEDURE dbo.sp_get_user_session;
END
GO

-- Create the stored procedure
CREATE PROCEDURE dbo.sp_get_user_session
    @Key NVARCHAR(255)
AS
BEGIN
    -- Set NOCOUNT to ON to prevent the message indicating the number of rows affected
    SET NOCOUNT ON;

    -- Select the session record from tbl_online_user_sessions based on the Key
    SELECT [Key], SubjectId, SessionId, Scheme, Created, Renewed, Expires, Ticket
    FROM dbo.tbl_online_user_sessions
    WHERE [Key] = @Key;
END
GO
```

## Stored Procedure to Delete Data (`sp_delete_user_session`)

```sql
-- Drop the stored procedure if it already exists
IF OBJECT_ID('dbo.sp_delete_user_session', 'P') IS NOT NULL
BEGIN
    DROP PROCEDURE dbo.sp_delete_user_session;
END
GO

-- Create the stored procedure
CREATE PROCEDURE dbo.sp_delete_user_session
    @Key NVARCHAR(255)
AS
BEGIN
    -- Set NOCOUNT to ON to prevent the message indicating the number of rows affected
    SET NOCOUNT ON;

    -- Delete the session record from tbl_online_user_sessions based on the Key
    DELETE FROM dbo.tbl_online_user_sessions
    WHERE [Key] = @Key;

    -- Check if any rows were affected by the delete operation
    IF @@ROWCOUNT > 0
    BEGIN
        -- Print a message indicating the session record has been deleted
        PRINT 'Session record with Key ' + @Key + ' has been deleted.';
    END
    ELSE
    BEGIN
        -- Print a message indicating no session record was found for the provided Key
        PRINT 'No session record found with Key ' + @Key + '.';
    END
END
GO
```

## Stored Procedure to Update Data (`sp_update_user_session`)

```sql
-- Drop the stored procedure if it already exists
IF OBJECT_ID('dbo.sp_update_user_session', 'P') IS NOT NULL
BEGIN
    DROP PROCEDURE dbo.sp_update_user_session;
END
GO

-- Create the stored procedure
CREATE PROCEDURE dbo.sp_update_user_session
    @Key NVARCHAR(255),
    @Expires DATETIME NULL,
    @Ticket NVARCHAR(MAX)
AS
BEGIN
    -- Set NOCOUNT to ON to prevent the message indicating the number of rows affected
    SET NOCOUNT ON;

    -- Update the Renewed, Expires, and Ticket columns in tbl_online_user_sessions based on the Key
    UPDATE dbo.tbl_online_user_sessions
    SET
        Renewed = GETDATE(),  -- Update the Renewed column to the current date and time
        Expires = @Expires,
        Ticket = @Ticket
    WHERE [Key] = @Key;

    -- Check if any rows were affected by the update operation
    IF @@ROWCOUNT > 0
    BEGIN
        -- Print a message indicating the session record has been updated
        PRINT 'Session record with Key ' + @Key + ' has been updated.';
    END
    ELSE
    BEGIN
        -- Print a message indicating no session record was found for the provided Key
        PRINT 'No session record found with Key ' + @Key + '.';
    END
END
GO
```

### Usage Examples

#### Insert a record

```sql
EXEC dbo.sp_create_user_session 
    @Key = 'your_key', 
    @SubjectId = 'subject_id', 
    @SessionId = 'session_id', 
    @Scheme = 'scheme', 
    @Expires = '2024-12-31 23:59:59', 
    @Ticket = 'your_ticket';
```

#### Retrieve a record

```sql
EXEC dbo.sp_get_user_session @Key = 'your_key';
```

#### Delete a record

```sql
EXEC dbo.sp_delete_user_session @Key = 'your_key';
```

#### Update a record

```sql
EXEC dbo.sp_update_user_session 
    @Key = 'your_key', 
    @Expires = '2024-12-31 23:59:59', 
    @Ticket = 'new_ticket';
```