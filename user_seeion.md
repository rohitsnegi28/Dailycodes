-- Check if the table 'tbl_online_user_sessions' already exists
IF OBJECT_ID('dbo.tbl_online_user_sessions', 'U') IS NOT NULL
BEGIN
    -- If the table exists, print a message
    PRINT 'Table "tbl_online_user_sessions" already exists.'
END
ELSE
BEGIN
    -- If the table does not exist, create the table
    CREATE TABLE dbo.tbl_online_user_sessions (
        -- Define the session_key column as NVARCHAR(255) and set it as the Primary Key
        session_key NVARCHAR(255) PRIMARY KEY,

        -- Define the session_value column as NVARCHAR(MAX) with a check constraint to ensure it contains valid JSON
        session_value NVARCHAR(MAX) CHECK (ISJSON(session_value) > 0),

        -- Define the created_at column as DATETIME with a default value of the current date and time
        created_at DATETIME DEFAULT GETDATE()
    );

    -- Print a message indicating the table has been created
    PRINT 'Table "tbl_online_user_sessions" has been created.'
END




-- Drop the stored procedure if it already exists
IF OBJECT_ID('dbo.sp_create_user_session', 'P') IS NOT NULL
BEGIN
    DROP PROCEDURE dbo.sp_create_user_session;
END
GO

-- Create the stored procedure
CREATE PROCEDURE dbo.sp_create_user_session
    @session_key NVARCHAR(255),
    @session_value NVARCHAR(MAX)
AS
BEGIN
    -- Set NOCOUNT to ON to prevent the message indicating the number of rows affected
    SET NOCOUNT ON;

    -- Insert a new record into tbl_online_user_sessions
    INSERT INTO dbo.tbl_online_user_sessions (session_key, session_value, created_at)
    VALUES (@session_key, @session_value, GETDATE());

    -- Print a message indicating the data has been inserted
    PRINT 'New session record has been inserted into tbl_online_user_sessions';
END
GO







-- Drop the stored procedure if it already exists
IF OBJECT_ID('dbo.sp_get_user_session', 'P') IS NOT NULL
BEGIN
    DROP PROCEDURE dbo.sp_get_user_session;
END
GO

-- Create the stored procedure
CREATE PROCEDURE dbo.sp_get_user_session
    @session_key NVARCHAR(255)
AS
BEGIN
    -- Set NOCOUNT to ON to prevent the message indicating the number of rows affected
    SET NOCOUNT ON;

    -- Select the session record from tbl_online_user_sessions based on the session_key
    SELECT session_key, session_value, created_at
    FROM dbo.tbl_online_user_sessions
    WHERE session_key = @session_key;
END
GO







EXEC dbo.sp_create_user_session @session_key = 'your_session_key', @session_value = '{ "key": "value" }';



-- Drop the stored procedure if it already exists
IF OBJECT_ID('dbo.sp_get_user_session', 'P') IS NOT NULL
BEGIN
    DROP PROCEDURE dbo.sp_get_user_session;
END
GO

-- Create the stored procedure
CREATE PROCEDURE dbo.sp_get_user_session
    @session_key NVARCHAR(255)
AS
BEGIN
    -- Set NOCOUNT to ON to prevent the message indicating the number of rows affected
    SET NOCOUNT ON;

    -- Select the session record from tbl_online_user_sessions based on the session_key
    SELECT session_key, session_value, created_at
    FROM dbo.tbl_online_user_sessions
    WHERE session_key = @session_key;
END
GO





EXEC dbo.sp_get_user_session @session_key = 'your_session_key';





-- Drop the stored procedure if it already exists
IF OBJECT_ID('dbo.sp_delete_user_session', 'P') IS NOT NULL
BEGIN
    DROP PROCEDURE dbo.sp_delete_user_session;
END
GO

-- Create the stored procedure
CREATE PROCEDURE dbo.sp_delete_user_session
    @session_key NVARCHAR(255)
AS
BEGIN
    -- Set NOCOUNT to ON to prevent the message indicating the number of rows affected
    SET NOCOUNT ON;

    -- Delete the session record from tbl_online_user_sessions based on the session_key
    DELETE FROM dbo.tbl_online_user_sessions
    WHERE session_key = @session_key;

    -- Check if any rows were affected by the delete operation
    IF @@ROWCOUNT > 0
    BEGIN
        -- Print a message indicating the session record has been deleted
        PRINT 'Session record with session_key ' + @session_key + ' has been deleted.';
    END
    ELSE
    BEGIN
        -- Print a message indicating no session record was found for the provided session_key
        PRINT 'No session record found with session_key ' + @session_key + '.';
    END
END
GO







