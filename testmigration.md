# Complete Vitest Migration & Troubleshooting Handbook

## Table of Contents
1. Initial Migration Steps
2. Configuration Setup
3. Common Migration Issues & Solutions
4. Test Case Modifications
5. Console Output Control
6. Performance Optimization
7. Advanced Testing Patterns
8. Best Practices & Recommendations

## 1. Initial Migration Steps

### 1.1 Dependency Updates
```bash
# Remove Jest dependencies
npm remove jest @types/jest jest-environment-jsdom babel-jest @testing-library/jest-dom

# Install Vitest dependencies
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom @vitest/coverage-c8 happy-dom @testing-library/user-event @vitest/ui msw
```

### 1.2 Basic Configuration
```js
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    css: true,
    reporters: ['verbose'],
    coverage: {
      provider: 'c8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/setupTests.ts',
      ]
    },
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    testTimeout: 30000
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
```

## 2. Configuration Setup

### 2.1 Setup Files
```ts
// src/setupTests.ts
import '@testing-library/jest-dom'
import { expect, afterEach, beforeAll, afterAll } from 'vitest'
import { cleanup } from '@testing-library/react'
import matchers from '@testing-library/jest-dom/matchers'
import { setupServer } from 'msw/node'

// Extend matchers
expect.extend(matchers)

// Global cleanup
afterEach(() => {
  cleanup()
})

// Suppress specific console messages
const originalConsoleError = console.error
const originalConsoleWarn = console.warn

console.error = (...args) => {
  if (
    args[0]?.includes('Warning:') || 
    args[0]?.includes('React does not recognize') ||
    args[0]?.includes('Invalid DOM property')
  ) return
  originalConsoleError(...args)
}

console.warn = (...args) => {
  if (args[0]?.includes('Warning:')) return
  originalConsoleWarn(...args)
}

// Optional: MSW Setup
export const server = setupServer()
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterAll(() => server.close())
afterEach(() => server.resetHandlers())
```

### 2.2 Package.json Scripts
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:failed": "vitest --changed",
    "test:silent": "vitest --reporter=basic"
  }
}
```

## 3. Common Migration Issues & Solutions

### 3.1 Timer Mocks
```ts
// Old (Jest)
jest.useFakeTimers()
jest.advanceTimersByTime(1000)
jest.runAllTimers()

// New (Vitest)
vi.useFakeTimers()
vi.advanceTimersByTime(1000)
vi.runAllTimers()
```

### 3.2 Module Mocks
```ts
// Global mock
vi.mock('@/services/api', () => ({
  default: {
    getData: vi.fn()
  }
}))

// Local mock with reset
beforeEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
})
```

### 3.3 Long Running Tests
```ts
// Global timeout
test.setTimeout(30000)

// Individual test timeout
test('long operation', async () => {
  // test code
}, { timeout: 30000 })

// Suite timeout
describe('long suite', () => {
  beforeAll(() => {
    test.setTimeout(30000)
  })
})
```

## 4. Test Case Modifications

### 4.1 Async Tests
```ts
// Proper async handling
test('async operation', async () => {
  const result = await asyncOperation()
  expect(result).toBeDefined()
})

// With cleanup
test('with cleanup', async () => {
  try {
    await someOperation()
  } finally {
    await cleanup()
  }
})
```

### 4.2 Component Testing
```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

test('component interaction', async () => {
  const user = userEvent.setup()
  
  render(<MyComponent />)
  
  await user.click(screen.getByRole('button'))
  
  expect(await screen.findByText('Result')).toBeInTheDocument()
})
```

## 5. Console Output Control

### 5.1 Suppress Console Output
```ts
// In setup file or individual test
const originalLog = console.log
const originalError = console.error
const originalWarn = console.warn

beforeAll(() => {
  console.log = vi.fn()
  console.error = vi.fn()
  console.warn = vi.fn()
})

afterAll(() => {
  console.log = originalLog
  console.error = originalError
  console.warn = originalWarn
})
```

### 5.2 Custom Reporter
```ts
// reporters/customReporter.ts
export default {
  onTestFail(test, error) {
    console.log(`❌ ${test.name}`)
    console.log(error.message)
  },
  onFinished(files, errors) {
    if (errors.length > 0) {
      console.log('\nFailed Tests:')
      errors.forEach(error => {
        console.log(`- ${error.file}: ${error.message}`)
      })
    }
  }
}

// vite.config.ts
import customReporter from './reporters/customReporter'

export default defineConfig({
  test: {
    reporters: [customReporter]
  }
})
```

## 6. Performance Optimization

### 6.1 Parallel Execution
```ts
// vite.config.ts
export default defineConfig({
  test: {
    threads: true,
    maxThreads: 4,
    minThreads: 1,
    isolate: true,
    sequence: {
      shuffle: true
    }
  }
})
```

### 6.2 Test Grouping
```ts
// Group related tests
describe.concurrent('parallel suite', () => {
  test.concurrent('test 1', async () => {})
  test.concurrent('test 2', async () => {})
})

// Sequential when needed
describe.sequential('sequential suite', () => {
  test('test 1', () => {})
  test('test 2', () => {})
})
```

## 7. Advanced Testing Patterns

### 7.1 Custom Test Utils
```tsx
// test-utils.tsx
import { render } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

const AllTheProviders = ({ children }) => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </BrowserRouter>
  )
}

const customRender = (ui: React.ReactElement, options = {}) =>
  render(ui, {
    wrapper: AllTheProviders,
    ...options
  })

export * from '@testing-library/react'
export { customRender as render }
```

### 7.2 Snapshot Testing
```tsx
// Component snapshot
test('matches snapshot', () => {
  const { container } = render(<MyComponent />)
  expect(container).toMatchSnapshot()
})

// Custom snapshot serializer
expect.addSnapshotSerializer({
  test: (val) => typeof val === 'object',
  print: (val) => JSON.stringify(val, null, 2)
})
```

## 8. Best Practices & Recommendations

### 8.1 File Organization
```
src/
  __tests__/
    components/
      MyComponent.test.tsx
    utils/
      helpers.test.ts
  __mocks__/
    fileMock.js
    styleMock.js
  setupTests.ts
```

### 8.2 Testing Patterns
```tsx
// Arrange-Act-Assert pattern
test('component behavior', () => {
  // Arrange
  const props = { title: 'Test' }
  
  // Act
  render(<MyComponent {...props} />)
  
  // Assert
  expect(screen.getByText('Test')).toBeInTheDocument()
})

// Data-Test attributes
const { getByTestId } = render(
  <div data-testid="custom-element">
    Custom Element
  </div>
)
expect(getByTestId('custom-element')).toBeInTheDocument()
```

### 8.3 Error Handling
```tsx
// Error boundary testing
test('handles errors', () => {
  const spy = vi.spyOn(console, 'error')
  spy.mockImplementation(() => {})
  
  render(
    <ErrorBoundary>
      <ComponentThatThrows />
    </ErrorBoundary>
  )
  
  expect(screen.getByText('Error Message')).toBeInTheDocument()
  spy.mockRestore()
})
```

### 8.4 Command Line Filters
```bash
# Run specific tests
vitest MyComponent
vitest -t "should render"

# Run failed tests only
vitest --changed

# Run with minimal output
vitest --reporter=basic

# Run with UI
vitest --ui
```