Sure, here is the complete SQL code in a well-formatted Markdown document with explanations.

```markdown
# SQL Scripts for Managing User Sessions

This document contains the SQL scripts for creating a table and stored procedures to manage user sessions. The table is designed to store user session data, and the stored procedures handle inserting, retrieving, updating, and deleting session records.

## Table Creation Script

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

### Explanation
- **Table Drop and Creation:** Ensures that the table does not already exist before creating a new one.
- **Columns:**
  - `Key`: Primary key, uniquely identifies each session.
  - `SubjectId`: Identifies the subject.
  - `SessionId`: Identifies the session.
  - `Scheme`: Authentication scheme.
  - `Created`: Timestamp when the session was created.
  - `Renewed`: Timestamp when the session was last renewed.
  - `Expires`: Nullable timestamp when the session expires.
  - `Ticket`: Stores the session ticket.

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

### Explanation
- **Parameters:** Takes in `Key`, `SubjectId`, `SessionId`, `Scheme`, `Expires`, and `Ticket`.
- **Functionality:** Inserts a new session record with the provided data and sets the `Created` and `Renewed` timestamps to the current date and time.

## Stored Procedure to Retrieve Data by Key (`sp_get_user_session`)

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

### Explanation
- **Parameter:** `Key` to identify the session.
- **Functionality:** Retrieves the session record corresponding to the provided `Key`.

## Stored Procedure to Retrieve Data by SubjectId or SessionId (`sp_get_user_session_by_subject_or_session`)

```sql
-- Drop the stored procedure if it already exists
IF OBJECT_ID('dbo.sp_get_user_session_by_subject_or_session', 'P') IS NOT NULL
BEGIN
    DROP PROCEDURE dbo.sp_get_user_session_by_subject_or_session;
END
GO

-- Create the stored procedure
CREATE PROCEDURE dbo.sp_get_user_session_by_subject_or_session
    @SubjectId NVARCHAR(255) = NULL,
    @SessionId NVARCHAR(255) = NULL
AS
BEGIN
    -- Set NOCOUNT to ON to prevent the message indicating the number of rows affected
    SET NOCOUNT ON;

    -- Select the session record from tbl_online_user_sessions based on SubjectId or SessionId
    SELECT [Key], SubjectId, SessionId, Scheme, Created, Renewed, Expires, Ticket
    FROM dbo.tbl_online_user_sessions
    WHERE 
        (@SubjectId IS NULL OR SubjectId = @SubjectId) AND
        (@SessionId IS NULL OR SessionId = @SessionId);

    -- Print a message indicating the retrieval process
    PRINT 'Filtered session records have been retrieved from tbl_online_user_sessions';
END
GO
```

### Explanation
- **Parameters:** `SubjectId` and `SessionId`, both optional.
- **Functionality:** Retrieves session records filtered by `SubjectId`, `SessionId`, or both.

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

### Explanation
- **Parameter:** `Key` to identify the session.
- **Functionality:** Deletes the session record corresponding to the provided `Key`. Prints a message indicating whether the deletion was successful or if no record was found.

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

### Explanation
- **Parameters:** `Key`, `Expires`, and `Ticket`.
- **Functionality:** Updates the `Renewed`, `Expires`, and `Ticket` columns for the session record corresponding to the provided `Key`.

## Usage Examples

### Insert a Record

```sql
EXEC dbo.sp_create_user_session 
    @Key = 'your_key', 
    @SubjectId = 'subject_id', 
    @SessionId = 'session_id', 
    @Scheme = 'scheme', 
    @Expires = '2024-12-31 23:59:59', 
    @Ticket = 'your_ticket';
```

### Retrieve a Record by Key

```sql
EXEC dbo.sp_get_user_session @Key = 'your_key';
```

### Retrieve Records by SubjectId or SessionId

```sql
EXEC dbo.sp_get_user_session_by_subject_or_session @SubjectId = 'your_subject_id';
```

```sql
EXEC dbo.sp_get_user_session_by_subject_or_session @SessionId = 'your_session_id';
```

```sql
EXEC dbo.sp_get_user_session_by_subject_or_session @SubjectId = 'your_subject_id', @SessionId = 'your_session_id';
```

### Delete a Record

```sql
EXEC dbo.sp_delete_user_session @Key = 'your_key';
```

### Update a Record

```sql
EXEC dbo.sp_update_user_session

```markdown
### Update a Record

```sql
EXEC dbo.sp_update_user_session 
    @Key = 'your_key', 
    @Expires = '2024-12-31 23:59:59', 
    @Ticket = 'new_ticket';
```

## Conclusion

This document outlines the SQL scripts necessary for creating a table to store user session data and the stored procedures to manage these sessions. The procedures cover insertion, retrieval by key, retrieval by `SubjectId` or `SessionId`, deletion, and updating specific fields of a session record. Each script includes explanations to aid in understanding their functionality and usage.
```