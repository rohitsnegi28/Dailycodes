To implement a custom confirmation modal that appears when the user clicks the browser's back button, you can use a combination of React hooks and event listeners. Here’s a step-by-step guide to achieve this:

1. Create a Custom Modal Component
Create a simple modal component to show the confirmation dialog.

jsx
Copy code
// ConfirmationModal.js
import React from 'react';
import './ConfirmationModal.css'; // Import CSS file for styling

const ConfirmationModal = ({ show, onClose, onConfirm }) => {
  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Confirm Navigation</h2>
        <p>Are you sure you want to navigate away from this page?</p>
        <button onClick={onClose}>Stay</button>
        <button onClick={onConfirm}>Navigate to Home</button>
      </div>
    </div>
  );
};

export default ConfirmationModal;
2. Style the Modal with CSS
Create a CSS file to style the modal component.

css
Copy code
/* ConfirmationModal.css */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 20px;
  border-radius: 5px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.modal-content h2 {
  margin: 0 0 10px;
}

.modal-content p {
  margin: 0 0 20px;
}

.modal-content button {
  margin: 0 10px;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.modal-content button:first-child {
  background: #f1f1f1;
}

.modal-content button:last-child {
  background: #007bff;
  color: white;
}
3. Integrate Modal with Navigation Handling
Use the modal in your main component and handle the browser back button click.

jsx
Copy code
// App.js
import React, { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ConfirmationModal from './ConfirmationModal';
import './ConfirmationModal.css'; // Import CSS file

const App = () => {
  const navigate = useNavigate();
  const [modalVisible, setModalVisible] = useState(false);
  const [nextPath, setNextPath] = useState('');

  const handleBackButton = useCallback((event) => {
    event.preventDefault(); // Prevent default navigation
    setNextPath('/'); // Set the path you want to navigate to
    setModalVisible(true); // Show the confirmation modal
  }, []);

  const handleConfirm = () => {
    setModalVisible(false);
    navigate(nextPath); // Navigate to the home page or any other path
  };

  const handleCancel = () => {
    setModalVisible(false);
    // Stay on the current page
  };

  React.useEffect(() => {
    const handlePopState = (event) => {
      handleBackButton(event); // Handle the back button click
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [handleBackButton]);

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
Explanation
Custom Modal: ConfirmationModal is a basic modal component with options to stay on the current page or navigate to the home page.
CSS Styling: Basic styles are applied to the modal to make it look presentable.
Browser Back Button Handling:
handleBackButton function is used to intercept the back button click, show the modal, and set the next path for navigation.
handlePopState is an event listener that triggers the handleBackButton function when the back button is clicked.
The useEffect hook sets up and cleans up the popstate event listener.
Modal Handling:
Confirm: When the user confirms, they are navigated to the specified path ('/' in this case).
Cancel: The user stays on the current page, and the modal is closed.
This approach provides a controlled way to handle user navigation with a custom modal when the browser's back button is clicked. Adjust the path and modal content as needed for your application.






