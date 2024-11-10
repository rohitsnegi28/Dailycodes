Here's a detailed and documented solution for your JSON trimming problem in T-SQL, formatted for inclusion in a markdown file:

# Problem

We have a JSON structure stored in an SQL database column `FILTER_DATA` with the following format:

```json
{
  "param": [
    {
      "values": ["123, 456"]
    },
    {
      "values": ["123", " 456"]
    }
  ]
}
```

Some of the values in the `values` arrays have extra spaces that need to be removed. We need to update the JSON data to trim these spaces.

# Solution

The following T-SQL script updates the `FILTER_DATA` column to remove the extra spaces from the `values` arrays within the nested objects.

```sql
-- Declare a table to use in the example
DECLARE @your_table_name TABLE (FILTER_DATA NVARCHAR(MAX));

-- Insert example data into the table
INSERT INTO @your_table_name (FILTER_DATA)
VALUES ('{"param":[{"values":["123, 456"]},{"values":["123"," 456"]}]}');

-- Update statement to remove spaces from JSON values within nested objects
UPDATE @your_table_name
SET FILTER_DATA = JSON_MODIFY(
    FILTER_DATA,                         -- The original JSON data
    '$.param',                           -- The path in the JSON data to modify
    JSON_QUERY(                          -- Converts the result back to JSON
        '[' + STRING_AGG(
            CONCAT(
                '{"values":[',           -- Concatenates the beginning of the JSON object
                STRING_AGG(
                    CONCAT('"', TRIM(JSON_VALUE(val.value, '$')), '"'), ','
                ),                      -- Concatenates each trimmed value with double quotes
                ']}'
            ), 
        ',') + ']'                      -- Concatenates all objects into a JSON array format
    )
)
FROM @your_table_name
CROSS APPLY OPENJSON(FILTER_DATA, '$.param') AS obj
CROSS APPLY OPENJSON(obj.value, '$.values') AS val;

-- Select the updated data to see the result
SELECT * FROM @your_table_name;
```

### Explanation:

1. **Declaration and Example Data:**
   ```sql
   DECLARE @your_table_name TABLE (FILTER_DATA NVARCHAR(MAX));
   
   INSERT INTO @your_table_name (FILTER_DATA)
   VALUES ('{"param":[{"values":["123, 456"]},{"values":["123"," 456"]}]}');
   ```
   This section declares a table variable to simulate your actual table and inserts example data into it.

2. **Update Statement:**
   ```sql
   UPDATE @your_table_name
   SET FILTER_DATA = JSON_MODIFY(
       FILTER_DATA,                         -- The original JSON data
       '$.param',                           -- The path in the JSON data to modify
       JSON_QUERY(                          -- Converts the result back to JSON
           '[' + STRING_AGG(
               CONCAT(
                   '{"values":[',           -- Concatenates the beginning of the JSON object
                   STRING_AGG(
                       CONCAT('"', TRIM(JSON_VALUE(val.value, '$')), '"'), ','
                   ),                      -- Concatenates each trimmed value with double quotes
                   ']}'
               ), 
           ',') + ']'                      -- Concatenates all objects into a JSON array format
       )
   )
   FROM @your_table_name
   CROSS APPLY OPENJSON(FILTER_DATA, '$.param') AS obj
   CROSS APPLY OPENJSON(obj.value, '$.values') AS val;
   ```

   - **`OPENJSON(FILTER_DATA, '$.param') AS obj`**: Extracts each object in the `param` array.
   - **`OPENJSON(obj.value, '$.values') AS val`**: Extracts each value in the `values` array of the current object.
   - **`TRIM(JSON_VALUE(val.value, '$'))`**: Removes the extra spaces from each value.
   - **`STRING_AGG`**: Concatenates the trimmed values back into a JSON array format.
   - **`JSON_MODIFY`**: Updates the `FILTER_DATA` column with the new JSON array containing the trimmed values.

3. **Selecting the Updated Data:**
   ```sql
   SELECT * FROM @your_table_name;
   ```
   This statement selects the updated data to verify the changes.

### Result:

After running the above script, the `FILTER_DATA` column will have the extra spaces removed from the `values` arrays within the nested objects. The updated JSON will look like this:

```json
{
  "param": [
    {
      "values": ["123, 456"]
    },
    {
      "values": ["123", "456"]
    }
  ]
}
```

This solution ensures that all values in the `values` arrays are properly trimmed, maintaining the structure of the original JSON data.
