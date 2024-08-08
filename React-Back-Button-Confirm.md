# React Navigation Confirmation

This repository demonstrates two approaches for handling navigation confirmation in a React application.

## Approach 1: Using Browser's Default Confirmation Dialog

This method utilizes the built-in browser confirmation dialog to warn users before they navigate away from the page. It uses the `window.onbeforeunload` event to trigger the dialog.

### Implementation

1. **Add the `onbeforeunload` event listener**: This will trigger the browser's default confirmation dialog when the user tries to navigate away from the page.

2. **Code Example**:

    ```jsx
    import React, { useEffect } from 'react';

    const App = () => {
      useEffect(() => {
        // Function to be called when the user tries to navigate away
        const handleBeforeUnload = (event) => {
          // Set a custom message (not always supported by browsers)
          const message = "Are you sure you want to leave this page?";
          event.returnValue = message; // Standard for most browsers
          return message; // For older browsers
        };

        // Add event listener
        window.addEventListener('beforeunload', handleBeforeUnload);

        // Cleanup the event listener on component unmount
        return () => {
          window.removeEventListener('beforeunload', handleBeforeUnload);
        };
      }, []);

      return (
        <div>
          {/* Your app content here */}
          <h1>Your Application</h1>
        </div>
      );
    };

    export default App;
    ```

### Notes

- **Browser Support**: Modern browsers support this feature, but they may not display the custom message set in `event.returnValue`. Instead, they show their own default confirmation message.
- **User Experience**: This approach does not allow for a custom confirmation dialog with "Yes" and "No" options. It only provides a generic confirmation when the user tries to leave the page.

## Approach 2: Custom Confirmation Modal

This method uses a custom modal component to confirm navigation actions, providing a more user-friendly and customizable experience. This approach requires managing the state of the modal and intercepting navigation events.

### Implementation

1. **Create a Confirmation Modal Component**: Define a modal component to show the custom confirmation dialog.

2. **Handle Navigation with Confirmation**: Use `useHistory` from `react-router-dom` (for older versions) or `useNavigate` from `react-router-dom` v6 and newer to manage navigation.

#### Example with `react-router-dom` v5 or Earlier

**ConfirmationModal.js**:

    ```jsx
    import React from 'react';
    import { Modal, Button } from 'react-bootstrap';

    const ConfirmationModal = ({ show, onClose, onConfirm }) => {
      return (
        <Modal show={show} onHide={onClose}>
          <Modal.Header closeButton>
            <Modal.Title>Confirm Navigation</Modal.Title>
          </Modal.Header>
          <Modal.Body>Are you sure you want to navigate away from this page?</Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={onConfirm}>
              Yes, Navigate
            </Button>
          </Modal.Footer>
        </Modal>
      );
    };

    export default ConfirmationModal;
    ```

**App.js**:

    ```jsx
    import React, { useState, useEffect } from 'react';
    import { useHistory } from 'react-router-dom';
    import ConfirmationModal from './ConfirmationModal';

    const App = () => {
      const history = useHistory();
      const [modalVisible, setModalVisible] = useState(false);
      const [nextPath, setNextPath] = useState('');

      useEffect(() => {
        const handlePopState = (event) => {
          event.preventDefault();
          setModalVisible(true);
        };

        window.addEventListener('popstate', handlePopState);

        return () => {
          window.removeEventListener('popstate', handlePopState);
        };
      }, []);

      const handleConfirm = () => {
        setModalVisible(false);
        history.push(nextPath); // Navigate to the root or desired route
      };

      const handleCancel = () => {
        setModalVisible(false);
        // Do nothing, stay on the same page
      };

      return (
        <>
          {/* Your app content here */}
          <ConfirmationModal
            show={modalVisible}
            onClose={handleCancel}
            onConfirm={handleConfirm}
          />
        </>
      );
    };

    export default App;
    ```

### Notes

- **Customization**: This approach allows for full customization of the confirmation dialog.
- **User Experience**: Provides a more controlled and interactive user experience compared to the browser's default dialog.

## Summary

- **Browser's Default Confirmation Dialog**: Simple implementation with built-in browser support but limited customization.
- **Custom Confirmation Modal**: More flexible and customizable but requires additional coding and state management.

