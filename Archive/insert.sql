BEGIN TRY
    -- Attempt to insert a row into the table
    INSERT INTO YourTable (Column1, Column2, Column3)
    VALUES (@Value1, @Value2, @Value3);

    -- Check if the row count is zero
    IF @@ROWCOUNT = 0
    BEGIN
        -- Throw a custom error if no rows were inserted
        RAISERROR('Custom error: No rows were inserted.', 16, 1);
    END
END TRY
BEGIN CATCH
    -- Handle the error
    DECLARE @ErrorMessage NVARCHAR(4000);
    DECLARE @ErrorSeverity INT;
    DECLARE @ErrorState INT;

    SELECT 
        @ErrorMessage = ERROR_MESSAGE(),
        @ErrorSeverity = ERROR_SEVERITY(),
        @ErrorState = ERROR_STATE();

    -- Re-throw the error
    RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
END CATCH;