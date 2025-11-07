# Audio Normalization Overview

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Audio Flow Diagram](#audio-flow-diagram)
3. [Implementation Details](#implementation-details)
4. [Configuration Parameters](#configuration-parameters)
5. [Current Limitations](#current-limitations)
6. [Production Improvements](#production-improvements)

---

## System Architecture

The audio normalization system is designed to automatically adjust the volume levels of remote participants in an Amazon IVS Real-Time stage. It samples the loudness of participant speech and applies gain and dynamics compression such that the target speaking volume for each participant tends towards a target loudness (`-18dbFS` by default). [Silero VAD](https://github.com/snakers4/silero-vad) is used for voice detection via the [vad-web](https://github.com/ricky0123/vad) package. The goal of this feature is to ensure that all participants are heard at consistent, comfortable levels regardless of their microphone settings or speaking volume.

### Key Components

1. **AudioFilterService** (`src/services/AudioFilterService.js`)

   - Singleton service managing Web Audio API operations
   - Creates and maintains audio processing chains for each participant
   - Implements adaptive normalization algorithm

2. **AudioFiltersContext** (`src/contexts/AudioFiltersContext.jsx`)

   - React context providing audio filtering capabilities
   - Manages filter settings and state across the application

3. **useAudioFilters Hook** (`src/hooks/useAudioFilters.js`)

   - Hook interface for components to interact with audio filters
   - Handles filter lifecycle (enable/disable, apply/remove)

4. **Participant Component** (`src/components/Participant.jsx`)
   - Integrates normalization into the participant rendering
   - Manages audio element and filter chain lifecycle

---

## Audio Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AMAZON IVS REAL-TIME STAGE                          │
│                                                                             │
│  Remote Participant A                    Remote Participant B               │
│  ┌─────────────┐                        ┌─────────────┐                     │
│  │ Microphone  │                        │ Microphone  │                     │
│  │  + Camera   │                        │  + Camera   │                     │
│  └──────┬──────┘                        └──────┬──────┘                     │
│         │                                      │                            │
│         │ MediaStream                          │ MediaStream                │
│         │ (Audio + Video)                      │ (Audio + Video)            │
│         └──────────────────┬───────────────────┘                            │
│                            │                                                │
│                            │ IVS Real-Time WebRTC                           │
│                            ▼                                                │
└─────────────────────────────────────────────────────────────────────────────┘
                             │
                             │ Network Transmission
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          LOCAL CLIENT (Viewer)                              │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                    Stage Context / WebRTC Layer                       │  │
│  │                                                                       │  │
│  │  Receives MediaStream for each remote participant:                    │  │
│  │  • Audio Track (MediaStreamTrack)                                     │  │
│  │  • Video Track (MediaStreamTrack)                                     │  │
│  └───────────────────────────────┬───────────────────────────────────────┘  │
│                                  │                                          │
│                                  │ Audio Track                              │
│                                  ▼                                          │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                    Participant Component                              │  │
│  │                                                                       │  │
│  │  1. Creates <audio> element with autoPlay                             │  │
│  │  2. Checks if normalization is enabled                                │  │
│  │  3. Routes audio based on setting:                                    │  │
│  └───────┬───────────────────────────────────┬───────────────────────────┘  │
│          │                                   │                              │
│          │ IF DISABLED                       │ IF ENABLED                   │
│          ▼                                   ▼                              │
│  ┌──────────────────┐              ┌────────────────────────┐               │
│  │  Native Audio    │              │  Clone Audio Track     │               │
│  │   Playback       │              │  (preserve original)   │               │
│  │                  │              └───────────┬────────────┘               │
│  │  <audio>         │                          │                            │
│  │  element plays   │                          │ Cloned Track               │
│  │  directly to     │                          ▼                            │
│  │  speakers        │              ┌────────────────────────────────────┐   │
│  │  (muted=false)   │              │  Web Audio API Processing Chain    │   │
│  └────────┬─────────┘              │  (AudioFilterService)              │   │
│           │                        │                                    │   │
│           │                        │  ┌──────────────────────────────┐  │   │
│           │                        │  │ 1. MediaStreamSourceNode     │  │   │
│           │                        │  │    (creates Web Audio source)│  │   │
│           │                        │  └────────────┬─────────────────┘  │   │
│           │                        │               │                    │   │
│           │                        │               ▼                    │   │
│           │                        │  ┌──────────────────────────────┐  │   │
│           │                        │  │ 2. AnalyserNode              │  │   │
│           │                        │  │    • FFT Size: 2048          │  │   │
│           │                        │  │    • Measures peak & RMS     │  │   │
│           │                        │  │    • Time domain analysis    │  │   │
│           │                        │  └────────────┬─────────────────┘  │   │
│           │                        │               │                    │   │
│           │                        │               ▼                    │   │
│           │                        │  ┌──────────────────────────────┐  │   │
│           │                        │  │ 3. Pre-Gain Node             │  │   │
│           │                        │  │    • Dynamic gain adjustment │  │   │
│           │                        │  │    • Range: 0.5x to 6.0x     │  │   │
│           │                        │  │    • Smoothing: 85%          │  │   │
│           │                        │  │    • Updated every 100ms     │  │   │
│           │                        │  └────────────┬─────────────────┘  │   │
│           │                        │               │                    │   │
│           │                        │               ▼                    │   │
│           │                        │  ┌──────────────────────────────┐  │   │
│           │                        │  │ 4. DynamicsCompressor        │  │   │
│           │                        │  │    • Threshold: -24 dB       │  │   │
│           │                        │  │    • Ratio: 12:1             │  │   │
│           │                        │  │    • Knee: 30 dB             │  │   │
│           │                        │  │    • Attack: 3ms             │  │   │
│           │                        │  │    • Release: 250ms          │  │   │
│           │                        │  └────────────┬─────────────────┘  │   │
│           │                        │               │                    │   │
│           │                        │               ▼                    │   │
│           │                        │  ┌──────────────────────────────┐  │   │
│           │                        │  │ 5. Makeup Gain Node          │  │   │
│           │                        │  │    • Fixed gain: 1.5x        │  │   │
│           │                        │  │    • Compensates compressor  │  │   │
│           │                        │  └────────────┬─────────────────┘  │   │
│           │                        │               │                    │   │
│           │                        │               ▼                    │   │
│           │                        │  ┌──────────────────────────────┐  │   │
│           │                        │  │ 6. AudioContext.destination  │  │   │
│           │                        │  │    (system audio output)     │  │   │
│           │                        │  └──────────────────────────────┘  │   │
│           │                        │                                    │   │
│           │                        │  Note: <audio> element is muted    │   │
│           │                        │  to prevent duplicate playback     │   │
│           │                        └────────────────────────────────────┘   │
│           │                                         │                       │
│           └─────────────────────┬───────────────────┘                       │
│                                 │                                           │
│                                 ▼                                           │
│                    ┌────────────────────────┐                               │
│                    │   System Audio Output  │                               │
│                    │      (Speakers)        │                               │
│                    └────────────────────────┘                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                    VOICE ACTIVITY DETECTION (VAD)                           │
│                                                                             │
│  Parallel processing using vad-web:                                         │
│                                                                             │
│  Cloned MediaStream ──────────────┐                                         │
│                                   │                                         │
│                                   ▼                                         │
│                          ┌─────────────────┐                                │
│                          │   MicVAD Model  │                                │
│                          │   (ONNX/WASM)   │                                │
│                          └────────┬────────┘                                │
│                                   │                                         │
│                                   ▼                                         │
│                          Speech Detection:                                  │
│                          • onSpeechStart → Set isSpeaking = true.           │
│                          • onSpeechEnd → Set isSpeaking = false             │
│                                   │                                         │
│                                   │ Controls                                │
│                                   ▼                                         │
│                    ┌──────────────────────────────┐                         │
│                    │  Adaptive Normalization Loop │                         │
│                    │  (runs every 100ms)          │                         │
│                    │                              │                         │
│                    │  • Only updates gain during  │                         │
│                    │    speech (isSpeaking=true)  │                         │
│                    │  • Ignores background noise  │                         │
│                    │  • Maintains peak history    │                         │
│                    └──────────────────────────────┘                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Details

### Adaptive Normalization Algorithm

The system uses an adaptive normalization algorithm that continuously monitors and adjusts audio levels:

#### 1. **Calibration Phase (First 2 seconds)**

- Enters the calibration phase when a participant starts speaking (when VAD detects speech)
- Measures peak and RMS levels without applying gain adjustments
- Establishes baseline audio characteristics

#### 2. **Peak Detection**

```javascript
// Analyze time-domain audio data
AnalyserNode.getFloatTimeDomainData(buffer)

// Calculates:
- Peak level: Maximum absolute amplitude
- RMS level: Root Mean Square (average loudness)
- Converts to dB: 20 * log10(amplitude)
```

#### 3. **Target Gain Calculation**

```javascript
// Target: -18 dBFS (broadcast standard)
// Headroom: +3 dB to prevent clipping
gainDb = targetLoudness - measuredPeak + headroom;
targetGain = 10 ^ (gainDb / 20);

// Clamped to range: 0.5x to 6.0x
```

#### 4. **Smooth Gain Application**

```javascript
// Exponential smoothing (85% factor)
smoothedGain = currentGain * 0.85 + targetGain * 0.15;
```

#### 5. **Voice Activity Detection (VAD)**

- Uses [Silero VAD](https://github.com/snakers4/silero-vad) via the [vad-web](https://github.com/ricky0123/vad) package
- ONNX/WASM-based speech detection
- Prevents non-speech noise from triggering gain adjustments
- Falls back gracefully if VAD initialization fails

### Audio Processing Chain Configuration

#### **AnalyserNode**

- **Purpose**: Real-time audio level measurement
- **FFT Size**: 2048 samples
- **Smoothing**: 0.8 (time constant)
- **Measurements**: Peak and RMS in dB

#### **Pre-Gain Node**

- **Purpose**: Dynamic level adjustment before compression
- **Range**: 0.5x (−6dB) to 6.0x (+15.6dB)
- **Update Frequency**: Every 100ms
- **Smoothing**: 85% exponential smoothing

#### **DynamicsCompressor**

- **Threshold**: -24 dB (starts compressing above this level)
- **Ratio**: 12:1 (heavy compression)
- **Knee**: 30 dB (smooth compression curve)
- **Attack**: 3ms (fast response to transients)
- **Release**: 250ms (natural decay)

#### **Makeup Gain Node**

- **Purpose**: Compensate for compression-induced level reduction
- **Value**: 1.5x (approximately +3.5dB)
- **Fixed**: Not dynamically adjusted

---

## Configuration Parameters

Located in `AudioFilterService.normalizationConfig`:

```javascript
{
  targetLoudness: -18,      // Target level in dBFS (-18 is broadcast standard)
  measurementWindow: 1000,  // Peak measurement window in ms
  smoothingFactor: 0.85,    // Gain smoothing (0-1, higher = smoother)
  maxGain: 6.0,             // Maximum allowed pre-gain (boost up to 6x)
  minGain: 0.5,             // Minimum allowed pre-gain (reduce to 50%)
  updateInterval: 100,      // Gain update frequency in ms
  calibrationPeriod: 2000,  // Initial measurement period in ms
  headroom: 3,              // Headroom in dB to prevent clipping
}
```

### Tuning Recommendations

- **targetLoudness**: Adjust for desired output level (-20 to -14 dBFS typical range)
- **smoothingFactor**: Higher = smoother transitions, Lower = faster response
- **maxGain**: Limit to prevent excessive noise amplification
- **updateInterval**: Balance between responsiveness and CPU usage

---

## Known Limitations

### 1. **Browser Compatibility**

- **Issue**: Web Audio API support varies across browsers
- **Impact**: Older browsers may not support all features
- **Affected**: Safari < 14.1, older Chrome versions
- **Workaround**: Feature detection and graceful fallback to native playback

### 2. **Track Cloning Overhead**

- **Issue**: Each participant's audio track is cloned for processing
- **Impact**: Additional memory usage per participant
- **Scale**: 10+ participants may impact performance
- **Why**: Prevents interference with original track used by audio element. Cloning is unneeded if normalization will always be enabled.

### 3. **VAD Initialization Reliability**

- **Issue**: ONNX/WASM loading can fail in some environments
- **Impact**: Falls back to always-on normalization (processes noise)
- **Causes**: Asset loading failures, WASM not supported
- **Mitigation**: Graceful fallback, detailed error logging

### 4. **Calibration Delay**

- **Issue**: 2-second calibration period before normalization activates
- **Impact**: First words may be at incorrect volume
- **Workaround**: Could implement additional pre-calibration using default gain

### 5. **Single Target Loudness**

- **Issue**: All participants normalized to same target (-18 dBFS)
- **Impact**: No per-participant volume control
- **Limitation**: User cannot adjust relative volumes between participants

### 6. **Peak vs. Average Loudness**

- **Issue**: Currently uses peak detection, not integrated loudness (LUFS)
- **Impact**: May not match perceived loudness for all content
- **Note**: Peak is simpler but less accurate than LUFS/EBU R128

### 7. **No Persistent Settings**

- **Issue**: Filter chains recreated on every page load/participant join
- **Impact**: No learning or adaptation across sessions
- **Enhancement**: Could store per-user calibration profiles

### 8. **Audio Element Muting**

- **Issue**: When normalization is enabled, audio element must be muted
- **Impact**: Native browser audio controls become non-functional
- **Why**: Prevents duplicate playback (both through element and Web Audio)

### 9. **CPU Usage**

- **Issue**: 100ms update interval for each participant
- **Impact**: 10 participants = 100 updates/second
- **Scale**: May impact battery life on mobile devices
- **Optimization**: Could reduce update frequency or use shared scheduler

---

## Production Improvements

### 1. **Advanced Loudness Metering**

**Current**: Simple peak and RMS measurement  
**Improvement**: Implement EBU R128 / ITU-R BS.1770 standard

```javascript
// Implement K-weighted loudness measurement
class LoudnessMeter {
  constructor() {
    this.kWeightFilter = this.createKWeightFilter();
  }

  measureLUFS(audioBuffer) {
    // Apply K-weighting filter
    // Calculate integrated loudness over time
    // Return LUFS (Loudness Units relative to Full Scale)
  }
}
```

**Benefits**:

- More accurate perceived loudness matching
- Industry-standard measurement
- Better consistency across different content types

---

### 2. **Per-Participant Volume Controls**

**Current**: All participants at same target level  
**Improvement**: Allow user adjustment of relative volumes

```javascript
// User preferences per participant
participantSettings = {
  [participantId]: {
    relativeVolume: 1.0, // 0.5 to 2.0 range
    targetLoudness: -18, // Can override per-user
  },
};

// Apply in gain calculation
finalGain = calculatedGain * relativeVolume;
```

**Benefits**:

- User control over mix balance
- Accommodate different speaking styles
- Personal preference support

---

### 3. **Intelligent Voice Activity Detection**

**Current**: Binary speech/non-speech detection  
**Improvement**: Multi-level activity detection with confidence scoring

```javascript
class EnhancedVAD {
  analyze(audioFrame) {
    return {
      isSpeaking: boolean,
      confidence: 0.0 - 1.0,
      noiseLevel: dBFS,
      speechQuality: 0.0 - 1.0,
    };
  }
}

// Use confidence for weighted gain updates
if (vad.confidence > 0.7) {
  updateGain(measuredLevel);
}
```

**Benefits**:

- Better handling of background noise
- Smoother transitions
- Reduced false triggers

---

### 4. **Adaptive Lookahead Compression**

**Current**: Real-time compression (no lookahead)  
**Improvement**: Implement lookahead buffer for predictive compression

```javascript
class LookaheadCompressor {
  constructor() {
    this.lookaheadBuffer = [];
    this.lookaheadTime = 10; // ms
  }

  process(sample) {
    // Analyze future samples
    // Apply compression proactively
    // Prevents transient clipping
  }
}
```

**Benefits**:

- Cleaner transient handling
- Reduced artifacts
- More transparent compression

---

### 5. **Machine Learning-Based Normalization**

**Current**: Rule-based gain calculation  
**Improvement**: ML model trained on diverse audio content

```javascript
class MLNormalizer {
  constructor() {
    this.model = loadTFLiteModel("audio-normalizer.tflite");
  }

  async predictOptimalGain(audioFeatures) {
    // Input: spectral features, temporal patterns
    // Output: optimal gain curve over time
    return this.model.predict(audioFeatures);
  }
}
```

**Benefits**:

- Context-aware processing
- Learn from user adjustments
- Adapt to individual speaking patterns

---

### 6. **Persistent User Profiles**

**Current**: No storage of calibration data  
**Improvement**: Store per-participant audio profiles

```javascript
class ParticipantAudioProfile {
  store(userId, profile) {
    localStorage.setItem(
      `audio-profile-${userId}`,
      JSON.stringify({
        averageLoudness: -20,
        dynamicRange: 15,
        preferredGain: 1.2,
        lastCalibrated: Date.now(),
      })
    );
  }

  load(userId) {
    // Skip calibration if recent profile exists
    // Apply known-good settings immediately
  }
}
```

**Benefits**:

- Instant optimal audio on rejoin
- Consistent experience across sessions
- Reduced calibration delays

---

### 7. **Multi-Band Processing**

**Current**: Single-band (full spectrum) processing  
**Improvement**: Frequency-specific gain control

```javascript
class MultiBandNormalizer {
  constructor() {
    this.bands = [
      { freq: 100, gain: 1.0 }, // Low
      { freq: 1000, gain: 1.0 }, // Mid
      { freq: 8000, gain: 1.0 }, // High
    ];
  }

  process(audio) {
    // Split into frequency bands
    // Apply independent normalization
    // Recombine for natural sound
  }
}
```

**Benefits**:

- Better handling of different voice characteristics
- Reduced low-frequency rumble
- Enhanced speech clarity

---

### 8. **Automatic Noise Gate**

**Current**: VAD only controls gain updates  
**Improvement**: Dynamic noise gate with adjustable threshold

```javascript
class NoiseGate {
  constructor() {
    this.threshold = -50; // dBFS
    this.ratio = 10; // Reduction ratio
    this.attack = 5; // ms
    this.release = 50; // ms
  }

  process(sample, level) {
    if (level < this.threshold) {
      return sample * (1 / this.ratio); // Reduce noise
    }
    return sample;
  }
}
```

**Benefits**:

- Automatic background noise reduction
- Cleaner audio during pauses
- Improved SNR (Signal-to-Noise Ratio)

---

### 9. **Quality Monitoring & Analytics**

**Current**: Console logging only  
**Improvement**: Comprehensive telemetry and quality metrics

```javascript
class AudioQualityMonitor {
  track(participantId) {
    return {
      metrics: {
        averageLoudness: -18.5,
        peakLoudness: -6.2,
        dynamicRange: 12.3,
        clippingEvents: 0,
        gainAdjustments: 145,
        vadAccuracy: 0.94,
      },

      timeline: [
        { time: 0, loudness: -20, gain: 1.2 },
        { time: 100, loudness: -19, gain: 1.25 },
        // ...
      ],

      alerts: [{ type: "warning", message: "High noise floor detected" }],
    };
  }
}
```

**Benefits**:

- Real-time quality feedback
- Performance monitoring
- User experience optimization
- Debug assistance

---

### 10. **WebAssembly Audio Worklet**

**Current**: JavaScript-based processing on main thread  
**Improvement**: Move processing to AudioWorklet with WASM

```javascript
// audio-worklet-processor.js
class WASMNormalizerProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.wasmModule = loadWASM("audio-normalizer.wasm");
  }

  process(inputs, outputs) {
    // Process audio in dedicated thread
    // Lower latency, better performance
    return true;
  }
}
```

**Benefits**:

- Off-main-thread processing
- Better performance and latency
- Reduced jank/stutter
- Scalable to more participants

---

### 11. **Fallback Strategy System**

**Current**: Basic feature detection  
**Improvement**: Progressive enhancement with multiple fallback layers

```javascript
class AudioProcessorFactory {
  create() {
    if (supportsAudioWorklet && supportsWASM) {
      return new WASMWorkletProcessor();
    } else if (supportsWebAudio) {
      return new WebAudioProcessor();
    } else if (supportsGainNode) {
      return new SimpleGainProcessor();
    } else {
      return new NativeAudioProcessor();
    }
  }
}
```

**Benefits**:

- Maximum compatibility
- Graceful degradation
- Optimal performance on capable browsers
- Consistent UX across platforms

---

### 12. **Real-Time Visualization**

**Current**: No visual feedback  
**Improvement**: Live audio level meters and processing indicators

```javascript
class AudioVisualizer {
  render(canvasContext, audioData) {
    // Draw:
    // - Input level meter
    // - Output level meter
    // - Gain reduction meter
    // - Speech activity indicator
    // - Waveform/spectrogram
  }
}
```

**Benefits**:

- User feedback and confidence
- Debugging and troubleshooting
- Educational value
- Professional appearance

---

## Summary

The current implementation provides a solid foundation for audio normalization in a demo/prototype context. It successfully:

✅ Normalizes audio levels across participants  
✅ Handles varying microphone levels  
✅ Uses industry-standard Web Audio API  
✅ Implements voice activity detection  
✅ Provides graceful fallbacks

For production deployment, consider implementing:

🎯 **High Priority**:

- Per-participant volume controls
- Persistent audio profiles
- Quality monitoring and analytics
- Better error handling and recovery

🎯 **Medium Priority**:

- Advanced loudness metering (LUFS)
- Multi-band processing
- Noise gate implementation
- WebAssembly optimization

🎯 **Low Priority** (nice-to-have):

- ML-based normalization
- Real-time visualization
- Lookahead compression
- Extensive telemetry
