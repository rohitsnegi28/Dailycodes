If the update operation on your `userid` column is taking more than 30 minutes, there are several factors to consider that could help improve performance:

### 1. **Indexing Strategy:**
   - Ensure that the `userid` column is indexed properly. Since `userid` is a unique column, having it indexed as a unique non-clustered index should help. However, if the update operation involves a large number of rows, the index might cause some overhead.
   - Consider temporarily dropping the index on the `userid` column, performing the update, and then re-creating the index afterward. This avoids the overhead of updating the index for each row individually.

### 2. **Batching the Update:**
   - Instead of updating all rows in one go, split the update into smaller batches. This reduces the transaction log size and can prevent locking issues.
   - For example:
     ```sql
     SET ROWCOUNT 1000;

     WHILE 1=1
     BEGIN
         UPDATE user
         SET userid = <new_value>
         WHERE <condition>
         AND id NOT IN (<exclude_ids>)
     
         IF @@ROWCOUNT = 0 BREAK
     END

     SET ROWCOUNT 0;
     ```

### 3. **Check for Locking/Blocking:**
   - Ensure that no other long-running transactions or locks are causing delays. You can use SQL Server's `sp_who2` or other monitoring tools to check for locking/blocking issues.
   - Consider using `NOLOCK` or `READ UNCOMMITTED` isolation levels during the update if data consistency is not a critical concern.

### 4. **Update Strategy:**
   - If the update involves calculating the new `userid` value based on a complex query, consider simplifying the calculation or precomputing the values in a temporary table before updating.

### 5. **Minimize Logging:**
   - If you're using SQL Server, consider switching to bulk-logged or simple recovery mode if possible, during the update operation, to minimize transaction log usage. However, be aware that this will affect your ability to recover to a specific point in time.

### 6. **Parallelism:**
   - If your database server supports it, consider using parallelism for the update operation to utilize multiple CPU cores.

### 7. **Avoid Unnecessary Indexes on Columns Being Updated:**
   - Ensure that there are no unnecessary indexes on the `userid` column or any other column involved in the update that might be causing additional overhead.

### Example Query:
```sql
-- Temporarily drop index
DROP INDEX idx_user_userid ON user;

-- Perform update in batches
DECLARE @BatchSize INT = 1000;
DECLARE @RowCount INT = 1;

WHILE @RowCount > 0
BEGIN
    UPDATE TOP (@BatchSize) user
    SET userid = <new_value>
    WHERE <condition>
    AND id NOT IN (<exclude_ids>);

    SET @RowCount = @@ROWCOUNT;
END

-- Recreate index
CREATE UNIQUE NONCLUSTERED INDEX idx_user_userid ON user (userid);
```

### Additional Considerations:
- **Database Maintenance**: Ensure that your database statistics are up-to-date and that regular maintenance (e.g., index rebuilding/reorganizing) is performed.
- **Hardware Resources**: Check if your server is under heavy load or if there are any resource constraints (e.g., CPU, Memory, I/O).

Implementing these strategies should help reduce the time taken for your update operation.