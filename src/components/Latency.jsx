import { useEffect, useRef } from 'react';
import Spinner from './Spinner';
import useRtcStats from '../hooks/useRtcStats';

export default function Latency({ videoStream, isLocal }) {
  const { latency, formattedLatency, setLatency } = useRtcStats();
  const statsTimeoutRef = useRef(undefined);

  function clearStatsTimeout() {
    statsTimeoutRef.current && clearTimeout(statsTimeoutRef.current);
  }

  const pollLatency = () => {
    if (videoStream) {
      if (statsTimeoutRef.current) clearStatsTimeout();
      setLatency(videoStream, isLocal);
    }

    // Update RTC stats every second
    statsTimeoutRef.current = setTimeout(() => {
      pollLatency();
    }, 1000);
  };

  useEffect(() => {
    pollLatency();
    return () => {
      clearStatsTimeout();
    };
    // Run on initial mount and unmount only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoStream]);

  return (
    <div className='inline-flex items-center px-4 py-1 rounded-full bg-white/80 font-mono text-black text-xs'>
      {!latency || latency < 0 ? (
        <>
          <span className='mr-2'>Latency:</span> <Spinner type='inverted' />
        </>
      ) : (
        <>Latency: {formattedLatency}ms</>
      )}
    </div>
  );
}
