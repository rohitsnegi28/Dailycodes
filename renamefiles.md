Here’s a Bash script that renames all .js files to .jsx inside the src folder, excluding any test files (e.g., files ending with .test.js):

	1.	Create a Bash script (e.g., rename-files.sh) in the root of your project with the following content:

#!/bin/bash

# Directory to search for files
SRC_DIR="./src"

# Find all .js files, excluding .test.js files, and rename them to .jsx
find "$SRC_DIR" -type f -name "*.js" ! -name "*.test.js" | while read -r FILE; do
    NEW_FILE="${FILE%.js}.jsx"
    mv "$FILE" "$NEW_FILE"
    echo "Renamed: $FILE -> $NEW_FILE"
done

echo "Renaming completed."


	2.	Make the script executable:
Run the following command to make the script executable:

chmod +x rename-files.sh


	3.	Run the script:
Execute the script:

./rename-files.sh



This script will find all .js files within the src directory, excluding files that end with .test.js, and rename them to .jsx. It will print out each renamed file as it goes.

Let me know if you need further assistance!