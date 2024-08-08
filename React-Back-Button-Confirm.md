Okay, I understand. In that case, we can use the `window.onpopstate` event to detect the browser back button click instead of the `beforeunload` event. Here's the updated implementation:

```javascript
import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import './ConfirmationDialog.css';

const ConfirmationDialog = () => {
  const [showDialog, setShowDialog] = useState(false);
  const history = useHistory();

  useEffect(() => {
    const handleBackButtonClick = () => {
      setShowDialog(true);
    };

    window.addEventListener('popstate', handleBackButtonClick);

    return () => {
      window.removeEventListener('popstate', handleBackButtonClick);
    };
  }, []);

  const handleConfirm = () => {
    setShowDialog(false);
    history.push('/'); // Navigate to the home page
  };

  const handleCancel = () => {
    setShowDialog(false);
    history.go(1); // Go forward one step in the history
  };

  return (
    <>
      {showDialog && (
        <div className="confirmation-dialog">
          <div className="dialog-content">
            <h3>Are you sure you want to leave this page?</h3>
            <div className="dialog-buttons">
              <button onClick={handleConfirm}>Yes</button>
              <button onClick={handleCancel}>No</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ConfirmationDialog;
```

Here's the updated `App.js` file:

```javascript
import React from 'react';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import ConfirmationDialog from './ConfirmationDialog';

const HomePage = () => {
  return <h1>Welcome to the Home Page</h1>;
};

const OtherPage = () => {
  return <h1>This is the Other Page</h1>;
};

const App = () => {
  return (
    <Router>
      <ConfirmationDialog />
      <Switch>
        <Route path="/" exact component={HomePage} />
        <Route path="/other" component={OtherPage} />
        <Redirect to="/" />
      </Switch>
    </Router>
  );
};

export default App;
```

The main changes are:

1. In the `ConfirmationDialog` component, we use the `useEffect` hook to add an event listener for the `popstate` event, which is triggered when the user navigates through the browser history using the back/forward buttons.

2. When the `popstate` event is fired, we show the confirmation dialog by setting the `showDialog` state to `true`.

3. In the `handleCancel` function, we use the `history.go(1)` method to go forward one step in the history, effectively canceling the back button navigation.

This implementation should work with the browser back button and prevent accidental navigation, while allowing the user to stay on the current page if they choose to cancel the action.
