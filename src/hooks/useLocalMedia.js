// From https://codepen.io/amazon-ivs/project/editor/ZzWobn

import { useCallback, useState } from 'react';
import { getCameraTrack, getMicrophoneTrack } from '../sdk/Devices';
import { LocalStageStream, StreamType } from 'amazon-ivs-web-broadcast';

function useLocalMedia() {
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
    async (deviceId) => {
      const audioTrack = await getMicrophoneTrack(deviceId);
      createLocalStream(audioTrack, deviceId);
    },
    [createLocalStream]
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
