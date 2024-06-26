import React, { useEffect, useState } from 'react';
import moment from 'moment';

const TimerComponent = () => {
  const [maxIdleTimeOut, setMaxIdleTimeOut] = useState(moment());
  
  useEffect(() => {
    // Function to start the timer
    const startTimer = () => {
      const timer = setTimeout(() => {
        const currentTime = moment();
        const elapsedTimeMinutes = currentTime.diff(maxIdleTimeOut, 'minutes');
        
        if (elapsedTimeMinutes >= 3) {
          // Call your API or perform actions here
          console.log('Calling API after 3 minutes of idle time.');
          
          // Optionally, update maxIdleTimeOut to current time
          setMaxIdleTimeOut(moment());
        }
        
        // Continue checking every minute
        startTimer();
      }, 60000); // Check every minute (60000 milliseconds)
      
      return () => clearTimeout(timer); // Cleanup function to clear timeout
    };
    
    // Start the timer when component mounts
    startTimer();
    
    // Cleanup function to clear timer when component unmounts
    return () => clearTimeout(timer);
  }, []); // Empty dependency array means it runs only on mount and unmount
  
  return (
    <div>
      {/* Your component UI */}
    </div>
  );
};

export default TimerComponent;