
Self-Service Module: Database Design


1. Introduction
This document provides a comprehensive overview of the database design for the Self-Service Module. It covers the Master Tables that store the system's foundational metadata, the Transactional Tables that store user-generated content, and the Database Objects (Views, Functions, Stored Procedures) that encapsulate the business logic. The design enables a flexible, metadata-driven reporting system where users can create, save, schedule, and share reports in a secure and controlled manner.
2. Database Schema Diagram (ERD)
The following diagram illustrates the relationships between the core tables in the Self-Service module. The central entity is the TEMPLATE table, from which all user actions like scheduling, execution, and sharing originate. Master tables provide the building blocks for creating a template.
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
These tables store the foundational metadata for the module. This data is relatively static and defines the building blocks, rules, and display properties for the entire report creation process.
3.1. tbl_ONLINE_SS_CATEGORY
 * Purpose: Stores a simple list of categories used to organize report templates in the UI.
 * Primary Key: (CAT_CD, CAT_LANG)
3.2. tbl_ONLINE_SS_DATASOURCE
 * Purpose: Defines every available data source (typically a view) that a user can select as a basis for a report.
 * Primary Key: (DS_CD, DS_LANG)
3.3. tbl_ONLINE_SS_DATASOURCE_FIELD_MAPPING
 * Purpose: A critical metadata table that details every individual field within each data source. It controls how each field is displayed, formatted, and used in filters.
 * Primary Key: (DSFM_DS_CD, DSFM_FIELD_NAME, DSFM_LANG)
3.4. tbl_ONLINE_SS_DATASOURCE_JOINING_CONDITION
 * Purpose: Stores the predefined, valid JOIN conditions between any two data sources. This ensures that when a user combines multiple data sources, they are joined correctly.
 * Primary Key: (DSJC_DS_CD1, DSJC_DS_CD2)
4. Transactional Tables
These tables store data generated through user activity and revolve around the central report template.
4.1. tbl_ONLINE_SS_TEMPLATE
 * Purpose: The central table of the module. Each record is a user-created report "template" that stores the complete report definition in a JSON format. It is the parent entity for all user actions.
 * Primary Key: SST_ID (Identity)
| Key Column Name | Data Type | Description |
|---|---|---|
| SST_ID | int | (PK) Unique, auto-incremented identifier for the template. |
| SST_CAT_ID | varchar(15) | (FK) The category this template belongs to. |
| SST_FILTER_DETAIL | nvarchar(max) | The core report definition stored as a JSON document. |
| SST_CREATED_BY | varchar(50) | The user ID of the template creator. |
4.2. tbl_ONLINE_SS_REPORT_SCHEDULED_INFO
 * Purpose: Stores the configuration for templates that are scheduled to run automatically.
 * Primary Key: (FK_SST_ID, SSRSI_REPORT_FREQ)
| Key Column Name | Data Type | Description |
|---|---|---|
| FK_SST_ID | int | (FK) The ID of the template that is scheduled. |
| SSRSI_REPORT_FREQ | varchar(10) | Frequency of the run (e.g., 'DAILY', 'WEEKLY'). |
| JOB_REQUEST_ID | bigint | (FK) The ID of the recurring job in the external job table. |
4.3. tbl_ONLINE_SS_ADHOC_REPORT_INFO
 * Purpose: Tracks the history of all generated report instances, whether run on-demand or by a schedule.
 * Primary Key: (FK_SST_ID, SSAHRI_GENERATED_BY, SSAHRI_GENERATED_ON)
| Key Column Name | Data Type | Description |
|---|---|---|
| FK_SST_ID | int | (FK) The ID of the template that was executed. |
| JOB_REQUEST_ID | bigint | (FK) The ID of the background job that generated the report. |
4.4. tbl_ONLINE_SS_TEMPLATE_ACCESS
 * Purpose: A versatile access control table that manages sharing permissions for templates, schedules, and individual reports.
 * Primary Key: (FK_SST_ID, SSTA_SHARED_WITH, SSTA_SHARED_OBJECT)
| Key Column Name | Data Type | Description |
|---|---|---|
| FK_SST_ID | int | (FK) The ID of the object being shared. |
| SSTA_SHARED_WITH | varchar(50) | The User ID or Group ID the object is shared with. |
| SSTA_OBJECT_TYPE | varchar(10) | Distinguishes what is being shared ('TEMPLATE', 'SCHEDULE', or 'REPORT'). |
5. Overall Data Model & Workflow
The entire system revolves around the tbl_ONLINE_SS_TEMPLATE table.
 * Creation & Saving: A user designs a report by selecting data sources, columns, and filters. This configuration is compiled into a JSON object and saved as a single record in tbl_ONLINE_SS_TEMPLATE.
 * Execution & Generation:
   * A report is triggered either on-demand or by a schedule (tbl_ONLINE_SS_REPORT_SCHEDULED_INFO).
   * This creates a request in an external tbl_ONLINE_JOB_REQUEST table.
   * A backend process generates the report file and logs a history record in tbl_ONLINE_SS_ADHOC_REPORT_INFO.
 * Versatile Sharing Model: The tbl_ONLINE_SS_TEMPLATE_ACCESS table manages all sharing logic based on the SSTA_OBJECT_TYPE column:
   * 'TEMPLATE': Grants another user permission to view and run the report template.
   * 'SCHEDULE': Automatically shares all future reports generated by a schedule with specified users.
   * 'REPORT': Shares a single, specific, already-generated report instance for download.
6. Database Objects
6.1. Views
The views serve as a secure data access layer. Instead of direct table access, the system uses an extensive set of views as the defined Data Sources. This supports security and a multilingual architecture.
 * Naming Convention: vSS<UnderlyingTableName>_<LangSuffix> (e.g., vSsTransactions_En, vSsClientAddress_Fr).
6.2. Functions
Functions are specialized helper utilities that parse the template's JSON definition and generate individual SQL clauses. They are the building blocks for dynamic queries.
| Function Name | Purpose |
|---|---|
| FN_GenerateSsSelectClause | Constructs the SELECT part of the SQL query. |
| FN_GenerateSsWhereClause | Constructs the WHERE part of the SQL query. |
| FN_GetListSsFasatSortOptions | Constructs the ORDER BY part of the SQL query. |
| FN_GetSsGroupByQuery | Constructs the GROUP BY clause for aggregation. |
6.3. Stored Procedures
Stored procedures are the main interface for the application, orchestrating the business logic by calling helper functions and interacting with the tables.
| Group | Example Procedures | Purpose |
|---|---|---|
| Metadata Retrieval | SP_GetSsCategory, SP_GetSsDataSource | Fetches master data to populate the UI. |
| Dynamic Query Engine | SP_GetSsFromClause, SP_ListSsReportQuery | Assembles and executes the final SQL for a report from its JSON definition. |
| Template CRUD | SP_UpsertSsTemplate, SP_DeleteSsTemplate | Manages the full lifecycle of a report template. |
| Scheduling | SP_SaveSsReportSchedule, SP_CreateSsJobRequestForScheduledReports | Handles the creation of schedules and triggers scheduled jobs. |
| Sharing & Access | SP_InsertSsSharedInfo, SP_ValidateSsTemplateShareInfo | Manages the complex sharing logic for all object types. |
| Report Management | SP_GetSsGeneratedReport, SP_DeleteSsGeneratedReport | Retrieves and deletes generated report history. |
