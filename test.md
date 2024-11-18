
# **Self-Service Report Scheduler Design Document**

## **Overview**
The Self-Service Report Scheduler allows users to schedule custom report exports dynamically. The process integrates seamlessly with the existing export framework while supporting flexible templates and data mappings.

---

## **System Components**

### 1. **Self-Service Template**
   - **Purpose:** Allows users to define and save templates specifying query column details for their desired reports.
   - **Details:**
     - Users can create a template specifying:
       - Columns to be included in the report.
       - Data filters and constraints.
       - Additional configuration options.
     - These templates serve as a blueprint for data extraction and report generation.

---

### 2. **Self-Service Schedule Table**
   - **Purpose:** Stores scheduling information for templates created by users.
   - **Details:**
     - Maintains records for templates and their scheduling configurations, including frequency and run times.
     - Example schema:
       - `template_id` (Primary Key): Refers to the ID of the self-service template.
       - `schedule_frequency`: Frequency of execution (e.g., daily, weekly, monthly).
       - `next_run_time`: The next scheduled execution time for the template.
       - `user_id`: Owner of the template for authorization and tracking.

---

### 3. **COWLA JOB**
   - **Purpose:** Handles the insertion of scheduling requests into the `Job Request` table.
   - **Flow:**
     - Based on the schedule frequency and next run time from the **Self-Service Schedule Table**, the COWLA JOB picks the appropriate template.
     - Inserts records into the `Job Request` table with `Batch Type ID = 4` for self-service templates.
     - Populates the `JOB INPUT` column with additional information required for processing the template.
     - Example of `JOB INPUT`:  
       ```json
       {
         "templateId": 123,
         "dynamicMapping": true,
         "additionalConfig": { ... }
       }
       ```

---

### 4. **Mapping Table**
   - **Purpose:** Tracks and maps scheduled templates to their corresponding job request IDs.
   - **Table Schema:**
     - `template_id` (Primary Key): Unique ID for the self-service template.
     - `job_request_id`: ID of the corresponding job request in the `Job Request` table.
     - `schedule_date`: The date and time when the job is scheduled for execution.

---

### 5. **Batch Processing (BGP EXPORT)**
   - **Purpose:** Extend the existing batch export framework to handle self-service requests.
   - **Details:**
     - The batch process picks up requests with `Batch Type ID = 4` from the `Job Request` table.
     - Leverages the existing `processExportRequest` function to process these requests.
     - Final output is saved in the `JOB OUTPUT` column of the `Job Request` table.

---

### 6. **Modifications to `processExportRequest`**
   - **Objective:** Enhance the function to support self-service templates with dynamic column mappings and data types.
   - **Changes:**
     - Introduce a **flag** in the `JOB INPUT` column to identify self-service templates.
     - Handle dynamic column configurations and data type mappings based on the input JSON structure from the `JOB INPUT` column.
     - Example:
       ```json
       {
         "dynamicColumns": [
           { "columnName": "UserName", "dataType": "string" },
           { "columnName": "LoginCount", "dataType": "integer" }
         ]
       }
       ```
     - Adjust data extraction and formatting logic accordingly.

---

## **Process Flow**

1. **Template Creation:**
   - User creates a self-service template with desired query column details and saves it in the **Self-Service Template** module.

2. **Schedule Definition:**
   - User schedules the template by specifying the frequency and other configurations in the **Self-Service Schedule Table**.

3. **Job Scheduling:**
   - The COWLA JOB picks up the template from the schedule table based on its frequency and inserts a request in the `Job Request` table.

4. **Mapping Table Update:**
   - The system maps the `template_id` to the `job_request_id` and logs the `schedule_date`.

5. **Batch Processing:**
   - The batch process picks up the request and invokes `processExportRequest`.

6. **Export Execution:**
   - The `processExportRequest` function handles the export based on the dynamic column and data type mappings from `JOB INPUT`.

7. **Output Storage:**
   - The final output is saved in the `JOB OUTPUT` column.

---

## **Points to Be Discussed**

### 1. **Maximum Number of Records to Be Processed at a Time**
   - Define the upper limit for records in a single job to balance performance and usability.
   - Considerations include:
     - System resource constraints (CPU, memory, database load).
     - Output file format limitations (e.g., Excel row limit of ~1,048,576 rows).
     - Performance impact on concurrent jobs and user expectations.

### 2. **Error Handling and Recovery**
   - Strategies for retrying or recovering failed jobs, especially for large datasets.
   - Mechanisms for notifying users of failures or partial success.

### 3. **Dynamic Template Validation**
   - How to validate user-defined templates to ensure correct mappings of columns and data types.
   - Processes for handling invalid templates.

### 4. **Scheduling and Prioritization**
   - Rules for handling overlapping schedules or simultaneous requests.
   - Mechanisms for prioritizing high-importance requests over others.

### 5. **Security and Access Control**
   - Measures to ensure users can only access their authorized templates and data.
   - Encryption and data protection strategies for sensitive outputs.

### 6. **Output File Splitting**
   - Options for splitting large datasets across multiple files or sheets.
   - File naming conventions and delivery mechanisms for split outputs.

### 7. **Performance Monitoring and Alerts**
   - Tools and metrics to monitor the performance of the report scheduler.
   - Alerting mechanisms for long-running or stalled jobs.

---

## **Advantages**
- Leverages the existing export framework, minimizing development effort.
- Provides flexibility for end-users to define custom templates.
- Scalable and modular design for future enhancements.

---

## **Future Considerations**
1. **Error Handling:** Add robust mechanisms to log and retry failed jobs.
2. **Audit Trail:** Maintain logs for mapping table updates and export processing.
3. **Performance Optimization:** Optimize the batch process for handling a large volume of requests.
4. **UI Enhancements:** Provide a user-friendly interface for submitting and monitoring requests.

---
