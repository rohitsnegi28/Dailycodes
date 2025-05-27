Memory heap errors in Vitest when running large test suites are common and can be tricky to debug. Here's a systematic approach to identify and fix the issue:

## Immediate Configuration Fixes

First, try these Vitest configuration adjustments in your `vitest.config.js`:

```javascript
export default defineConfig({
  test: {
    // Limit concurrent tests to reduce memory pressure
    maxConcurrency: 5,
    
    // Enable isolation to prevent memory leaks between tests
    isolate: true,
    
    // Increase memory limit for Node.js
    pool: 'forks',
    poolOptions: {
      forks: {
        execArgv: ['--max-old-space-size=8192'] // 8GB heap
      }
    },
    
    // Force garbage collection between test files
    forceRerunTriggers: ['**/package.json/**', '**/vitest.config.*/**']
  }
})
```

## Debugging Strategy

### 1. Binary Search Approach
Run tests in smaller batches to isolate problematic files:

```bash
# Split your tests into groups
vitest run src/components/**/*.test.js
vitest run src/utils/**/*.test.js
vitest run src/hooks/**/*.test.js

# Once you find the problematic group, split it further
vitest run src/components/auth/**/*.test.js
vitest run src/components/ui/**/*.test.js
```

### 2. Use Memory Profiling
Add memory monitoring to identify which tests consume the most memory:

```bash
# Run with Node.js memory profiling
node --inspect --max-old-space-size=8192 ./node_modules/.bin/vitest run

# Or use built-in memory reporting
vitest run --reporter=verbose --reporter=json --outputFile=test-results.json
```

### 3. Enable Detailed Logging
Create a custom setup file to track memory usage:

```javascript
// vitest.setup.js
beforeEach(() => {
  if (process.env.NODE_ENV === 'test') {
    const used = process.memoryUsage();
    console.log(`Memory before test: ${Math.round(used.heapUsed / 1024 / 1024)} MB`);
  }
});

afterEach(() => {
  if (process.env.NODE_ENV === 'test') {
    const used = process.memoryUsage();
    console.log(`Memory after test: ${Math.round(used.heapUsed / 1024 / 1024)} MB`);
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  }
});
```

## Common Memory Leak Patterns to Check

### 1. DOM Cleanup Issues
```javascript
// Bad - components not properly cleaned up
afterEach(() => {
  // Missing cleanup
});

// Good - proper cleanup
afterEach(() => {
  cleanup(); // from @testing-library/react
  vi.clearAllMocks();
  vi.restoreAllMocks();
});
```

### 2. Event Listeners
```javascript
// Check for unremoved event listeners
afterEach(() => {
  // Remove any global event listeners added in tests
  document.removeEventListener('click', mockHandler);
  window.removeEventListener('resize', mockResizeHandler);
});
```

### 3. Timers and Intervals
```javascript
// Make sure all timers are cleared
afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers(); // if you're using fake timers
});
```

### 4. Large Mock Data
```javascript
// Avoid keeping large objects in memory
afterEach(() => {
  // Clear large mock data
  vi.clearAllMocks();
  
  // If you have large test fixtures, null them out
  largeMockData = null;
});
```

## Running Tests with Memory Constraints

Try running tests with different strategies:

```bash
# Run tests sequentially (slower but uses less memory)
vitest run --no-threads

# Run with limited workers
vitest run --threads --maxWorkers=2

# Run specific test patterns to isolate issues
vitest run --testPathPattern="components" --verbose
```

## Advanced Debugging

### 1. Heap Snapshots
Use Node.js heap snapshots to see what's consuming memory:

```javascript
// Add to a test file temporarily
test('memory snapshot', () => {
  if (global.gc) global.gc();
  
  const v8 = require('v8');
  const snapshot = v8.writeHeapSnapshot();
  console.log('Heap snapshot written to:', snapshot);
});
```

### 2. Process Memory Monitoring
Create a script to monitor memory during test runs:

```javascript
// monitor-memory.js
const { spawn } = require('child_process');

const child = spawn('vitest', ['run'], { stdio: 'inherit' });

const interval = setInterval(() => {
  const used = process.memoryUsage();
  console.log(`Memory: ${Math.round(used.heapUsed / 1024 / 1024)} MB`);
}, 1000);

child.on('close', () => {
  clearInterval(interval);
});
```

Start with the configuration changes and binary search approach - this usually helps identify the problematic test files quickly. The key is to run tests in smaller, manageable chunks until you isolate the specific files causing memory issues.