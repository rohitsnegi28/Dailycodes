
```javascript
// Enhanced test-utils.js with location state support
import { vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';

// Mock functions
export const mockNavigate = vi.fn();
export const mockLocationState = { default: 'defaultState' }; // Default mock state

// Setup mocks
export function setupMocks() {
  // Create a more sophisticated React Router mock
  vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    
    return {
      ...actual,
      useNavigate: () => mockNavigate,
      useLocation: vi.fn().mockImplementation(() => ({
        pathname: '/', 
        search: '',
        hash: '',
        state: mockLocationState,  // Access to mocked state
        key: 'default'
      })),
      useParams: vi.fn().mockReturnValue({}),
      useRouteMatch: vi.fn().mockReturnValue({ path: '/', url: '/' })
    };
  });
  
  // Other mocks...
}

// Set location state for specific tests
export function setMockLocationState(state) {
  Object.assign(mockLocationState, state);
}

// Reset all mocks between tests
export function resetMocks() {
  mockNavigate.mockReset();
  // Reset location state to default
  Object.keys(mockLocationState).forEach(key => {
    if (key !== 'default') delete mockLocationState[key];
  });
}

// Render function with configurable location state
export function renderWithRouterAndState(
  ui, 
  { 
    route = '/',
    locationState = {} 
  } = {}
) {
  // Set location state before rendering
  setMockLocationState(locationState);
  
  return {
    mockNavigate,
    mockLocationState,
    ...render(
      <MemoryRouter initialEntries={[{
        pathname: route,
        state: locationState
      }]}>
        {ui}
      </MemoryRouter>
    )
  };
}

// Combined render with both Router, Redux and location state
export function renderWithAllProviders(
  ui,
  {
    preloadedState = {},
    store = createTestStore(preloadedState),
    route = '/',
    locationState = {},
    ...renderOptions
  } = {}
) {
  // Set location state before rendering
  setMockLocationState(locationState);
  
  function Wrapper({ children }) {
    return (
      <Provider store={store}>
        <MemoryRouter initialEntries={[{
          pathname: route,
          state: locationState
        }]}>
          {children}
        </MemoryRouter>
      </Provider>
    );
  }

  return {
    store,
    mockNavigate,
    mockLocationState,
    ...render(ui, { wrapper: Wrapper, ...renderOptions })
  };
}
```

Now in your tests, you can provide location state and test components that use it:

```javascript
import { setupMocks, mockNavigate, mockLocationState, renderWithAllProviders } from './test-utils';

// Apply mocks before importing components
setupMocks();

// Import components
import YourComponent from './YourComponent';

describe('Component with location state', () => {
  beforeEach(() => {
    // Reset all mocks
    mockNavigate.mockReset();
    // Reset location state to default
    Object.keys(mockLocationState).forEach(key => {
      if (key !== 'default') delete mockLocationState[key];
    });
  });

  it('should display data from location state', () => {
    // Render with custom location state
    const { getByText } = renderWithAllProviders(
      <YourComponent />,
      {
        locationState: {
          id: '123',
          name: 'Test Item',
          details: { category: 'Test' }
        }
      }
    );
    
    // Assert component correctly uses location state
    expect(getByText('Test Item')).toBeInTheDocument();
    expect(getByText('Category: Test')).toBeInTheDocument();
  });

  it('should navigate with state when button clicked', () => {
    const { getByText } = renderWithAllProviders(<YourComponent />);
    
    fireEvent.click(getByText('Go to Details'));
    
    // Assert navigation called with correct path and state
    expect(mockNavigate).toHaveBeenCalledWith(
      '/details', 
      { state: { id: expect.any(String) } }
    );
  });
});
```

This approach:
1. Provides full control over location state in tests
2. Makes it easy to reset state between tests
3. Works for both direct `useLocation().state` access and for testing navigation with state
4. Maintains clean test organization

The key is that you're making `mockLocationState` an object that you can modify between tests, allowing you to customize the state for each test case while keeping the mocking system consistent.