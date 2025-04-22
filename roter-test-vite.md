
### Create a Router Mock Setup

You can set up a global mock for React Router in your test setup file (like `setupTests.js` or similar):

```javascript
// setupTests.js or a similar setup file
import { vi } from 'vitest';

// Create a mock navigate function that all tests can access
const mockNavigate = vi.fn();

// Mock the entire react-router-dom module
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

// Make mockNavigate available globally for tests
global.mockNavigate = mockNavigate;
```

### Test Wrapper for Components

Create a wrapper component that provides the router context to all your components under test:

```javascript
// test-utils.jsx
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

export function renderWithRouter(ui, { route = '/', ...renderOptions } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      {ui}
    </MemoryRouter>,
    renderOptions
  );
}
```

### Using in Your Tests

Then in your tests, you can use it like this:

```javascript
import { renderWithRouter } from './test-utils';
import { screen, fireEvent } from '@testing-library/react';
import YourComponent from './YourComponent';
import { beforeEach } from 'vitest';

describe('YourComponent', () => {
  beforeEach(() => {
    // Reset the mock before each test
    mockNavigate.mockReset();
  });

  test('navigates when button is clicked', () => {
    renderWithRouter(<YourComponent />);
    
    // Trigger navigation action
    fireEvent.click(screen.getByText('Go to Dashboard'));
    
    // Assert navigation occurred with correct path
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });
});
```

### For More Complex Router Testing

If you need to test more complex router features (like parameters, nested routes, etc.), you can enhance your test wrapper:

```javascript
export function renderWithAdvancedRouter(
  ui, 
  { 
    route = '/', 
    routes = [], 
    historyOptions = {} 
  } = {}
) {
  const Wrapper = ({ children }) => (
    <MemoryRouter initialEntries={[route]} {...historyOptions}>
      {routes.length > 0 ? (
        <Routes>
          {routes.map((routeProps) => (
            <Route key={routeProps.path} {...routeProps} />
          ))}
          <Route path="*" element={children} />
        </Routes>
      ) : (
        children
      )}
    </MemoryRouter>
  );
  
  return render(ui, { wrapper: Wrapper });
}
```

This approach allows you to consistently mock and test navigation throughout your entire application while keeping your tests clean and focused on component behavior.