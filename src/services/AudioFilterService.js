/**
 * AudioFilterService
 * Manages Web Audio API operations for input and output audio filtering
 */

import { MicVAD } from "@ricky0123/vad-web";

class AudioFilterService {
  constructor() {
    this.audioContext = null;
    this.inputChains = new Map(); // deviceId -> filter chain
    this.outputChains = new Map(); // participantId -> filter chain
    this.elementSourceMap = new Map(); // HTMLAudioElement -> MediaElementSourceNode
    this.monitoringChain = null;
    
    // Normalization configuration
    this.normalizationConfig = {
      targetLoudness: -18,      // Target level in dBFS (-18 is broadcast standard)
      measurementWindow: 1000,  // Peak measurement window in ms
      smoothingFactor: 0.85,    // Gain smoothing (0-1, higher = smoother)
      maxGain: 6.0,             // Maximum allowed pre-gain
      minGain: 0.5,             // Minimum allowed pre-gain
      updateInterval: 100,      // Gain update frequency in ms
      calibrationPeriod: 2000,  // Initial measurement period in ms
      headroom: 3,              // Headroom in dB to prevent clipping
    };
  }

  /**
   * Initialize audio context
   */
  getAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return this.audioContext;
  }

  /**
   * Create output filter chain for normalizing remote participant audio
   * @param {MediaStreamTrack} audioTrack - The audio track to process
   * @param {string} participantId - Unique identifier for the participant
   * @returns {Object} Filter chain with nodes
   */
  async createOutputFilterChain(audioTrack, participantId) {
    try {
      const context = this.getAudioContext();
      
      // Ensure AudioContext is running (may be suspended in some browsers)
      if (context.state === 'suspended') {
        console.log('AudioContext is suspended, attempting to resume...');
        await context.resume();
        console.log(`AudioContext resumed, state: ${context.state}`);
      }
      
      // Check if we already have a chain for this participant
      const existingChain = this.outputChains.get(participantId);
      if (existingChain && existingChain.isActive) {
        console.log(`Reusing existing filter chain for participant ${participantId}`);
        return existingChain;
      }
      
      // Clone the track so we don't interfere with the original track's output
      // This allows the audio element to continue using the original track
      const clonedTrack = audioTrack.clone();
      
      // Create a MediaStream from the cloned track
      const mediaStream = new MediaStream([clonedTrack]);
      
      // Create source from the media stream
      let source;
      try {
        source = context.createMediaStreamSource(mediaStream);
        console.log(`Created MediaStreamSourceNode for participant ${participantId}`);
      } catch (error) {
        console.error(`Failed to create MediaStreamSourceNode for participant ${participantId}:`, error);
        throw error;
      }
      
      // Create analyser node for peak loudness measurement
      const analyserNode = context.createAnalyser();
      analyserNode.fftSize = 2048;
      analyserNode.smoothingTimeConstant = 0.8;
      
      // Pre-gain will be dynamically adjusted based on measured peak levels
      const preGainNode = context.createGain();
      preGainNode.gain.value = 1.0;
      
      // Dynamics compressor
      const compressor = context.createDynamicsCompressor();
      compressor.threshold.value = -24;
      compressor.knee.value = 30;
      compressor.ratio.value = 12;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.25;
      
      // Boost sound a little to compensate for compressor
      const makeupGainNode = context.createGain();
      makeupGainNode.gain.value = 1.5;
      
      // Connect the chain: source -> analyser -> pre-gain -> compressor -> makeup gain -> destination
      // The analyser measures the incoming audio before any processing
      source.connect(analyserNode);
      analyserNode.connect(preGainNode);
      preGainNode.connect(compressor);
      compressor.connect(makeupGainNode);
      makeupGainNode.connect(context.destination);
      
      const chain = {
        source,
        analyserNode,
        preGainNode,
        compressor,
        makeupGainNode,
        context,
        mediaStream,
        isActive: true,
        vad: null,
        normalization: {
          peakLevel: -Infinity,
          rmsLevel: -Infinity,
          targetGain: 1.0,
          currentGain: 1.0,
          isCalibrating: true,
          calibrationStartTime: Date.now(),
          updateInterval: null,
          peakHistory: [],
          isSpeaking: false,
        },
      };
      
      this.outputChains.set(participantId, chain);
      
      // Initialize VAD for voice activity detection
      try {
        console.log(`[VAD] Initializing voice activity detection for participant ${participantId}`);
        chain.vad = await MicVAD.new({
          // Specify where to load VAD assets from (copied by vite-plugin-static-copy)
          baseAssetPath: '/',
          onnxWASMBasePath: '/',
          getStream: async () => {
            console.log(`[VAD] getStream called for participant ${participantId}`);
            // Return the participant's MediaStream
            return mediaStream;
          },
          onSpeechStart: () => {
            console.log(`[VAD] Speech started for participant ${participantId}`);
            if (chain && chain.normalization) {
              chain.normalization.isSpeaking = true;
              console.log(`[VAD] isSpeaking set to true for participant ${participantId}`);
            }
          },
          onSpeechEnd: (audio) => {
            console.log(`[VAD] Speech ended for participant ${participantId}, audio length: ${audio.length}`);
            if (chain && chain.normalization) {
              chain.normalization.isSpeaking = false;
              console.log(`[VAD] isSpeaking set to false for participant ${participantId}`);
            }
          },
          onVADMisfire: () => {
            console.log(`[VAD] VAD misfire for participant ${participantId}`);
          },
          onFrameProcessed: (probs) => {
            // Log every 50th frame to avoid console spam
            if (Math.random() < 0.02) {
              console.log(`[VAD] Frame processed for ${participantId}, speech probability: ${probs.isSpeech}`);
            }
          },
        });
        
        // Start the VAD
        await chain.vad.start();
        console.log(`[VAD] Voice activity detection started for participant ${participantId}`);
      } catch (error) {
        console.error(`[VAD] Failed to initialize VAD for participant ${participantId}:`, error);
        console.error(`[VAD] Error details:`, error.message, error.stack);
        // Continue without VAD - normalization will work without speech detection
        chain.vad = null;
      }
      
      // Start adaptive normalization
      this.startAdaptiveNormalization(participantId);
      
      console.log(`Audio normalization chain created and connected for participant ${participantId}`);
      console.log(`Filter chain details: preGain=${preGainNode.gain.value}, makeupGain=${makeupGainNode.gain.value}`);
      console.log(`AudioContext state: ${context.state}`);
      return chain;
    } catch (error) {
      console.error('Error creating output filter chain:', error);
      throw error;
    }
  }

  /**
   * Measure peak loudness from the analyser node
   * @param {AnalyserNode} analyserNode - The analyser node to measure from
   * @returns {Object} Object containing peak and RMS levels in dB
   */
  measurePeakLoudness(analyserNode) {
    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);
    analyserNode.getFloatTimeDomainData(dataArray);
    
    // Calculate peak level
    let peak = 0;
    let sumSquares = 0;
    
    for (let i = 0; i < bufferLength; i++) {
      const abs = Math.abs(dataArray[i]);
      if (abs > peak) {
        peak = abs;
      }
      sumSquares += dataArray[i] * dataArray[i];
    }
    
    // Calculate RMS (Root Mean Square) for average loudness
    const rms = Math.sqrt(sumSquares / bufferLength);
    
    // Convert to dB (with floor to prevent -Infinity)
    const peakDb = peak > 0.0001 ? 20 * Math.log10(peak) : -80;
    const rmsDb = rms > 0.0001 ? 20 * Math.log10(rms) : -80;
    
    return { peakDb, rmsDb, peak, rms };
  }

  /**
   * Calculate target gain based on measured levels
   * @param {number} measuredDb - Measured peak level in dB
   * @param {number} targetDb - Target level in dB
   * @returns {number} Target gain value
   */
  calculateTargetGain(measuredDb, targetDb) {
    const config = this.normalizationConfig;
    
    // If signal is too quiet (below -60 dB), don't adjust
    if (measuredDb < -60) {
      return config.minGain;
    }
    
    // Calculate gain needed: target - measured + headroom
    const gainDb = targetDb - measuredDb + config.headroom;
    
    // Convert dB to linear gain
    let targetGain = Math.pow(10, gainDb / 20);
    
    // Clamp to min/max gain limits
    targetGain = Math.max(config.minGain, Math.min(config.maxGain, targetGain));
    
    return targetGain;
  }

  /**
   * Apply smooth gain transition
   * @param {Object} chain - Filter chain
   * @param {number} targetGain - Target gain value
   */
  applySmoothGain(chain, targetGain) {
    const config = this.normalizationConfig;
    const currentGain = chain.normalization.currentGain;
    
    // Apply exponential smoothing
    const smoothedGain = currentGain * config.smoothingFactor + 
                        targetGain * (1 - config.smoothingFactor);
    
    // Update the pre-gain node
    chain.preGainNode.gain.value = smoothedGain;
    chain.normalization.currentGain = smoothedGain;
  }

  /**
   * Start adaptive normalization loop for a participant
   * @param {string} participantId - Unique identifier for the participant
   */
  startAdaptiveNormalization(participantId) {
    const chain = this.outputChains.get(participantId);
    if (!chain || !chain.isActive) return;
    
    const config = this.normalizationConfig;
    const norm = chain.normalization;
    
    // Clear any existing interval
    if (norm.updateInterval) {
      clearInterval(norm.updateInterval);
    }
    
    // Start the normalization loop
    norm.updateInterval = setInterval(() => {
      if (!chain.isActive) {
        clearInterval(norm.updateInterval);
        return;
      }
      
      // Measure current audio levels
      const { peakDb, rmsDb } = this.measurePeakLoudness(chain.analyserNode);
      
      // Only update peak history when speech is detected
      // If VAD failed to initialize (chain.vad is null), fall back to always updating
      const vadAvailable = chain.vad !== null && chain.vad !== undefined;
      const shouldUpdatePeak = !vadAvailable || norm.isSpeaking;
      
      // Additionally, only add peaks above -50 dB to avoid boosting background noise
      const isMeaningfulAudio = peakDb > -50;
      
      if (shouldUpdatePeak && isMeaningfulAudio) {
        // Update peak history (keep last 10 measurements)
        norm.peakHistory.push(peakDb);
        if (norm.peakHistory.length > 10) {
          norm.peakHistory.shift();
        }
      }
      
      // Use the highest recent peak for more stable normalization
      // If no peak history exists yet, use current peak
      const recentPeak = norm.peakHistory.length > 0 
        ? Math.max(...norm.peakHistory.filter(p => p > -60))
        : peakDb;
      
      // Check if still in calibration period
      const calibrationElapsed = Date.now() - norm.calibrationStartTime;
      if (norm.isCalibrating && calibrationElapsed < config.calibrationPeriod) {
        // During calibration, just measure without adjusting (only when speaking or no VAD)
        if (shouldUpdatePeak) {
          norm.peakLevel = Math.max(norm.peakLevel, recentPeak);
          norm.rmsLevel = Math.max(norm.rmsLevel, rmsDb);
        }
        return;
      }
      
      // Exit calibration mode after calibration period
      if (norm.isCalibrating) {
        norm.isCalibrating = false;
        console.log(`[Normalization] Calibration complete for participant ${participantId}`);
        console.log(`[Normalization] Measured peak: ${norm.peakLevel.toFixed(2)} dB, RMS: ${norm.rmsLevel.toFixed(2)} dB`);
      }
      
      // Calculate target gain based on recent peak
      if (recentPeak > -60) {
        const targetGain = this.calculateTargetGain(recentPeak, config.targetLoudness);
        norm.targetGain = targetGain;
        
        // Apply smooth gain adjustment
        this.applySmoothGain(chain, targetGain);
        
        // Update stored levels
        norm.peakLevel = recentPeak;
        norm.rmsLevel = rmsDb;
      }
    }, config.updateInterval);
    
    console.log(`[Normalization] Started adaptive normalization for participant ${participantId}`);
  }

  /**
   * Stop adaptive normalization for a participant
   * @param {string} participantId - Unique identifier for the participant
   */
  stopAdaptiveNormalization(participantId) {
    const chain = this.outputChains.get(participantId);
    if (chain && chain.normalization.updateInterval) {
      clearInterval(chain.normalization.updateInterval);
      chain.normalization.updateInterval = null;
      console.log(`[Normalization] Stopped adaptive normalization for participant ${participantId}`);
    }
  }

  /**
   * Remove output filter chain for a participant
   * Disconnects all nodes and stops audio processing through Web Audio API
   * @param {string} participantId - Unique identifier for the participant
   */
  removeOutputFilterChain(participantId) {
    const chain = this.outputChains.get(participantId);
    if (chain) {
      try {
        // Stop adaptive normalization
        this.stopAdaptiveNormalization(participantId);
        
        // Cleanup VAD if it exists
        if (chain.vad) {
          try {
            console.log(`[VAD] Destroying voice activity detection for participant ${participantId}`);
            chain.vad.destroy();
            chain.vad = null;
          } catch (vadError) {
            console.error(`[VAD] Error destroying VAD for participant ${participantId}:`, vadError);
          }
        }
        
        // Disconnect all nodes
        if (chain.source) chain.source.disconnect();
        if (chain.analyserNode) chain.analyserNode.disconnect();
        if (chain.preGainNode) chain.preGainNode.disconnect();
        if (chain.compressor) chain.compressor.disconnect();
        if (chain.makeupGainNode) chain.makeupGainNode.disconnect();
        // Also handle old chains that might still have gainNode
        if (chain.gainNode) chain.gainNode.disconnect();
        
        // Stop the cloned track to free resources
        if (chain.mediaStream) {
          chain.mediaStream.getTracks().forEach(track => {
            track.stop();
            console.log(`[Cleanup] Stopped cloned track for participant ${participantId}`);
          });
        }
        
        // Mark as inactive and remove from output chains
        chain.isActive = false;
        this.outputChains.delete(participantId);
        console.log(`Audio normalization chain removed for participant ${participantId}`);
      } catch (error) {
        console.error('Error removing output filter chain:', error);
      }
    }
  }

  /**
   * Update output filter settings
   * @param {string} participantId - Unique identifier for the participant
   * @param {Object} settings - Filter settings
   */
  updateOutputFilterSettings(participantId, settings) {
    const chain = this.outputChains.get(participantId);
    if (!chain) return;

    try {
      if (settings.compressor) {
        const { threshold, knee, ratio, attack, release } = settings.compressor;
        if (threshold !== undefined) chain.compressor.threshold.value = threshold;
        if (knee !== undefined) chain.compressor.knee.value = knee;
        if (ratio !== undefined) chain.compressor.ratio.value = ratio;
        if (attack !== undefined) chain.compressor.attack.value = attack;
        if (release !== undefined) chain.compressor.release.value = release;
      }

      if (settings.preGain !== undefined && chain.preGainNode) {
        chain.preGainNode.gain.value = settings.preGain;
      }

      if (settings.makeupGain !== undefined && chain.makeupGainNode) {
        chain.makeupGainNode.gain.value = settings.makeupGain;
      }

      // Legacy support for old 'gain' parameter
      if (settings.gain !== undefined) {
        if (chain.makeupGainNode) {
          chain.makeupGainNode.gain.value = settings.gain;
        } else if (chain.gainNode) {
          // Support old chains
          chain.gainNode.gain.value = settings.gain;
        }
      }
    } catch (error) {
      console.error('Error updating output filter settings:', error);
    }
  }

  /**
   * Create audio monitoring chain (loopback)
   * @param {MediaStream} stream - The microphone stream to monitor
   * @returns {Object} Monitoring chain
   */
  createMonitoringChain(stream) {
    try {
      const context = this.getAudioContext();
      
      // Create source from stream
      const source = context.createMediaStreamSource(stream);
      
      // Create gain node (reduced to prevent feedback)
      const gainNode = context.createGain();
      gainNode.gain.value = 0.5; // 50% volume
      
      // Create delay node (prevents feedback loops)
      const delayNode = context.createDelay(0.1);
      delayNode.delayTime.value = 0.01; // 10ms delay
      
      // Connect: source -> gain -> delay -> destination
      source.connect(gainNode);
      gainNode.connect(delayNode);
      delayNode.connect(context.destination);
      
      this.monitoringChain = {
        source,
        gainNode,
        delayNode,
        context,
        isActive: true,
      };
      
      return this.monitoringChain;
    } catch (error) {
      console.error('Error creating monitoring chain:', error);
      throw error;
    }
  }

  /**
   * Remove monitoring chain
   */
  removeMonitoringChain() {
    if (this.monitoringChain) {
      try {
        const { source, gainNode, delayNode } = this.monitoringChain;
        if (source) source.disconnect();
        if (gainNode) gainNode.disconnect();
        if (delayNode) delayNode.disconnect();
        
        this.monitoringChain = null;
      } catch (error) {
        console.error('Error removing monitoring chain:', error);
      }
    }
  }

  /**
   * Update monitoring gain
   * @param {number} gain - Gain value (0.0 to 1.0)
   */
  updateMonitoringGain(gain) {
    if (this.monitoringChain && this.monitoringChain.gainNode) {
      this.monitoringChain.gainNode.gain.value = Math.max(0, Math.min(1, gain));
    }
  }

  /**
   * Check if monitoring is active
   * @returns {boolean}
   */
  isMonitoring() {
    return this.monitoringChain !== null && this.monitoringChain.isActive;
  }

  /**
   * Get output chain for a participant
   * @param {string} participantId
   * @returns {Object|null}
   */
  getOutputChain(participantId) {
    return this.outputChains.get(participantId) || null;
  }

  /**
   * Check if output filtering is active for a participant
   * @param {string} participantId
   * @returns {boolean}
   */
  hasOutputFiltering(participantId) {
    const chain = this.outputChains.get(participantId);
    return chain !== null && chain.isActive;
  }

  /**
   * Test the filter chain by temporarily setting gain values
   * Useful for debugging to verify the chain is active
   * @param {string} participantId - Participant ID
   * @param {number} testGain - Test gain value (0.0 to mute, 2.0 for double volume, etc.)
   * @param {number} duration - Duration in milliseconds to apply test gain (default: 2000ms)
   */
  testFilterChain(participantId, testGain = 0, duration = 2000) {
    const chain = this.outputChains.get(participantId);
    if (!chain || !chain.isActive) {
      console.warn(`No active filter chain found for participant ${participantId}`);
      return;
    }

    const originalGain = chain.makeupGainNode.gain.value;
    console.log(`Testing filter chain for participant ${participantId}`);
    console.log(`Setting makeupGain from ${originalGain} to ${testGain} for ${duration}ms`);
    
    // Set test gain
    chain.makeupGainNode.gain.value = testGain;
    
    // Restore original gain after duration
    setTimeout(() => {
      chain.makeupGainNode.gain.value = originalGain;
      console.log(`Restored makeupGain to ${originalGain} for participant ${participantId}`);
    }, duration);
  }

  /**
   * Get detailed information about all active filter chains
   * Useful for debugging
   * @returns {Array} Array of chain information objects
   */
  getFilterChainDebugInfo() {
    const info = [];
    
    for (const [participantId, chain] of this.outputChains.entries()) {
      const debugInfo = {
        participantId,
        isActive: chain.isActive,
        hasSource: !!chain.source,
        hasMediaStream: !!chain.mediaStream,
        preGain: chain.preGainNode?.gain.value,
        makeupGain: chain.makeupGainNode?.gain.value,
        compressorThreshold: chain.compressor?.threshold.value,
        compressorRatio: chain.compressor?.ratio.value,
      };
      
      // Add normalization info if available
      if (chain.normalization) {
        debugInfo.normalization = {
          peakLevel: chain.normalization.peakLevel?.toFixed(2),
          rmsLevel: chain.normalization.rmsLevel?.toFixed(2),
          targetGain: chain.normalization.targetGain?.toFixed(2),
          currentGain: chain.normalization.currentGain?.toFixed(2),
          isCalibrating: chain.normalization.isCalibrating,
          isRunning: !!chain.normalization.updateInterval,
        };
      }
      
      info.push(debugInfo);
    }
    
    return info;
  }

  /**
   * Clean up all filter chains
   */
  cleanup() {
    // Remove all output chains
    for (const participantId of this.outputChains.keys()) {
      this.removeOutputFilterChain(participantId);
    }
    
    // Clear the element source map
    this.elementSourceMap.clear();
    
    // Remove monitoring chain
    this.removeMonitoringChain();
    
    // Close audio context
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch((error) => {
        console.error('Error closing audio context:', error);
      });
      this.audioContext = null;
    }
  }
}

// Export singleton instance
const audioFilterService = new AudioFilterService();
export default audioFilterService;
