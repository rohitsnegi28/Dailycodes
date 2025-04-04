import React, { useEffect, useRef, useState } from 'react';
// Assuming your organization's library is imported like this
import { Spinner } from 'your-org-library';

const AccessibleLoader = ({ id = 'loader-' + Math.random().toString(36).substr(2, 9) }) => {
  // Reference to the live region element
  const liveRegionRef = useRef(null);
  // Track mounted state to ensure we don't have race conditions
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    // Set mounted state to true
    setIsMounted(true);
    
    return () => {
      // Set mounted state to false when unmounting
      setIsMounted(false);
    };
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    
    // Function to trigger the announcement
    const announceLoading = () => {
      if (liveRegionRef.current && document.body.contains(liveRegionRef.current)) {
        // Generate a unique message with timestamp to force screen readers to announce again
        const timestamp = new Date().getTime();
        liveRegionRef.current.setAttribute('data-timestamp', timestamp);
        
        // First clear the content
        liveRegionRef.current.textContent = '';
        
        // Then set the content after a short delay
        setTimeout(() => {
          if (liveRegionRef.current) {
            liveRegionRef.current.textContent = 'Loading';
          }
        }, 50);
      }
    };
    
    // Immediate announcement on mount with longer delay to ensure DOM is ready
    const initialTimeout = setTimeout(() => {
      announceLoading();
    }, 200);
    
    // Create an interval that updates the live region every 10 seconds
    const intervalId = setInterval(announceLoading, 10000);
    
    // Clean up interval and timeout on unmount
    return () => {
      clearInterval(intervalId);
      clearTimeout(initialTimeout);
    };
  }, [isMounted]);
  
  return (
    <div className="loader-container" aria-busy="true">
      {/* Your organization's spinner component */}
      <Spinner aria-hidden="true" />
      
      {/* Visually hidden live region for screen readers */}
      <div 
        ref={liveRegionRef}
        id={id}
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