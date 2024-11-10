const fs = require('fs');
const path = require('path');

// Specify the import line you want to check/add
const importLine = "import '@testing-library/jest-dom';";
const testFileExtension = '.test.jsx';
const targetFolder = path.join(process.cwd(), 'src');

// Recursive function to find .test.jsx files in the src folder
function findTestFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      findTestFiles(filePath, fileList);
    } else if (file.endsWith(testFileExtension)) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

// Function to check and add the import line in the correct order if necessary
function ensureImportLineInFile(file) {
  const fileContent = fs.readFileSync(file, 'utf-8');

  if (!fileContent.includes(importLine)) {
    // Split lines and find the last import line
    const lines = fileContent.split('\n');
    const lastImportIndex = lines.reduce((index, line, i) => {
      return line.startsWith('import ') ? i : index;
    }, -1);

    // Insert the import line after the last import statement
    lines.splice(lastImportIndex + 1, 0, importLine);
    const updatedContent = lines.join('\n');

    fs.writeFileSync(file, updatedContent, 'utf-8');
    console.log(`Added import line to ${file}`);
  } else {
    console.log(`Import line already present in ${file}`);
  }
}

// Run script
if (fs.existsSync(targetFolder)) {
  const testFiles = findTestFiles(targetFolder);
  testFiles.forEach(ensureImportLineInFile);
} else {
  console.error(`The folder ${targetFolder} does not exist.`);
}