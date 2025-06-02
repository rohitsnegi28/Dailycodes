#!/bin/bash

# Set base folder path
base_path="/path/to/your/folder"  # <-- Change this

# Output file
output_file="script_list.txt"

# Clear output file if exists
> "$output_file"

# Loop through all files recursively
find "$base_path" -type f | while read filepath; do
  # Get relative path
  relative_path="${filepath#$base_path/}"

  # Convert forward slashes to Windows-style backslashes
  windows_path=$(echo "$relative_path" | sed 's/\//\\/g')

  # Print formatted line
  echo ": r \$(mypath)\\$windows_path" >> "$output_file"
done

echo "File list saved to $output_file"