Certainly! Below are the updated stored procedures to work with the new schema of `tbl_online_user_sessions` which includes columns `Key`, `SubjectId`, `SessionId`, `Scheme`, `Created`, `Renewed`, `Expires`, and `Ticket`.

### 1. Create the Table
First, create the table with the updated schema:

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

### 2. Stored Procedure to Insert Data (`sp_create_user_session`)
Next, create a stored procedure to insert data into the table:

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

### 3. Stored Procedure to Retrieve Data (`sp_get_user_session`)
Next, create a stored procedure to retrieve data based on the `Key`:

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

### 4. Stored Procedure to Delete Data (`sp_delete_user_session`)
Finally, create a stored procedure to delete data based on the `Key`:

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

### Summary
With these scripts, you can manage user session data in the `tbl_online_user_sessions` table by inserting, retrieving, and deleting records based on the `Key`. Here’s how you can execute each stored procedure:

- **Insert a record:**
  ```sql
  EXEC dbo.sp_create_user_session 
      @Key = 'your_key', 
      @SubjectId = 'subject_id', 
      @SessionId = 'session_id', 
      @Scheme = 'scheme', 
      @Expires = '2024-12-31 23:59:59', 
      @Ticket = 'your_ticket';
  ```

- **Retrieve a record:**
  ```sql
  EXEC dbo.sp_get_user_session @Key = 'your_key';
  ```

- **Delete a record:**
  ```sql
  EXEC dbo.sp_delete_user_session @Key = 'your_key';
  ```