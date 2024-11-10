For a React application, you can achieve horizontal scrolling with buttons and a fixed table header by using components and styles similar to those used in plain HTML/CSS. Here's an example of how you might implement this:

### React Component with Horizontal Scroll Buttons

1. **Install React (if not already installed)**:
   Make sure you have a React app set up using Create React App or a similar tool.

2. **Create the Table Component**:
   Define a React component with the required HTML structure and styles.

```jsx
// TableWithScrollButtons.jsx
import React, { useRef } from 'react';
import './TableWithScrollButtons.css';

const TableWithScrollButtons = () => {
  const tableWrapperRef = useRef(null);

  const scrollLeft = () => {
    if (tableWrapperRef.current) {
      tableWrapperRef.current.scrollBy({ left: -100, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (tableWrapperRef.current) {
      tableWrapperRef.current.scrollBy({ left: 100, behavior: 'smooth' });
    }
  };

  return (
    <div className="table-container">
      <div className="scroll-buttons">
        <button onClick={scrollLeft}>←</button>
        <button onClick={scrollRight}>→</button>
      </div>
      <div className="table-wrapper" ref={tableWrapperRef}>
        <table>
          <thead>
            <tr>
              <th>Header 1</th>
              <th>Header 2</th>
              <th>Header 3</th>
              <th>Header 4</th>
              <th>Header 5</th>
              <th>Header 6</th>
              <th>Header 7</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Row 1, Cell 1</td>
              <td>Row 1, Cell 2</td>
              <td>Row 1, Cell 3</td>
              <td>Row 1, Cell 4</td>
              <td>Row 1, Cell 5</td>
              <td>Row 1, Cell 6</td>
              <td>Row 1, Cell 7</td>
            </tr>
            {/* Add more rows as needed */}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableWithScrollButtons;
```

3. **Create the CSS File**:
   Add styles for the table and scroll buttons.

```css
/* TableWithScrollButtons.css */
.table-container {
  position: relative;
  overflow: hidden;
  border: 1px solid #ddd;
}

.scroll-buttons {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  padding: 5px;
  background-color: #f4f4f4;
}

.scroll-buttons button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 5px 10px;
  cursor: pointer;
}

.table-wrapper {
  overflow-x: auto;
  white-space: nowrap;
}

table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

th, td {
  border: 1px solid #ddd;
  padding: 8px;
}

thead {
  background-color: #f4f4f4;
}
```

4. **Use the Component in Your App**:

```jsx
// App.jsx
import React from 'react';
import TableWithScrollButtons from './TableWithScrollButtons';

const App = () => {
  return (
    <div className="App">
      <TableWithScrollButtons />
    </div>
  );
};

export default App;
```

### Explanation:
- **`useRef`**: Used to get a reference to the `.table-wrapper` element to control scrolling programmatically.
- **`scrollLeft` and `scrollRight`**: Functions to handle horizontal scrolling when the buttons are clicked.
- **CSS**: Styles for positioning the scroll buttons and making the table scroll horizontally.

Ensure that you have the necessary setup for CSS Modules or use plain CSS as shown in the example. Adjust the styling and scrolling behavior as needed for your use case.
