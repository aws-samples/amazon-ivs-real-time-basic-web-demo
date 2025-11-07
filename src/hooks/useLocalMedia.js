// From https://codepen.io/amazon-ivs/project/editor/ZzWobn

import { useCallback, useState, useContext } from 'react';
import { getCameraTrack, getMicrophoneTrack } from '../sdk/Devices';
import { LocalStageStream, StreamType } from 'amazon-ivs-web-broadcast';
import { AudioFiltersContext } from '../contexts/AudioFiltersContext';
import toast from 'react-hot-toast';

function useLocalMedia() {
  const { voiceFocusEnabled, applyVoiceFocus, setCurrentAudioTrack, reconnectMonitoring } = useContext(AudioFiltersContext);
  
  const [localVideo, setLocalVideo] = useState(undefined);
  const [localVideoTrack, setLocalVideoTrack] = useState(undefined);
  const [localAudio, setLocalAudio] = useState(undefined);
  const [localAudioTrack, setLocalAudioTrack] = useState(undefined);
  const [localVideoDeviceId, setLocalVideoDeviceId] = useState(undefined);
  const [localAudioDeviceId, setLocalAudioDeviceId] = useState(undefined);
  const [screenshare, setScreenshare] = useState(undefined);

  const createScreenshare = useCallback((track) => {
    if (!track) {
      setScreenshare(undefined);
      return;
    }
    setScreenshare(new LocalStageStream(track));
  }, []);

  const createLocalStream = useCallback(
    (track, deviceId) => {
      if (!track) {
        console.warn('tried to set local media with a null track');
        return;
      }
      const stream = new LocalStageStream(track, {
        simulcast: { enabled: true },
      });
      if (stream.streamType === StreamType.VIDEO) {
        stream.setMuted(localVideo ? localVideo.isMuted : false);
        setLocalVideo(stream);
        setLocalVideoTrack(track);
        setLocalVideoDeviceId(deviceId);
      } else {
        stream.setMuted(localAudio ? localAudio.isMuted : false);
        setLocalAudio(stream);
        setLocalAudioTrack(track);
        setLocalAudioDeviceId(deviceId);
      }
    },
    [localAudio, localVideo]
  );

  const setLocalVideoFromId = useCallback(
    async (deviceId) => {
      const videoTrack = await getCameraTrack(deviceId);
      createLocalStream(videoTrack, deviceId);
    },
    [createLocalStream]
  );

  const setLocalAudioFromId = useCallback(
    async (deviceId, options = {}) => {
      // Allow explicit override of voiceFocusEnabled state for immediate updates
      const shouldUseVoiceFocus = options.useVoiceFocus !== undefined 
        ? options.useVoiceFocus 
        : voiceFocusEnabled;
      
      let audioTrack;
      
      // Apply Voice Focus if enabled
      if (shouldUseVoiceFocus) {
        try {
          console.log('Voice Focus enabled, applying to device:', deviceId);
          // applyVoiceFocus now takes deviceId and returns a Voice Focus device
          // Pass forceEnable to override context state for immediate updates
          const vfDevice = await applyVoiceFocus(deviceId, { forceEnable: shouldUseVoiceFocus });
          if (vfDevice) {
            // Use getUserMedia with the Voice Focus device as the audio constraint
            const stream = await navigator.mediaDevices.getUserMedia({
              audio: vfDevice,
              video: false
            });
            if (stream && stream.getAudioTracks) {
              const tracks = stream.getAudioTracks();
              if (tracks.length > 0) {
                audioTrack = tracks[0];
                console.log('Voice Focus applied successfully');
                toast.success('Voice Focus enabled', {
                  id: 'voice-focus-enabled',
                  duration: 4000,
                });
              }
            }
          }
        } catch (error) {
          console.error('Error applying Voice Focus, falling back to regular device:', error);
          toast.error('Failed to apply Voice Focus', {
            id: 'voice-focus-error',
            duration: 4000,
          });
        }
      }
      
      // Fall back to regular microphone if Voice Focus failed or not enabled
      if (!audioTrack) {
        const micOptions = {
          disableNoiseSuppression: shouldUseVoiceFocus,
        };
        audioTrack = await getMicrophoneTrack(deviceId, micOptions);
      }
      
      // Notify context of new audio track for monitoring
      if (audioTrack) {
        setCurrentAudioTrack(audioTrack);
        // Reconnect monitoring if it was enabled
        reconnectMonitoring();
      }
      
      createLocalStream(audioTrack, deviceId);
    },
    [createLocalStream, voiceFocusEnabled, applyVoiceFocus, setCurrentAudioTrack, reconnectMonitoring]
  );

  return {
    localAudio,
    localVideo,
    localAudioDeviceId,
    localVideoDeviceId,
    localAudioTrack,
    localVideoTrack,
    screenshare,
    setLocalAudio: setLocalAudioFromId,
    setLocalVideo: setLocalVideoFromId,
    setScreenshare: createScreenshare,
  };
}

export default useLocalMedia;
