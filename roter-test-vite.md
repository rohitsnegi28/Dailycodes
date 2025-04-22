
Here's how you can refactor this:

1. Create a dedicated test utilities file for your mocks
2. Set up flexible mock functions for both React Router and Redux
3. Create helper functions to use in your tests

Here's my recommendation:

```javascript
// test-utils.js - Create this file to centralize your mocks
import { vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';

// Mock functions that can be spied on and configured
export const mockNavigate = vi.fn();
export const mockDispatch = vi.fn();

// Setup function to configure mocks before tests
export function setupMocks() {
  // Mock React Router
  vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
      ...actual,
      useNavigate: () => mockNavigate
    };
  });

  // Mock React Redux
  vi.mock('react-redux', async () => {
    const actual = await vi.importActual('react-redux');
    return {
      ...actual,
      useDispatch: () => mockDispatch
    };
  });
}

// Reset all mocks between tests
export function resetMocks() {
  mockNavigate.mockReset();
  mockDispatch.mockReset();
}

// Custom render function with Router and Redux Provider
export function renderWithProvidersAndRouter(
  ui,
  {
    preloadedState = {},
    store = initStore(preloadedState),
    route = '/',
    ...renderOptions
  } = {}
) {
  function Wrapper({ children }) {
    return (
      <Provider store={store}>
        <MemoryRouter initialEntries={[route]}>
          {children}
        </MemoryRouter>
      </Provider>
    );
  }

  return {
    store,
    mockNavigate,
    mockDispatch,
    ...render(ui, { wrapper: Wrapper, ...renderOptions })
  };
}
```

Then in your test files:

```javascript
// YourComponent.test.js
import { 
  setupMocks, 
  resetMocks, 
  mockNavigate, 
  mockDispatch, 
  renderWithProvidersAndRouter 
} from './test-utils';
import { beforeEach, describe, it, expect } from 'vitest';
import YourComponent from './YourComponent';

// Setup mocks before all tests in this file
setupMocks();

describe('BusinessCardRuleList Component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    resetMocks();
  });

  it('Should click add button without error', async () => {
    // Setup specific mock behavior if needed
    mockDispatch.mockReturnValue({ type: 'SOME_ACTION' });
    
    // Render with all providers
    const { getByLabelText } = renderWithProvidersAndRouter(<YourComponent />);
    
    // Your test code here
    fireEvent.click(getByLabelText('ARIA_BCR'));
    
    // Assertions
    expect(mockDispatch).toHaveBeenCalled();
  });

  it('Should navigate when clicking a link', async () => {
    const { getByText } = renderWithProvidersAndRouter(<YourComponent />);
    
    fireEvent.click(getByText('Go to details'));
    
    expect(mockNavigate).toHaveBeenCalledWith('/details');
  });
});
```

This approach gives you:

1. Centralized mock setup that's reusable across test files
2. Clean test files that focus on behavior rather than setup
3. Easy access to mock functions for assertions
4. Flexible rendering options with all necessary providers

The modular structure makes maintenance much easier as your application grows, and you can extend it with additional mocks as needed.