const fs = require('fs');
const path = require('path');

// Configuration
const extensions = ['.js', '.jsx', '.ts', '.tsx'];
const excludedDirs = ['node_modules', 'build', 'dist'];

function normalizeSpaces(str) {
  // Normalize spaces around brackets and commas
  return str
    .replace(/\s*\(\s*/g, '(')
    .replace(/\s*\)\s*/g, ')')
    .replace(/\s*,\s*/g, ', ')
    .replace(/{\s+/g, '{ ')
    .replace(/\s+}/g, ' }');
}

function replaceHistoryPush(content) {
  let modifiedContent = content;

  // Patterns to match and replace different history.push styles
  const patterns = [
    // Dynamic path variable: history.push(dynamicPath)
    {
      regex: /history\.push\s*\(\s*([a-zA-Z][a-zA-Z0-9_]*(?:\.[a-zA-Z][a-zA-Z0-9_]*)*)\s*\)/g,
      replacement: 'history($1)'
    },
    
    // Dynamic path with state: history.push(dynamicPath, state)
    {
      regex: /history\.push\s*\(\s*([a-zA-Z][a-zA-Z0-9_]*(?:\.[a-zA-Z][a-zA-Z0-9_]*)*)\s*,\s*([a-zA-Z][a-zA-Z0-9_]*)\s*\)/g,
      replacement: 'history($1, { state: $2 })'
    },

    // Multiline object pattern with pathname and state
    {
      regex: /history\.push\s*\(\s*{\s*\n?\s*pathname\s*:\s*((['"`])[^'"`]+\2|[a-zA-Z][a-zA-Z0-9_]*(?:\.[a-zA-Z][a-zA-Z0-9_]*)*)\s*,?\s*\n?\s*(?:state\s*:\s*({[^}]+}|[a-zA-Z][a-zA-Z0-9_]*))?\s*\n?\s*}\s*\)/g,
      replacement: (match, pathname, quote, state) => {
        if (state) {
          return `history(${pathname}, { state: ${state} })`;
        }
        return `history(${pathname})`;
      }
    },

    // Direct state passing: history.push('/', state)
    {
      regex: /history\.push\s*\(\s*(['"`][^'"`]+['"`])\s*,\s*([a-zA-Z][a-zA-Z0-9_]*)\s*\)/g,
      replacement: 'history($1, { state: $2 })'
    },
    
    // Simple path: history.push('/path')
    {
      regex: /history\.push\s*\(\s*((['"`])[^'"`]+\2)\s*\)/g,
      replacement: 'history($1)'
    },
    
    // Object with pathname only
    {
      regex: /history\.push\s*\(\s*{\s*pathname:\s*((['"`])[^'"`]+\2|[a-zA-Z][a-zA-Z0-9_]*(?:\.[a-zA-Z][a-zA-Z0-9_]*)*)\s*}\s*\)/g,
      replacement: 'history($1)'
    },
    
    // Object with pathname and state (single line)
    {
      regex: /history\.push\s*\(\s*{\s*pathname:\s*((['"`])[^'"`]+\2|[a-zA-Z][a-zA-Z0-9_]*(?:\.[a-zA-Z][a-zA-Z0-9_]*)*)\s*,\s*state:\s*({[^}]+}|[a-zA-Z][a-zA-Z0-9_]*)\s*}\s*\)/g,
      replacement: 'history($1, { state: $3 })'
    },
    
    // Object with pathname, search/query and state
    {
      regex: /history\.push\s*\(\s*{\s*pathname:\s*((['"`])[^'"`]+\2|[a-zA-Z][a-zA-Z0-9_]*(?:\.[a-zA-Z][a-zA-Z0-9_]*)*)\s*,\s*(?:search|query):\s*((['"`])[^'"`]+\4)\s*,\s*state:\s*({[^}]+}|[a-zA-Z][a-zA-Z0-9_]*)\s*}\s*\)/g,
      replacement: 'history({ pathname: $1, search: $3 }, { state: $5 })'
    },
    
    // Replace with search/query but no state
    {
      regex: /history\.push\s*\(\s*{\s*pathname:\s*((['"`])[^'"`]+\2|[a-zA-Z][a-zA-Z0-9_]*(?:\.[a-zA-Z][a-zA-Z0-9_]*)*)\s*,\s*(?:search|query):\s*((['"`])[^'"`]+\4)\s*}\s*\)/g,
      replacement: 'history({ pathname: $1, search: $3 })'
    },
    
    // Replace variants
    {
      regex: /history\.replace\s*\(\s*((['"`])[^'"`]+\2|[a-zA-Z][a-zA-Z0-9_]*(?:\.[a-zA-Z][a-zA-Z0-9_]*)*)\s*\)/g,
      replacement: 'history($1, { replace: true })'
    },
    
    // Replace with state
    {
      regex: /history\.replace\s*\(\s*((['"`])[^'"`]+\2|[a-zA-Z][a-zA-Z0-9_]*(?:\.[a-zA-Z][a-zA-Z0-9_]*)*)\s*,\s*([a-zA-Z][a-zA-Z0-9_]*)\s*\)/g,
      replacement: 'history($1, { replace: true, state: $3 })'
    },
    
    // Replace with object
    {
      regex: /history\.replace\s*\(\s*{\s*pathname:\s*((['"`])[^'"`]+\2|[a-zA-Z][a-zA-Z0-9_]*(?:\.[a-zA-Z][a-zA-Z0-9_]*)*)\s*}\s*\)/g,
      replacement: 'history($1, { replace: true })'
    },
    
    // Replace with pathname and state
    {
      regex: /history\.replace\s*\(\s*{\s*pathname:\s*((['"`])[^'"`]+\2|[a-zA-Z][a-zA-Z0-9_]*(?:\.[a-zA-Z][a-zA-Z0-9_]*)*)\s*,\s*state:\s*({[^}]+}|[a-zA-Z][a-zA-Z0-9_]*)\s*}\s*\)/g,
      replacement: 'history($1, { replace: true, state: $3 })'
    }
  ];

  // Apply each replacement pattern
  patterns.forEach(({ regex, replacement }) => {
    modifiedContent = modifiedContent.replace(regex, (match, ...args) => {
      const replaced = typeof replacement === 'function' 
        ? replacement(match, ...args)
        : match.replace(regex, replacement);
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
      let inHistoryBlock = false;
      
      lines.forEach((line, i) => {
        const containsHistory = line.includes('history.push') || line.includes('history.replace');
        if (containsHistory) inHistoryBlock = true;
        
        if (inHistoryBlock) {
          if (line !== newLines[i]) {
            console.log('  - ' + line.trim());
            console.log('  + ' + newLines[i].trim());
          }
          if (line.includes(')')) inHistoryBlock = false;
        }
      });

      // Create backup of original file
      fs.writeFileSync(`${filePath}.backup`, content);
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
  console.log('  - history.push(dynamicPath)');
  console.log('  - history.push("/path", state)');
  console.log('  - history.push({ pathname: "/path" })');
  console.log('  - history.push({ pathname: dynamicPath })');
  console.log('  - history.push({');
  console.log('      pathname: "/path",');
  console.log('      state: {...}');
  console.log('    })');
  console.log('  - history.push({ pathname: "/path", state: {...} })');
  console.log('  - history.push({ pathname: "/path", search: "?query", state: {...} })');
  console.log('  - history.replace(...) variants\n');
  
  const changesCount = walkDir(srcDir);
  console.log(`\n✨ Complete! Made changes in ${changesCount} files.`);
  console.log('📝 Backup files created with .backup extension');
}

main();
