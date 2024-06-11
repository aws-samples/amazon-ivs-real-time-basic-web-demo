import { useState, useEffect } from 'react';

const useElapsedTime = (dateTime) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const now = new Date();
    const past = new Date(dateTime);
    const initialElapsedSeconds = Math.floor((now - past) / 1000);
    setElapsedSeconds(initialElapsedSeconds);

    const interval = setInterval(() => {
      const now = new Date();
      const newElapsedSeconds = Math.floor((now - past) / 1000);
      setElapsedSeconds(newElapsedSeconds);
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [dateTime]);

  return elapsedSeconds;
};

export default useElapsedTime;
