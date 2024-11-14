# React Router History Migration Script

This script helps you migrate from the deprecated `history.push()` to the new navigation system in React Router v6. It automatically updates your codebase while maintaining functionality and creating backups of modified files.

## Features

- ✨ Converts all `history.push` and `history.replace` patterns to the new format
- 🔍 Handles various navigation patterns including pathname, state, and search params
- 🎨 Normalizes spacing and formatting
- 💾 Creates backups of modified files
- 🚫 Skips node_modules, build, and dist directories
- 📝 Shows preview of changes

## Installation

1. Create a new file named `replace-history-push.js` in your project root
2. Copy the script content below
3. Ensure you have Node.js installed

## Script

```javascript
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
    // Direct state passing: history.push('/', state) -> history('/', { state })
    {
      regex: /history\.push\s*\(\s*(['"`][^'"`]+['"`])\s*,\s*([a-zA-Z][a-zA-Z0-9]*)\s*\)/g,
      replacement: 'history($1, { state: $2 })'
    },
    
    // Simple path: history.push('/path') -> history('/path')
    {
      regex: /history\.push\s*\(\s*((['"`])[^'"`]+\2)\s*\)/g,
      replacement: 'history($1)'
    },
    
    // Object with pathname only
    {
      regex: /history\.push\s*\(\s*{\s*pathname:\s*((['"`])[^'"`]+\2)\s*}\s*\)/g,
      replacement: 'history($1)'
    },
    
    // Object with pathname and state
    {
      regex: /history\.push\s*\(\s*{\s*pathname:\s*((['"`])[^'"`]+\2)\s*,\s*state:\s*({[^}]+}|[a-zA-Z][a-zA-Z0-9]*)\s*}\s*\)/g,
      replacement: 'history($1, { state: $3 })'
    },
    
    // Object with pathname, search/query and state
    {
      regex: /history\.push\s*\(\s*{\s*pathname:\s*((['"`])[^'"`]+\2)\s*,\s*(?:search|query):\s*((['"`])[^'"`]+\4)\s*,\s*state:\s*({[^}]+}|[a-zA-Z][a-zA-Z0-9]*)\s*}\s*\)/g,
      replacement: 'history({ pathname: $1, search: $3 }, { state: $5 })'
    },
    
    // Replace with search/query but no state
    {
      regex: /history\.push\s*\(\s*{\s*pathname:\s*((['"`])[^'"`]+\2)\s*,\s*(?:search|query):\s*((['"`])[^'"`]+\4)\s*}\s*\)/g,
      replacement: 'history({ pathname: $1, search: $3 })'
    },
    
    // Replace variants
    {
      regex: /history\.replace\s*\(\s*((['"`])[^'"`]+\2)\s*\)/g,
      replacement: 'history($1, { replace: true })'
    },
    
    // Replace with state
    {
      regex: /history\.replace\s*\(\s*((['"`])[^'"`]+\2)\s*,\s*([a-zA-Z][a-zA-Z0-9]*)\s*\)/g,
      replacement: 'history($1, { replace: true, state: $3 })'
    },
    
    // Replace with object
    {
      regex: /history\.replace\s*\(\s*{\s*pathname:\s*((['"`])[^'"`]+\2)\s*}\s*\)/g,
      replacement: 'history($1, { replace: true })'
    },
    
    // Replace with pathname and state
    {
      regex: /history\.replace\s*\(\s*{\s*pathname:\s*((['"`])[^'"`]+\2)\s*,\s*state:\s*({[^}]+}|[a-zA-Z][a-zA-Z0-9]*)\s*}\s*\)/g,
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
```

## Usage

Run the script using Node.js:

```bash
node replace-history-push.js ./src
```

Replace `./src` with the path to your source directory if different.

## Supported Patterns

### Basic Navigation

```javascript
// Before
history.push('/path')

// After
history('/path')
```

### Navigation with State

```javascript
// Before
history.push('/', state)

// After
history('/', { state: state })
```

### Object Pattern

```javascript
// Before
history.push({ pathname: '/path' })

// After
history('/path')
```

### Object with State

```javascript
// Before
history.push({ 
  pathname: '/path',
  state: { id: 1 }
})

// After
history('/path', { 
  state: { id: 1 }
})
```

### With Search/Query Parameters

```javascript
// Before
history.push({ 
  pathname: '/path',
  search: '?id=1',
  state: { data: 'test' }
})

// After
history(
  { pathname: '/path', search: '?id=1' },
  { state: { data: 'test' }}
)
```

### Replace Patterns

```javascript
// Before
history.replace('/path')
history.replace('/path', state)

// After
history('/path', { replace: true })
history('/path', { replace: true, state: state })
```

## Backup and Safety

- The script creates `.backup` files for all modified files
- Original files are preserved with `.backup` extension
- You can review changes before committing them
- The script shows a preview of changes as they're made

## Preview of Changes

The script will show you what changes it's making:

```
✅ Updating: src/components/Navigation.js
  - history.push('/dashboard',state)
  + history('/dashboard', { state: state })
```

## Error Handling

- The script checks if the directory exists
- Errors are logged with file paths
- Process continues even if individual files fail
- Non-JavaScript/TypeScript files are ignored

## After Migration

1. Review the changes in your code
2. Test your application thoroughly
3. Remove backup files once satisfied
4. Update your React Router dependencies if needed

## Best Practices

1. Run the script on a clean git branch
2. Review changes before committing
3. Test thoroughly after migration
4. Keep backup files until testing is complete
5. Use version control for safety

## Note

This script is part of upgrading to React Router v6. Make sure you've updated your React Router dependencies and made other necessary changes for v6 compatibility.

## Support

If you encounter any issues or need additional patterns supported, you can:
1. Check the backup files to verify changes
2. Modify the script's regex patterns
3. Run the script again on specific directories

Remember to always backup your code before running automation scripts!
