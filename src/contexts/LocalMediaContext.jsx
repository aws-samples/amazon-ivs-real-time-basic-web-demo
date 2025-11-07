import {
  createContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import useLocalMedia from "../hooks/useLocalMedia.js";
import useLocalStorage from "../hooks/useLocalStorage.js";
import { getAvailableDevices } from "../sdk/Devices.js";

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
    "savedAudioDeviceId",
    undefined
  );
  const [savedVideoDeviceId, setSavedVideoDeviceId] = useLocalStorage(
    "savedVideoDeviceId",
    undefined
  );

  const updateLocalAudio = useCallback(
    (deviceId, options) => {
      setLocalAudio(deviceId, options);
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

  // Function to refresh device lists
  const refreshDevices = useCallback(
    async (isInitialLoad = false) => {
      const { videoDevices, audioDevices, permissions } =
        await getAvailableDevices({
          savedAudioDeviceId,
          savedVideoDeviceId,
        });

      // Update device lists in state
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

      // Only initialize devices and permissions on initial load
      if (isInitialLoad) {
        let audioDevice = getIdealDevice(savedAudioDeviceId, audioDevices);
        let videoDevice = getIdealDevice(savedVideoDeviceId, videoDevices);

        // On initial load, skip Voice Focus even if enabled in settings
        // Voice Focus will be applied after stage joins via settings toggle or manual refresh
        updateLocalAudio(audioDevice, { useVoiceFocus: false });
        updateLocalVideo(videoDevice);
        setPermissions(permissions);
      } else {
        // When devices change after initial load, check if current devices still exist
        // If not, switch to the first available device
        if (localAudioDeviceId) {
          const audioDevice = getIdealDevice(localAudioDeviceId, audioDevices);
          if (audioDevice !== localAudioDeviceId) {
            console.log(
              "Current audio device disconnected, switching to:",
              audioDevice
            );
            updateLocalAudio(audioDevice, { useVoiceFocus: false });
          }
        }

        if (localVideoDeviceId) {
          const videoDevice = getIdealDevice(localVideoDeviceId, videoDevices);
          if (videoDevice !== localVideoDeviceId) {
            console.log(
              "Current video device disconnected, switching to:",
              videoDevice
            );
            updateLocalVideo(videoDevice);
          }
        }
      }
    },
    [
      savedAudioDeviceId,
      savedVideoDeviceId,
      localAudioDeviceId,
      localVideoDeviceId,
      updateLocalAudio,
      updateLocalVideo,
    ]
  );

  // Initial device setup on mount
  useEffect(() => {
    refreshDevices(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for device changes (plug/unplug)
  useEffect(() => {
    const handleDeviceChange = () => {
      console.log("Device change detected, refreshing device lists...");
      refreshDevices(false);
    };

    navigator.mediaDevices.addEventListener("devicechange", handleDeviceChange);

    return () => {
      navigator.mediaDevices.removeEventListener(
        "devicechange",
        handleDeviceChange
      );
    };
  }, [refreshDevices]);

  const state = useMemo(() => {
    return {
      audioDevices,
      videoDevices,
      permissions,
      currentAudioDevice: localAudio,
      currentVideoDevice: localVideo,
      currentAudioDeviceId: localAudioDeviceId,
      currentVideoDeviceId: localVideoDeviceId,
      currentAudioTrack: localAudioTrack,
      currentVideoTrack: localVideoTrack,
      updateLocalAudio,
      updateLocalVideo,
    };
  }, [
    audioDevices,
    localAudio,
    localAudioDeviceId,
    localAudioTrack,
    localVideo,
    localVideoDeviceId,
    localVideoTrack,
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
