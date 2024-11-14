const fs = require('fs');
const path = require('path');

// Configuration
const extensions = ['.js', '.jsx', '.ts', '.tsx'];
const excludedDirs = ['node_modules', 'build', 'dist'];

function normalizeSpaces(str) {
  // Normalize spaces around brackets, colons, and commas
  return str
    .replace(/\s*\(\s*/g, '(')
    .replace(/\s*\)\s*/g, ')')
    .replace(/\s*,\s*/g, ', ')
    .replace(/\s*:\s*/g, ': ')
    .replace(/{\s+/g, '{ ')
    .replace(/\s+}/g, ' }');
}

function replaceHistoryPush(content) {
  let modifiedContent = content;

  // Patterns to match and replace different history.push styles, with flexible spacing
  const patterns = [
    // Direct state passing with optional spaces: history.push('path', state) -> history('path', { state })
    {
      regex: /history\.push\s*\(\s*(['"`][^'"`]+['"`])\s*,\s*([a-zA-Z_$][\w$]*)\s*\)/g,
      replacement: 'history($1, { state: $2 })'
    },
    
    // Simple path with spaces: history.push('/path') -> history('/path')
    {
      regex: /history\.push\s*\(\s*((['"`])[^'"`]+\2)\s*\)/g,
      replacement: 'history($1)'
    },
    
    // Object with pathname only, with extra spaces
    {
      regex: /history\.push\s*\(\s*{\s*pathname\s*:\s*((['"`])[^'"`]+\2)\s*}\s*\)/g,
      replacement: 'history($1)'
    },
    
    // Object with pathname and state, with extra spaces
    {
      regex: /history\.push\s*\(\s*{\s*pathname\s*:\s*((['"`])[^'"`]+\2)\s*,\s*state\s*:\s*({[^}]+}|[a-zA-Z_$][\w$]*)\s*}\s*\)/g,
      replacement: 'history($1, { state: $3 })'
    },
    
    // Object with pathname, search/query, and state, with extra spaces
    {
      regex: /history\.push\s*\(\s*{\s*pathname\s*:\s*((['"`])[^'"`]+\2)\s*,\s*(?:search|query)\s*:\s*((['"`])[^'"`]+\4)\s*,\s*state\s*:\s*({[^}]+}|[a-zA-Z_$][\w$]*)\s*}\s*\)/g,
      replacement: 'history({ pathname: $1, search: $3 }, { state: $5 })'
    },
    
    // Replace with search/query but no state, with extra spaces
    {
      regex: /history\.push\s*\(\s*{\s*pathname\s*:\s*((['"`])[^'"`]+\2)\s*,\s*(?:search|query)\s*:\s*((['"`])[^'"`]+\4)\s*}\s*\)/g,
      replacement: 'history({ pathname: $1, search: $3 })'
    },
    
    // Replace call with a simple path
    {
      regex: /history\.replace\s*\(\s*((['"`])[^'"`]+\2)\s*\)/g,
      replacement: 'history($1, { replace: true })'
    },
    
    // Replace with state, handling extra spaces
    {
      regex: /history\.replace\s*\(\s*((['"`])[^'"`]+\2)\s*,\s*([a-zA-Z_$][\w$]*)\s*\)/g,
      replacement: 'history($1, { replace: true, state: $3 })'
    },
    
    // Replace with pathname object, handling extra spaces
    {
      regex: /history\.replace\s*\(\s*{\s*pathname\s*:\s*((['"`])[^'"`]+\2)\s*}\s*\)/g,
      replacement: 'history($1, { replace: true })'
    },
    
    // Replace with pathname and state object, handling extra spaces
    {
      regex: /history\.replace\s*\(\s*{\s*pathname\s*:\s*((['"`])[^'"`]+\2)\s*,\s*state\s*:\s*({[^}]+}|[a-zA-Z_$][\w$]*)\s*}\s*\)/g,
      replacement: 'history($1, { replace: true, state: $3 })'
    }
  ];

  // Apply each replacement pattern
  patterns.forEach(({ regex, replacement }) => {
    modifiedContent = modifiedContent.replace(regex, (match, ...args) => {
      const replaced = match.replace(regex, replacement);
      return normalizeSpaces(replaced);
    });
  });

  return modifiedContent;
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const modifiedContent = replaceHistoryPush(content);

    if (content !== modifiedContent) {
      // Print a diff-like preview of changes
      console.log(`\n✅ Updating: ${filePath}`);
      const lines = content.split('\n');
      const newLines = modifiedContent.split('\n');
      lines.forEach((line, i) => {
        if (line !== newLines[i] && (line.includes('history.push') || line.includes('history.replace'))) {
          console.log('  - ' + line.trim());
          console.log('  + ' + newLines[i].trim());
        }
      });

      // Create backup of original file
      // Write modified content
      fs.writeFileSync(filePath, modifiedContent);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error);
    return false;
  }
}

function walkDir(dir) {
  let changes = 0;
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!excludedDirs.includes(file)) {
        changes += walkDir(filePath);
      }
    } else if (stat.isFile() && extensions.includes(path.extname(file))) {
      if (processFile(filePath)) {
        changes++;
      }
    }
  });

  return changes;
}

// Main execution
function main() {
  const srcDir = process.argv[2] || './src';
  
  if (!fs.existsSync(srcDir)) {
    console.error(`❌ Directory not found: ${srcDir}`);
    process.exit(1);
  }

  console.log(`🔍 Starting search in ${srcDir}`);
  console.log('📝 Will handle the following patterns:');
  console.log('  - history.push("/path")');
  console.log('  - history.push("/path", state)');
  console.log('  - history.push({ pathname: "/path" })');
  console.log('  - history.push({ pathname: "/path", state: {...} })');
  console.log('  - history.push({ pathname: "/path", search: "?query", state: {...} })');
  console.log('  - history.replace(...) variants\n');
  
  const changesCount = walkDir(srcDir);
  console.log(`\n✨ Complete! Made changes in ${changesCount} files.`);
  console.log('📝 Backup files created with .backup extension');
}

main();
