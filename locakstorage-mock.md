

```javascript
import { vi } from 'vitest';

// Create a closure to maintain the store state
const createLocalStorageMock = () => {
  let store = {};
  
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = String(value);
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    key: vi.fn((index) => {
      return Object.keys(store)[index] || null;
    }),
    // Add a getter for length that returns the current store size
    get length() {
      return Object.keys(store).length;
    },
    // For testing: directly access or modify the store
    _getStore: () => store,
    _setStore: (newStore) => {
      store = { ...newStore };
    }
  };
};

// Create a single instance of the mock
export const localStorageMock = createLocalStorageMock();

// Setup function to attach localStorage to window
export function setupMocks() {
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true
  });
}

// Reset function to clear mocks and localStorage state
export function resetMocks() {
  vi.clearAllMocks();
  localStorageMock.clear();
}
```

Now in your main setupTests file (which Vitest will use), you can do:

```javascript
// setupTests.js
import { afterEach } from 'vitest';
import { setupMocks, resetMocks } from './mockUtils'; // Adjust path as needed

// Set up mocks before all tests
setupMocks();

// Reset mocks after each test
afterEach(() => {
  resetMocks();
});
```

And in your test files, you can manipulate the localStorage mock as needed:

```javascript
// Example test file
import { describe, test, expect } from 'vitest';
import { localStorageMock } from './mockUtils'; // Import the mock

describe('Component with localStorage', () => {
  test('should store data in localStorage', () => {
    // Use localStorage directly
    localStorage.setItem('key', 'value');
    expect(localStorage.getItem('key')).toBe('value');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('key', 'value');
  });
  
  test('can pre-populate localStorage for testing', () => {
    // Pre-populate the store for this specific test
    localStorageMock._setStore({ 'preexisting': 'data' });
    
    expect(localStorage.getItem('preexisting')).toBe('data');
    
    // Still works with normal methods
    localStorage.setItem('another', 'value');
    expect(localStorage.getItem('another')).toBe('value');
  });
});
```

Make sure to include the setupTests file in your Vitest config:

```javascript
// vitest.config.js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom', // or 'jsdom'
    setupFiles: ['./path/to/setupTests.js']
  }
});
```

This approach gives you the flexibility to modify localStorage in individual tests while maintaining proper setup and cleanup between tests.