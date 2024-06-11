// From https://codepen.io/amazon-ivs/project/editor/ZzWobn

import { useState } from 'react';
import { StreamType } from 'amazon-ivs-web-broadcast';

function useMediaControls({ currentAudioDevice, currentVideoDevice }) {
  const [audioMuted, setAudioMuted] = useState(true);
  const [videoMuted, setVideoMuted] = useState(true);

  if (currentAudioDevice && audioMuted !== currentAudioDevice.isMuted) {
    setAudioMuted(currentAudioDevice.isMuted);
  }

  if (currentVideoDevice && videoMuted !== currentVideoDevice.isMuted) {
    setVideoMuted(currentVideoDevice.isMuted);
  }

  function toggleDeviceMute(device) {
    device.setMuted(!device.isMuted);

    if (device.streamType === StreamType.VIDEO) {
      setVideoMuted(device.isMuted);
    } else {
      setAudioMuted(device.isMuted);
    }
    return device.isMuted;
  }

  return {
    toggleDeviceMute,
    audioMuted,
    setAudioMuted,
    videoMuted,
    setVideoMuted,
  };
}

export default useMediaControls;
