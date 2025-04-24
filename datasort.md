To determine the ordering of data in both IBM DB2 and Microsoft SQL Server environments:

### For IBM DB2:

1. **Check the clustering key**:
   ```sql
   SELECT INDNAME, INDSCHEMA, TBNAME, TBCREATOR, UNIQUERULE, INDEXTYPE
   FROM SYSCAT.INDEXES
   WHERE TBNAME = 'YOUR_TABLE_NAME'
   AND INDEXTYPE = 'CLUS';
   ```

2. **Examine the indexes**:
   ```sql
   SELECT * FROM SYSIBM.SYSINDEXES 
   WHERE TBNAME = 'YOUR_TABLE_NAME';
   ```

3. **Check table definition**:
   ```sql
   DESCRIBE TABLE YOUR_TABLE_NAME;
   ```

### For Microsoft SQL Server:

1. **Check the clustered index**:
   ```sql
   SELECT i.name AS IndexName, 
          OBJECT_NAME(ic.OBJECT_ID) AS TableName,
          COL_NAME(ic.OBJECT_ID, ic.column_id) AS ColumnName
   FROM sys.indexes AS i
   INNER JOIN sys.index_columns AS ic 
       ON i.OBJECT_ID = ic.OBJECT_ID AND i.index_id = ic.index_id
   WHERE OBJECT_NAME(i.OBJECT_ID) = 'YOUR_TABLE_NAME'
   AND i.type_desc = 'CLUSTERED'
   ORDER BY ic.key_ordinal;
   ```

2. **Check the physical storage order**:
   ```sql
   DBCC IND('YourDatabaseName', 'YOUR_TABLE_NAME', -1);
   ```

### Testing approach:

1. Run identical queries without ORDER BY in both systems:
   ```sql
   SELECT * FROM YOUR_TABLE_NAME;
   ```

2. Export the results to compare the ordering differences

3. For a permanent solution, always use explicit ORDER BY clauses that match your business requirements:
   ```sql
   SELECT * FROM YOUR_TABLE_NAME
   ORDER BY Column1, Column2;
   ```

Remember that without an explicit ORDER BY clause, neither system guarantees any particular ordering of results. The physical storage of data (determined by clustered indexes or physical insertion order) often influences the default ordering, but this should never be relied upon.