const fs = require('fs');
const path = require('path');

// Specify the root directory of your project
const projectRoot = './src'; // Update to your project's source folder

// Regular expressions to match both patterns of `history.push`
const historyPushObjectRegex = /history\.push\(\s*\{\s*pathname:\s*['"`](.*?)['"`]\s*,\s*state:\s*(\{.*?\})\s*\}\s*\)/g;
const historyPushArgsRegex = /history\.push\(\s*['"`](.*?)['"`]\s*,\s*(\{.*?\})\s*\)/g;

// Function to recursively read files in a directory
function readFilesRecursively(directory) {
  const files = fs.readdirSync(directory);
  files.forEach(file => {
    const filePath = path.join(directory, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Recursively read subdirectories
      readFilesRecursively(filePath);
    } else if (stat.isFile() && (file.endsWith('.js') || file.endsWith('.jsx'))) {
      // Process .js and .jsx files
      let fileContent = fs.readFileSync(filePath, 'utf8');

      // Replace `history.push` with object syntax
      fileContent = fileContent.replace(historyPushObjectRegex, (match, pathname, state) => {
        return `history('${pathname}', { state: ${state} })`;
      });

      // Replace `history.push` with arguments syntax
      fileContent = fileContent.replace(historyPushArgsRegex, (match, pathname, state) => {
        return `history('${pathname}', { state: ${state} })`;
      });

      // Save the modified file
      fs.writeFileSync(filePath, fileContent, 'utf8');
      console.log(`Updated: ${filePath}`);
    }
  });
}

// Run the script
readFilesRecursively(projectRoot);
console.log('Migration completed.');