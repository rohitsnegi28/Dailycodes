import React, { useEffect, useRef } from 'react';
// Assuming your organization's library is imported like this
import { Spinner } from 'your-org-library';

const AccessibleLoader = () => {
  // Reference to the live region element
  const liveRegionRef = useRef(null);
  
  useEffect(() => {
    // Create an interval that updates the live region every 10 seconds
    const intervalId = setInterval(() => {
      // Only announce if the component is in the DOM
      if (liveRegionRef.current && document.body.contains(liveRegionRef.current)) {
        // Clear and then set the content to trigger screen readers to announce it again
        liveRegionRef.current.textContent = '';
        // Use setTimeout to ensure the DOM has time to process the clearing
        setTimeout(() => {
          liveRegionRef.current.textContent = 'Loading';
        }, 50);
      }
    }, 10000);
    
    // Initial announcement when loader appears
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = 'Loading';
    }
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, []);
  
  return (
    <div className="loader-container">
      {/* Your organization's spinner component */}
      <Spinner />
      
      {/* Visually hidden live region for screen readers */}
      <div 
        ref={liveRegionRef}
        role="status"
        aria-live="polite"
        className="sr-only"
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: '0',
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          borderWidth: '0'
        }}
      >
        Loading
      </div>
    </div>
  );
};

export default AccessibleLoader;