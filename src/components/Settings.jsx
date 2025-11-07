import Select from "./Select";
import Toggle from "./Toggle";
import { useContext } from "react";
import { LocalMediaContext } from "../contexts/LocalMediaContext";
import { AudioFiltersContext } from "../contexts/AudioFiltersContext";
import { ModalContext } from "../contexts/ModalContext";
import { Button } from "./Buttons";

function Settings() {
  const {
    audioDevices,
    videoDevices,
    updateLocalAudio,
    updateLocalVideo,
    currentAudioDeviceId,
    currentVideoDeviceId,
  } = useContext(LocalMediaContext);
  const {
    voiceFocusEnabled,
    voiceFocusSupported,
    isCheckingSupport,
    toggleVoiceFocus,
    normalizeOutputEnabled,
    toggleNormalizeOutput,
    monitoringEnabled,
    toggleMonitoring,
  } = useContext(AudioFiltersContext);
  const { setModalOpen } = useContext(ModalContext);

  const handleVoiceFocusToggle = async () => {
    const newState = !voiceFocusEnabled;
    const success = await toggleVoiceFocus(newState);

    // Only refresh audio device if toggle was successful
    if (success && currentAudioDeviceId) {
      // Pass the new state explicitly to avoid React state timing issues
      updateLocalAudio(currentAudioDeviceId, { useVoiceFocus: newState });
    }
  };

  const handleNormalizeOutputToggle = () => {
    toggleNormalizeOutput(!normalizeOutputEnabled);
  };

  const handleMonitoringToggle = async () => {
    const newState = !monitoringEnabled;
    await toggleMonitoring(newState);
  };

  return (
    <div className="bg-surface w-96 px-5 pt-6 pb-8 rounded-xl overflow-hidden flex flex-col gap-2 text-uiText shadow-xl dark:shadow-black/80 ring-1 ring-surfaceAlt2/10">
      <h3 id="title" className="text-md font-bold mb-4">
        Settings
      </h3>
      <span id="full_description" className="hidden">
        <p>Select the camera and microphone to use.</p>
      </span>

      {/* Device Selection */}
      <div className="flex flex-col gap-y-2 mb-2">
        <Select
          options={videoDevices}
          onChange={updateLocalVideo}
          defaultValue={currentVideoDeviceId}
          title={"Camera"}
        />
        <Select
          options={audioDevices}
          onChange={updateLocalAudio}
          defaultValue={currentAudioDeviceId}
          title={"Microphone"}
        />
        <div className="flex flex-col gap-y-2 rounded-md bg-surfaceAlt/50 p-3">
          <Toggle
            label="Amazon voice focus"
            description={
              isCheckingSupport
                ? "Checking support..."
                : voiceFocusSupported
                ? "Enable AI noise suppression for the selected microphone"
                : "Not supported in this browser"
            }
            checked={voiceFocusEnabled}
            onChange={handleVoiceFocusToggle}
            disabled={!voiceFocusSupported || isCheckingSupport}
          />
        </div>
      </div>

      {/* Audio playback */}
      <div className="flex flex-col gap-y-2 mb-4">
        <h4 className="text-sm font-medium text-uiText/50">Playback</h4>
        {/* Normalize audio */}
        <div className="flex flex-col gap-y-4 rounded-md bg-surfaceAlt/50 p-3">
          {/* Disabled for now */}
          <Toggle
            label="Normalize Participant Audio"
            description="Balance volume levels for all participants"
            checked={normalizeOutputEnabled}
            onChange={handleNormalizeOutputToggle}
          />
          {/* Audio Monitoring */}
          <Toggle
            label="Hear yourself"
            description="Monitor you own audio (use headphones!)"
            checked={monitoringEnabled}
            onChange={handleMonitoringToggle}
          />
        </div>
      </div>

      <Button
        appearance="primary"
        style="roundedText"
        fullWidth={true}
        onClick={() => setModalOpen(false)}
      >
        Done
      </Button>
    </div>
  );
}

export default Settings;
