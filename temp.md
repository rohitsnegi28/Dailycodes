Of course. Here is the complete and detailed database design document in a clean, final format.
Self-Service Module: Database Design
Date: October 12, 2025
1. Introduction
This document provides a comprehensive overview of the database design for the Self-Service Module. It covers the Master Tables that store foundational metadata, the Transactional Tables that store user-generated content, and the Database Objects (Views, Functions, Stored Procedures) that encapsulate all business logic. The design enables a flexible, metadata-driven reporting system where users can create, save, schedule, and share reports in a secure and controlled manner.
2. Database Schema Diagram (ERD)
The following diagram illustrates the relationships between the core tables. The central entity is the TEMPLATE table, from which all user actions like scheduling, execution, and sharing originate.
erDiagram
    tbl_ONLINE_SS_TEMPLATE {
        int SST_ID PK
        varchar(15) SST_CAT_ID FK
        nvarchar(max) SST_FILTER_DETAIL
        varchar(50) SST_CREATED_BY
    }
    tbl_ONLINE_SS_CATEGORY {
        varchar(15) CAT_CD PK
        varchar(1) CAT_LANG PK
        varchar(50) CAT_NAME
    }
    tbl_ONLINE_SS_REPORT_SCHEDULED_INFO {
        int FK_SST_ID PK, FK
        varchar(10) SSRSI_REPORT_FREQ PK
        bigint JOB_REQUEST_ID FK
    }
    tbl_ONLINE_SS_ADHOC_REPORT_INFO {
        int FK_SST_ID PK, FK
        varchar(50) SSAHRI_GENERATED_BY PK
        datetime SSAHRI_GENERATED_ON PK
        bigint JOB_REQUEST_ID FK
    }
    tbl_ONLINE_SS_TEMPLATE_ACCESS {
        int FK_SST_ID PK, FK
        varchar(50) SSTA_SHARED_WITH PK
        varchar(8) SSTA_SHARED_OBJECT PK
        varchar(10) SSTA_OBJECT_TYPE
    }
    tbl_ONLINE_SS_DATASOURCE {
        varchar(30) DS_CD PK
        char(1) DS_LANG PK
        varchar(100) DS_NAME
    }
    tbl_ONLINE_SS_DATASOURCE_FIELD_MAPPING {
        varchar(30) DSFM_DS_CD PK, FK
        varchar(250) DSFM_FIELD_NAME PK
        char(1) DSFM_LANG PK
    }
    tbl_ONLINE_SS_DATASOURCE_JOINING_CONDITION {
        varchar(30) DSJC_DS_CD1 PK, FK
        varchar(30) DSJC_DS_CD2 PK, FK
        varchar(max) DSJC_JOIN_COND
    }

    tbl_ONLINE_SS_TEMPLATE ||--|{ tbl_ONLINE_SS_CATEGORY : "belongs to"
    tbl_ONLINE_SS_TEMPLATE ||--o{ tbl_ONLINE_SS_REPORT_SCHEDULED_INFO : "can have"
    tbl_ONLINE_SS_TEMPLATE ||--o{ tbl_ONLINE_SS_ADHOC_REPORT_INFO : "executes as"
    tbl_ONLINE_SS_TEMPLATE ||--o{ tbl_ONLINE_SS_TEMPLATE_ACCESS : "permissions defined in"
    tbl_ONLINE_SS_DATASOURCE ||--o{ tbl_ONLINE_SS_DATASOURCE_FIELD_MAPPING : "contains"
    tbl_ONLINE_SS_DATASOURCE ||--o{ tbl_ONLINE_SS_DATASOURCE_JOINING_CONDITION : "joins with"


3. Master Tables
These tables store static metadata that defines the building blocks for the entire report creation process.
 * tbl_ONLINE_SS_CATEGORY: Stores categories to organize report templates.
 * tbl_ONLINE_SS_DATASOURCE: Defines every available data source (typically a view) for reporting.
 * tbl_ONLINE_SS_DATASOURCE_FIELD_MAPPING: Details every field within each data source, controlling its display, formatting, and filter behavior.
 * tbl_ONLINE_SS_DATASOURCE_JOINING_CONDITION: Stores the predefined JOIN conditions between any two data sources.
4. Transactional Tables
These tables store data generated through user activity.
4.1. tbl_ONLINE_SS_TEMPLATE
The central table of the module. Each record is a user-created report "template" storing the complete report definition in a JSON format.
| Key Column Name | Data Type | Description |
|---|---|---|
| SST_ID | int | (PK) Unique, auto-incremented identifier for the template. |
| SST_FILTER_DETAIL | nvarchar(max) | The core report definition stored as a JSON document. |
4.2. tbl_ONLINE_SS_REPORT_SCHEDULED_INFO
Stores the configuration for templates scheduled to run automatically.
| Key Column Name | Data Type | Description |
|---|---|---|
| FK_SST_ID | int | (FK) The ID of the template that is scheduled. |
| SSRSI_REPORT_FREQ | varchar(10) | Frequency of the run (e.g., 'DAILY', 'WEEKLY'). |
4.3. tbl_ONLINE_SS_ADHOC_REPORT_INFO
Tracks the history of all generated report instances.
| Key Column Name | Data Type | Description |
|---|---|---|
| FK_SST_ID | int | (FK) The ID of the template that was executed. |
| JOB_REQUEST_ID | bigint | (FK) The ID of the background job that generated the report file. |
4.4. tbl_ONLINE_SS_TEMPLATE_ACCESS
A versatile access control table that manages all sharing permissions.
| Key Column Name | Data Type | Description |
|---|---|---|
| FK_SST_ID | int | (FK) The ID of the object being shared. |
| SSTA_SHARED_WITH | varchar(50) | The User ID or Group ID the object is shared with. |
| SSTA_OBJECT_TYPE | varchar(10) | Distinguishes what is being shared ('TEMPLATE', 'SCHEDULE', or 'REPORT'). |
5. Overall Data Model & Workflow
The system revolves around the tbl_ONLINE_SS_TEMPLATE table.
 * Creation & Saving: A user designs a report by selecting data sources, columns, and filters. This configuration is compiled into a JSON object and saved as a single record.
 * Execution & Generation: A report is triggered on-demand or by a schedule, creating a job request. A backend process generates the report and logs the history.
 * Sharing: The tbl_ONLINE_SS_TEMPLATE_ACCESS table manages permissions based on the SSTA_OBJECT_TYPE column:
   * 'TEMPLATE': Grants another user permission to view and run the report template.
   * 'SCHEDULE': Automatically shares all future reports generated by a schedule with specified users.
   * 'REPORT': Shares a single, specific, already-generated report instance for download.
6. Database Objects
6.1. Views
The views serve as a secure data access layer. Instead of direct table access, the system uses an extensive set of views as the defined Data Sources. This supports security and a multilingual architecture.
 * Naming Convention: vSS<UnderlyingTableName>_<LangSuffix> (e.g., vSsTransactions_En).
6.2. Functions
Functions are specialized helper utilities that parse the template's JSON definition and generate individual SQL clauses.
| Function Name | Purpose |
|---|---|
| FN_GenerateSsSelectClause | Constructs the SELECT part of the SQL query from the JSON. |
| FN_GenerateSsWhereClause | Constructs the WHERE part of the SQL query from the JSON. |
| FN_GetListSsFasatSortOptions | Constructs the ORDER BY part of the SQL query from the JSON. |
| FN_GetSsFirstColumnFromColumnOrders | A utility function to extract only the first column specified in the sort order. |
| FN_GetSsColumnsForGroupBy | Gathers the columns needed for a GROUP BY operation from the JSON. |
| FN_GetSsGroupByQuery | Generates the GROUP BY clause for an aggregation query. |
| FN_GetSsSelectQueryForGroupBy | Constructs a complete SELECT query specifically for aggregation. |
6.3. Stored Procedures
Stored procedures are the main interface for the application, orchestrating business logic and data manipulation.
| Procedure Name | Purpose & Logic |
|---|---|
| SP_GetSsCategory | Fetches the list of all available report categories for the UI. |
| SP_GetSsDataSource | Fetches the list of available data sources for the UI. |
| SP_GetSsDsFieldMapping | Gets all available fields for a specific data source. |
| SP_GetSsFromClause | Dynamically constructs the FROM and JOIN clauses of a query based on the selected data sources in the JSON. |
| SP_ListSsReportQuery | Core Query Engine. Assembles and executes the final SQL for a report preview or execution by calling the helper functions. |
| SP_ListSsReport | Lists all templates a user has access to (created by them or shared with them). |
| SP_UpsertSsTemplate | Saves a new template (INSERT) or updates an existing one (UPDATE). |
| SP_ListSsTemplate | Retrieves the details for a single, specific template by its ID. |
| SP_DeleteSsTemplate | Deletes a template and all its related child data (schedules, access rules, history). |
| SP_InsertSsSharedInfo | Creates a sharing rule by inserting a record into tbl_ONLINE_SS_TEMPLATE_ACCESS. |
| SP_GetSsSharedInfo | Retrieves the list of users/groups a specific object is shared with. |
| SP_ListSsScheduledReportRecords | Fetches the list of all configured schedules for a user. |
| SP_CreateSsJobRequestForScheduledReports | The procedure run by the system scheduler to trigger all due reports. |
| SP_ValidateSsTemplateShareInfo | A security check procedure to verify if the current user has permission to view or access a template. |
| SP_CreateSsJobRequestForTemplateID | Initiates an on-demand (ad-hoc) report run by creating a job request. |
| SP_GetSsReportSchedule | Retrieves the specific schedule details for a single template. |
| SP_SaveSsReportSchedule | Creates or updates a report's schedule in tbl_ONLINE_SS_REPORT_SCHEDULED_INFO. |
| SP_GetSsGeneratedReport | Fetches the execution history of generated reports for a user. |
| SP_DeleteSsGeneratedReport | Deletes a specific generated report instance and its associated sharing rules. |
