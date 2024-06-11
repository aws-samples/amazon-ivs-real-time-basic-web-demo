import {
  createContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import useLocalMedia from '../hooks/useLocalMedia.js';
import useLocalStorage from '../hooks/useLocalStorage.js';
import { getAvailableDevices } from '../sdk/Devices.js';

const LocalMediaContext = createContext({
  audioDevices: [],
  videoDevices: [],
  permissions: undefined,
  currentVideoDevice: undefined,
  currentAudioDevice: undefined,
  currentVideoTrack: undefined,
  currentAudioTrack: undefined,
  currentVideoDeviceId: undefined,
  currentAudioDeviceId: undefined,
  updateLocalAudio: undefined,
  updateLocalVideo: undefined,
});

function LocalMediaProvider({ children }) {
  const [audioDevices, setAudioDevices] = useState([]);
  const [videoDevices, setVideoDevices] = useState([]);
  const [permissions, setPermissions] = useState(false);
  const {
    localAudio,
    localVideo,
    localAudioDeviceId,
    localVideoDeviceId,
    localAudioTrack,
    localVideoTrack,
    setLocalAudio,
    setLocalVideo,
  } = useLocalMedia();

  const [savedAudioDeviceId, setSavedAudioDeviceId] = useLocalStorage(
    'savedAudioDeviceId',
    undefined
  );
  const [savedVideoDeviceId, setSavedVideoDeviceId] = useLocalStorage(
    'savedVideoDeviceId',
    undefined
  );

  const updateLocalAudio = useCallback(
    (deviceId) => {
      setLocalAudio(deviceId);
      setSavedAudioDeviceId(deviceId);
    },
    [setLocalAudio, setSavedAudioDeviceId]
  );

  const updateLocalVideo = useCallback(
    (deviceId) => {
      setLocalVideo(deviceId);
      setSavedVideoDeviceId(deviceId);
    },
    [setLocalVideo, setSavedVideoDeviceId]
  );

  function getIdealDevice(deviceId, devices) {
    const deviceExists = devices.reduce(
      (foundDevice, currentDevice) =>
        foundDevice || currentDevice.deviceId == deviceId,
      false
    );
    return deviceExists ? deviceId : devices[0].deviceId;
  }

  useEffect(() => {
    return () => {
      if (permissions && localVideoTrack) {
        try {
          localVideoTrack.stop();
        } catch (err) {
          console.error(err);
        }
      }
    };
  }, [localVideoTrack, permissions]);

  useEffect(() => {
    return () => {
      if (permissions && localAudioTrack) {
        try {
          localAudioTrack.stop();
        } catch (err) {
          console.error(err);
        }
      }
    };
  }, [localAudioTrack, permissions]);

  useEffect(() => {
    const setDevices = async () => {
      const { videoDevices, audioDevices, permissions } =
        await getAvailableDevices({
          savedAudioDeviceId,
          savedVideoDeviceId,
        });

      let audioDevice = getIdealDevice(savedAudioDeviceId, audioDevices);
      let videoDevice = getIdealDevice(savedVideoDeviceId, videoDevices);

      updateLocalAudio(audioDevice);
      updateLocalVideo(videoDevice);
      setPermissions(permissions);
      setAudioDevices(
        audioDevices.map((device) => {
          return { label: device.label, value: device.deviceId };
        })
      );
      setVideoDevices(
        videoDevices.map((device) => {
          return { label: device.label, value: device.deviceId };
        })
      );
    };

    setDevices();

    // Run once on mount and unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const state = useMemo(() => {
    return {
      audioDevices,
      videoDevices,
      permissions,
      currentAudioDevice: localAudio,
      currentVideoDevice: localVideo,
      currentAudioDeviceId: localAudioDeviceId,
      currentVideoDeviceId: localVideoDeviceId,
      updateLocalAudio,
      updateLocalVideo,
    };
  }, [
    audioDevices,
    localAudio,
    localAudioDeviceId,
    localVideo,
    localVideoDeviceId,
    permissions,
    updateLocalAudio,
    updateLocalVideo,
    videoDevices,
  ]);

  return (
    <LocalMediaContext.Provider value={state}>
      {children}
    </LocalMediaContext.Provider>
  );
}

export default LocalMediaProvider;
export { LocalMediaContext };
