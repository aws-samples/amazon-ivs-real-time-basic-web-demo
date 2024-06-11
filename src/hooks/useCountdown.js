import { useState, useEffect } from 'react';

const useCountdown = (dateTime) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const now = new Date();
    const future = new Date(`${dateTime}`);
    const initialCountdown = Math.floor((future - now) / 1000);
    setSeconds(initialCountdown);

    const interval = setInterval(() => {
      const now = new Date();
      const newCountdown = Math.floor((future - now) / 1000);
      // Do not count down below 0s
      setSeconds(newCountdown < 0 ? 0 : newCountdown);
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [dateTime]);

  return seconds;
};

export default useCountdown;
