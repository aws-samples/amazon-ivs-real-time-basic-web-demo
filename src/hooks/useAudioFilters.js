/**
 * useAudioFilters Hook
 * Manages audio filter state and operations
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import audioFilterService from '../services/AudioFilterService';
import voiceFocusService from '../services/VoiceFocusService';
import useLocalStorage from './useLocalStorage';
import toast from 'react-hot-toast';

export default function useAudioFilters() {
  // Persist filter settings
  const [voiceFocusEnabled, setVoiceFocusEnabled] = useLocalStorage(
    'voiceFocusEnabled',
    false
  );
  const [normalizeOutputEnabled, setNormalizeOutputEnabled] = useLocalStorage(
    'normalizeOutputEnabled',
    false
  );
  const [monitoringEnabled, setMonitoringEnabled] = useState(false);

  // Voice Focus support status
  const [voiceFocusSupported, setVoiceFocusSupported] = useState(false);
  const [isCheckingSupport, setIsCheckingSupport] = useState(true);

  // Track active monitoring stream and audio track
  const monitoringStreamRef = useRef(null);
  const currentAudioTrackRef = useRef(null);

  /**
   * Check Voice Focus support on mount
   */
  useEffect(() => {
    const checkSupport = async () => {
      setIsCheckingSupport(true);
      try {
        const supported = await voiceFocusService.checkSupport();
        setVoiceFocusSupported(supported);
        
        if (!supported && voiceFocusEnabled) {
          // If it was enabled but not supported, disable it
          setVoiceFocusEnabled(false);
          toast.error('Voice Focus is not supported in this browser', {
            id: 'voice-focus-not-supported',
          });
        }
      } catch (error) {
        console.error('Error checking Voice Focus support:', error);
        setVoiceFocusSupported(false);
      } finally {
        setIsCheckingSupport(false);
      }
    };

    checkSupport();
  }, [voiceFocusEnabled, setVoiceFocusEnabled]);

  /**
   * Toggle Voice Focus
   */
  const toggleVoiceFocus = useCallback(
    async (enabled) => {
      if (enabled && !voiceFocusSupported) {
        toast.error('Voice Focus is not supported in this browser', {
          id: 'voice-focus-not-supported',
        });
        return false;
      }

      setVoiceFocusEnabled(enabled);
      
      if (!enabled) {
        // Clean up Voice Focus device
        await voiceFocusService.stopCurrentDevice();
        toast.success('Voice Focus disabled', {
          id: 'voice-focus-disabled',
          duration: 4000,
        });
      } else {
        // Note: Success toast for enabling will be shown when audio device is refreshed
        // and Voice Focus is actually applied in useLocalMedia
        console.log('Refreshing audio to apply Voice Focus...');
      }

      return true;
    },
    [voiceFocusSupported, setVoiceFocusEnabled]
  );

  /**
   * Apply Voice Focus to an audio device
   * @param {string} deviceId - Device ID
   * @param {Object} options - Options
   * @param {boolean} options.forceEnable - Force enable Voice Focus regardless of context state
   * @returns {Promise<Object|null>} Voice Focus device or null
   */
  const applyVoiceFocus = useCallback(
    async (deviceId, options = {}) => {
      // Allow explicit override of voiceFocusEnabled state for immediate updates
      const shouldUseVoiceFocus = options.forceEnable !== undefined 
        ? options.forceEnable 
        : voiceFocusEnabled;
      
      if (!shouldUseVoiceFocus || !voiceFocusSupported) {
        return null;
      }

      try {
        const vfDevice = await voiceFocusService.createVoiceFocusDevice(deviceId);
        return vfDevice;
      } catch (error) {
        console.error('Error applying Voice Focus:', error);
        toast.error('Failed to apply Voice Focus', {
          id: 'voice-focus-apply-error',
        });
        return null;
      }
    },
    [voiceFocusEnabled, voiceFocusSupported]
  );

  /**
   * Toggle output audio normalization
   */
  const toggleNormalizeOutput = useCallback(
    (enabled) => {
      setNormalizeOutputEnabled(enabled);
    },
    [setNormalizeOutputEnabled]
  );

  /**
   * Apply output normalization to a participant
   * @param {MediaStreamTrack} audioTrack - Audio track to process
   * @param {string} participantId - Participant ID
   */
  const applyOutputNormalization = useCallback(
    async (audioTrack, participantId) => {
      if (!normalizeOutputEnabled) {
        return null;
      }

      try {
        const chain = await audioFilterService.createOutputFilterChain(
          audioTrack,
          participantId
        );
        return chain;
      } catch (error) {
        console.error('Error applying output normalization:', error);
        toast.error('Failed to apply audio normalization for participant', {
          id: `normalize-error-${participantId}`,
          duration: 4000,
        });
        return null;
      }
    },
    [normalizeOutputEnabled]
  );

  /**
   * Remove output normalization for a participant
   * @param {string} participantId - Participant ID
   */
  const removeOutputNormalization = useCallback((participantId) => {
    audioFilterService.removeOutputFilterChain(participantId);
  }, []);

  /**
   * Set the current audio track for monitoring
   * @param {MediaStreamTrack} track - The current audio track
   */
  const setCurrentAudioTrack = useCallback((track) => {
    currentAudioTrackRef.current = track;
  }, []);

  /**
   * Reconnect monitoring to the current audio track
   */
  const reconnectMonitoring = useCallback(() => {
    if (!monitoringEnabled || !currentAudioTrackRef.current) {
      return;
    }

    try {
      // Clean up existing monitoring first
      audioFilterService.removeMonitoringChain();
      
      // Create new monitoring chain with current track
      const stream = new MediaStream([currentAudioTrackRef.current]);
      audioFilterService.createMonitoringChain(stream);
      monitoringStreamRef.current = stream;
      
      console.log('Monitoring reconnected to new audio track');
    } catch (error) {
      console.error('Error reconnecting monitoring:', error);
      toast.error('Failed to reconnect audio monitoring', {
        id: 'monitoring-reconnect-error',
        duration: 4000,
      });
    }
  }, [monitoringEnabled]);

  /**
   * Toggle audio monitoring (loopback)
   */
  const toggleMonitoring = useCallback(
    async (enabled) => {
      if (enabled) {
        if (!currentAudioTrackRef.current) {
          toast.error('No audio track available for monitoring', {
            id: 'monitoring-no-track',
          });
          return false;
        }

        try {
          // Always clean up first to ensure clean state
          audioFilterService.removeMonitoringChain();
          
          // Create monitoring chain
          const stream = new MediaStream([currentAudioTrackRef.current]);
          audioFilterService.createMonitoringChain(stream);
          monitoringStreamRef.current = stream;
          setMonitoringEnabled(true);
          
          return true;
        } catch (error) {
          console.error('Error enabling monitoring:', error);
          toast.error('Failed to enable audio monitoring', {
            id: 'monitoring-error',
          });
          return false;
        }
      } else {
        audioFilterService.removeMonitoringChain();
        monitoringStreamRef.current = null;
        setMonitoringEnabled(false);
        return true;
      }
    },
    [setMonitoringEnabled]
  );

  /**
   * Update monitoring gain
   * @param {number} gain - Gain value (0.0 to 1.0)
   */
  const updateMonitoringGain = useCallback((gain) => {
    audioFilterService.updateMonitoringGain(gain);
  }, []);

  /**
   * Get current filter status
   */
  const getFilterStatus = useCallback(() => {
    return {
      voiceFocus: {
        enabled: voiceFocusEnabled,
        supported: voiceFocusSupported,
        active: voiceFocusService.isActive(),
      },
      normalizeOutput: {
        enabled: normalizeOutputEnabled,
      },
      monitoring: {
        enabled: monitoringEnabled,
        active: audioFilterService.isMonitoring(),
      },
    };
  }, [voiceFocusEnabled, voiceFocusSupported, normalizeOutputEnabled, monitoringEnabled]);

  /**
   * Watch for monitoring state changes and reconnect when audio track changes
   */
  useEffect(() => {
    if (monitoringEnabled && currentAudioTrackRef.current) {
      // Reconnect monitoring when it's enabled and we have a track
      reconnectMonitoring();
    }
  }, [monitoringEnabled, reconnectMonitoring]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      // Clean up monitoring if active
      if (monitoringEnabled) {
        audioFilterService.removeMonitoringChain();
      }
      // Note: We don't clean up Voice Focus here as it's managed by the device lifecycle
    };
  }, [monitoringEnabled]);

  return {
    // Voice Focus
    voiceFocusEnabled,
    voiceFocusSupported,
    isCheckingSupport,
    toggleVoiceFocus,
    applyVoiceFocus,

    // Output Normalization
    normalizeOutputEnabled,
    toggleNormalizeOutput,
    applyOutputNormalization,
    removeOutputNormalization,

    // Audio Monitoring
    monitoringEnabled,
    toggleMonitoring,
    updateMonitoringGain,
    setCurrentAudioTrack,
    reconnectMonitoring,

    // Status
    getFilterStatus,
  };
}
