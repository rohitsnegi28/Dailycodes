const fs = require('fs');
const path = require('path');

const targetFolder = process.argv[2]; // Example: ./src
const outputFile = 'output.txt';

if (!targetFolder) {
  console.error('❌ Please provide a folder path. Usage: node testFilesExtractor.js ./src');
  process.exit(1);
}

const testFilePattern = /\.test\.jsx$/i;

function getTestFiles(dir, collected = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      getTestFiles(fullPath, collected);
    } else if (testFilePattern.test(entry.name)) {
      const relativePath = path.relative(process.cwd(), fullPath).replace(/\\/g, '/');
      collected.push(`'${relativePath}'`);
    }
  }

  return collected;
}

const rootDir = path.resolve(process.cwd(), targetFolder);
const testFiles = getTestFiles(rootDir);

fs.writeFileSync(outputFile, `[${testFiles.join(',\n')}]`, 'utf8');

console.log(`✅ Found ${testFiles.length} .test.jsx files.`);
console.log(`📄 Written to ${outputFile}`);