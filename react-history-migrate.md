Here’s a simplified and cleaner version you can try copying directly. You may want to format it further after pasting into GitHub.

React Router v6 Migration Script for history.push Syntax

This script helps migrate from React Router v5 syntax to v6 by updating history.push calls across your project. The migration changes history.push to the new useNavigate syntax, simplifying your transition to React Router v6.

Prerequisites

	•	Node.js installed.
	•	Backup your project before running the script to avoid unintended changes.

Instructions

Step 1: Save the Script

Save this script in your project root directory as migrateHistoryPush.js:

const fs = require('fs');
const path = require('path');

// Specify the root directory of your project
const projectRoot = './src'; // Update to your project's source folder

// Regex to match `history.push({ pathname: '...', state: { ... } })`
const historyPushRegex = /history\.push\(\s*\{\s*pathname:\s*['"`](.*?)['"`]\s*,\s*state:\s*(\{.*?\})\s*\}\s*\)/g;

// Function to read files in a directory
function readFilesRecursively(directory) {
  const files = fs.readdirSync(directory);
  files.forEach(file => {
    const filePath = path.join(directory, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      readFilesRecursively(filePath);
    } else if (stat.isFile() && (file.endsWith('.js') || file.endsWith('.jsx'))) {
      let fileContent = fs.readFileSync(filePath, 'utf8');

      fileContent = fileContent.replace(historyPushRegex, (match, pathname, state) => {
        return `history('${pathname}', { state: ${state} })`;
      });

      fs.writeFileSync(filePath, fileContent, 'utf8');
      console.log(`Updated: ${filePath}`);
    }
  });
}

// Run the script
readFilesRecursively(projectRoot);
console.log('Migration completed.');

Step 2: Run the Script

	1.	Navigate to your project root where migrateHistoryPush.js is saved.
	2.	Run the script using Node.js:

node migrateHistoryPush.js



Step 3: Verify Changes

After running, review modified files to ensure correctness. You can use Git to see a diff:

git diff

Important Notes

	•	Supported Files: Only processes .js and .jsx files.
	•	Customization: Update projectRoot in the script if your source folder differs.

This should now be easier to copy and paste. Let me know if this version works for you!