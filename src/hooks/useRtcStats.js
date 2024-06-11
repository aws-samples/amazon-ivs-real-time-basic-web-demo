import { useState } from 'react';

function useRtcStats() {
  const [latency, setLatency] = useState(-1);
  const [formattedLatency, setFormattedLatency] = useState('--.--');

  function formatLatency(latencyInMs) {
    const formattedLatency = Number.parseFloat(latencyInMs).toFixed(0);
    return formattedLatency;
  }

  async function updateLatency(stream, isLocal) {
    const currentLatencyInMs = await getLatency(stream, isLocal);
    const formattedCurrentLatency = formatLatency(currentLatencyInMs);
    setLatency(currentLatencyInMs);
    setFormattedLatency(formattedCurrentLatency);
  }

  async function getLatency(stream, isLocal) {
    var latency = -1;
    if (!stream.getStats) return;
    try {
      const stats = await stream.getStats();
      stats.forEach((report) => {
        if (!report.type) return;

        const isLocalReport = isLocal && report.type == 'remote-inbound-rtp';
        const isRemoteReport = !isLocal && report.type == 'remote-outbound-rtp';

        if (isLocalReport || isRemoteReport) {
          if (report.roundTripTimeMeasurements == 0) setLatency(false);
          const rtt = report.roundTripTime;
          latency = rtt && report.roundTripTime * 1000;
        }
      });
    } catch (err) {
      // Unable to retrieve stats
      // console.error(err);
    }
    return latency;
  }

  return {
    latency,
    formattedLatency,
    setLatency: updateLatency,
    formatLatency,
  };
}

export default useRtcStats;
