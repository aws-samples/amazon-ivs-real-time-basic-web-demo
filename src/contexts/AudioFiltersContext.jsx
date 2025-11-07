/**
 * AudioFiltersContext
 * Provides audio filter state and controls throughout the app
 */

import { createContext, useMemo } from "react";
import useAudioFilters from "../hooks/useAudioFilters";

const AudioFiltersContext = createContext({
  voiceFocusEnabled: false,
  voiceFocusSupported: false,
  isCheckingSupport: true,
  toggleVoiceFocus: undefined,
  applyVoiceFocus: undefined,
  normalizeOutputEnabled: false,
  toggleNormalizeOutput: undefined,
  applyOutputNormalization: undefined,
  removeOutputNormalization: undefined,
  monitoringEnabled: false,
  toggleMonitoring: undefined,
  updateMonitoringGain: undefined,
  setCurrentAudioTrack: undefined,
  reconnectMonitoring: undefined,
  getFilterStatus: undefined,
});

function AudioFiltersProvider({ children }) {
  const {
    voiceFocusEnabled,
    voiceFocusSupported,
    isCheckingSupport,
    toggleVoiceFocus,
    applyVoiceFocus,
    normalizeOutputEnabled,
    toggleNormalizeOutput,
    applyOutputNormalization,
    removeOutputNormalization,
    monitoringEnabled,
    toggleMonitoring,
    updateMonitoringGain,
    setCurrentAudioTrack,
    reconnectMonitoring,
    getFilterStatus,
  } = useAudioFilters();

  const state = useMemo(
    () => ({
      voiceFocusEnabled,
      voiceFocusSupported,
      isCheckingSupport,
      toggleVoiceFocus,
      applyVoiceFocus,
      normalizeOutputEnabled,
      toggleNormalizeOutput,
      applyOutputNormalization,
      removeOutputNormalization,
      monitoringEnabled,
      toggleMonitoring,
      updateMonitoringGain,
      setCurrentAudioTrack,
      reconnectMonitoring,
      getFilterStatus,
    }),
    [
      voiceFocusEnabled,
      voiceFocusSupported,
      isCheckingSupport,
      toggleVoiceFocus,
      applyVoiceFocus,
      normalizeOutputEnabled,
      toggleNormalizeOutput,
      applyOutputNormalization,
      removeOutputNormalization,
      monitoringEnabled,
      toggleMonitoring,
      updateMonitoringGain,
      setCurrentAudioTrack,
      reconnectMonitoring,
      getFilterStatus,
    ]
  );

  return (
    <AudioFiltersContext.Provider value={state}>
      {children}
    </AudioFiltersContext.Provider>
  );
}

export default AudioFiltersProvider;
export { AudioFiltersContext };
