CREATE PROCEDURE [dbo].[usp_DeleteReportTemplate]
    @TemplateId INT,
    @UserId VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Check if the user is the owner
        DECLARE @OwnerId VARCHAR(50);
        SELECT @OwnerId = SST_CREATED_BY
        FROM [dbo].[tbl_ONLINE_SS_TEMPLATE]
        WHERE SST_ID = @TemplateId;

        IF @OwnerId IS NULL
        BEGIN
            RAISERROR('Template not found', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        IF @OwnerId = @UserId
        BEGIN
            -- Owner: Soft delete template + remove all access records
            UPDATE [dbo].[tbl_ONLINE_SS_TEMPLATE]
            SET SST_IS_DELETED = 1,
                SST_UPDATED_BY = @UserId,
                SST_UPDATED_ON = GETDATE()
            WHERE SST_ID = @TemplateId;

            DELETE FROM [dbo].[tbl_TEMPLATE_ACCESS] -- replace with actual table
            WHERE TemplateId = @TemplateId;
        END
        ELSE
        BEGIN
            -- Not owner: Remove access only for this user
            DELETE FROM [dbo].[tbl_TEMPLATE_ACCESS]
            WHERE TemplateId = @TemplateId
              AND UserId = @UserId; -- replace with actual column
        END

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();

        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END
GO