# Amazon Voice Focus Overview

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Audio Flow Diagram](#audio-flow-diagram)
3. [Implementation Details](#implementation-details)
4. [Configuration Parameters](#configuration-parameters)
5. [Current Limitations](#current-limitations)
6. [Production Improvements](#production-improvements)

---

## System Architecture

[Amazon Voice Focus](https://aws.github.io/amazon-chime-sdk-js/modules/amazonvoice_focus.html#what-is-amazon-voice-focus) is an AI-powered noise suppression feature provided by the Amazon Chime SDK. It uses machine learning to identify and remove background noise from audio input while preserving the speaker's voice. In this implementation, Voice Focus is applied to the local participant's microphone input before publishing to the Amazon IVS Real-Time stage.

The system leverages the `VoiceFocusDeviceTransformer` from the Amazon Chime SDK to create a "transform device" that wraps the user's physical microphone and applies real-time noise suppression. This transformed device is then used as the audio source for the IVS stage.

In cases where Voice Focus is not available, the solution falls back on the default browser-provided noise suppression, if it exists.

### Key Components

1. **VoiceFocusService** (`src/services/VoiceFocusService.js`)

   - Singleton service managing Voice Focus lifecycle
   - Handles initialization, device creation, and cleanup
   - Wraps Amazon Chime SDK's `VoiceFocusDeviceTransformer`

2. **AudioFiltersContext** (`src/contexts/AudioFiltersContext.jsx`)

   - React context providing Voice Focus state management
   - Exposes Voice Focus controls to the entire application

3. **useAudioFilters Hook** (`src/hooks/useAudioFilters.js`)

   - Hook interface for components to interact with Voice Focus
   - Manages Voice Focus enable/disable state
   - Handles browser support detection

4. **useLocalMedia Hook** (`src/hooks/useLocalMedia.js`)

   - Applies Voice Focus when creating audio devices
   - Integrates Voice Focus into the media device lifecycle
   - Falls back to native microphone if Voice Focus fails

5. **StageStrategy** (`src/sdk/StageStrategy.js`)
   - Publishes the Voice Focus-transformed audio to the IVS stage
   - Manages which media streams are sent to the stage

---

## Audio Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                          LOCAL PARTICIPANT                                   │
│                                                                              │
│  ┌──────────────────────┐                                                    │
│  │   Physical Device    │                                                    │
│  │    (Microphone)      │                                                    │
│  └──────────┬───────────┘                                                    │
│             │                                                                │
│             │ Raw Audio Input                                                │
│             │ (with background noise)                                        │
│             ▼                                                                │
│  ┌────────────────────────────────────────────────────────┐                  │
│  │            Voice Focus Decision Point                  │                  │
│  │                                                        │                  │
│  │  Check voiceFocusEnabled setting:                      │                  │
│  │  • User toggle in Settings                             │                  │
│  │  • Browser support check                               │                  │
│  │  • Initialization status                               │                  │
│  └────────┬───────────────────────────────┬───────────────┘                  │
│           │                               │                                  │
│           │ IF DISABLED                   │ IF ENABLED                       │
│           ▼                               ▼                                  │
│  ┌─────────────────────┐      ┌───────────────────────────────────────────┐  │
│  │  Native Microphone  │      │   Amazon Chime SDK Voice Focus            │  │
│  │     (Standard)      │      │   VoiceFocusDeviceTransformer             │  │
│  │                     │      │                                           │  │
│  │  Device ID          │      │  ┌─────────────────────────────────────┐  │  │
│  │  + getUserMedia()   │      │  │ 1. Initialize Transformer           │  │  │
│  │                     │      │  │    • Load ML models                 │  │  │
│  │  Returns:           │      │  │    • Check browser support          │  │  │
│  │  MediaStreamTrack   │      │  │    • Create audio context           │  │  │
│  └──────────┬──────────┘      │  └──────────────┬──────────────────────┘  │  │
│             │                 │                 │                         │  │
│             │                 │                 ▼                         │  │
│             │                 │  ┌─────────────────────────────────────┐  │  │
│             │                 │  │ 2. Create Transform Device          │  │  │
│             │                 │  │    transformer.createTransformDevice│  │  │
│             │                 │  │    (deviceId)                       │  │  │
│             │                 │  │                                     │  │  │
│             │                 │  │    Input: Device ID                 │  │  │
│             │                 │  │    Output: Voice Focus Device       │  │  │
│             │                 │  │            (transform constraint)   │  │  │
│             │                 │  └──────────────┬──────────────────────┘  │  │
│             │                 │                 │                         │  │
│             │                 │                 ▼                         │  │
│             │                 │  ┌─────────────────────────────────────┐  │  │
│             │                 │  │ 3. Get Transformed Stream           │  │  │
│             │                 │  │    navigator.mediaDevices           │  │  │
│             │                 │  │    .getUserMedia({                  │  │  │
│             │                 │  │      audio: vfDevice                │  │  │
│             │                 │  │    })                               │  │  │
│             │                 │  │                                     │  │  │
│             │                 │  │    Returns: MediaStream with        │  │  │
│             │                 │  │    noise-suppressed audio           │  │  │
│             │                 │  └──────────────┬──────────────────────┘  │  │
│             │                 │                 │                         │  │
│             │                 │                 │                         │  │
│             │                 │  ┌──────────────▼──────────────────────┐  │  │
│             │                 │  │ Voice Focus Processing Pipeline     │  │  │
│             │                 │  │                                     │  │  │
│             │                 │  │  • ML-based noise detection         │  │  │
│             │                 │  │  • Spectral analysis                │  │  │
│             │                 │  │  • Voice isolation                  │  │  │
│             │                 │  │  • Background noise suppression     │  │  │
│             │                 │  │                                     │  │  │
│             │                 │  │  Models: Amazon Chime Voice Focus   │  │  │
│             │                 │  │  • 'default' (noise suppression)    │  │  │
│             │                 │  │  • 'ns_es' (echo reduction)         │  │  │
│             │                 │  └──────────────┬──────────────────────┘  │  │
│             │                 │                 │                         │  │
│             │                 │                 │ Cleaned Audio           │  │
│             │                 │                 ▼                         │  │
│             │                 │  ┌────────────────────────────────────┐   │  │
│             │                 │  │  MediaStreamTrack                  │   │  │
│             │                 │  │  (Voice Focus Applied)             │   │  │
│             │                 │  └──────────────┬─────────────────────┘   │  │
│             │                 └─────────────────┼─────────────────────────┘  │
│             │                                   │                            │
│             └────────────────────┬──────────────┘                            │
│                                  │                                           │
│                                  │ MediaStreamTrack (Audio)                  │
│                                  ▼                                           │
│  ┌───────────────────────────────────────────────────────────────────────┐   │
│  │                    useLocalMedia Hook                                 │   │
│  │                                                                       │   │
│  │  Creates LocalStageStream:                                            │   │
│  │  • Wraps MediaStreamTrack                                             │   │
│  └──────────────────────────────────┬────────────────────────────────────┘   │
│                                     │                                        │
│                                     │ LocalStageStream                       │
│                                     ▼                                        │
│  ┌───────────────────────────────────────────────────────────────────────┐   │
│  │                     StageStrategy                                     │   │
│  │                                                                       │   │
│  │  stageStreamsToPublish() returns:                                     │   │
│  │  • Audio Stream (Voice Focus or Native)                               │   │
│  │  • Video Stream                                                       │   │
│  └──────────────────────────────────┬────────────────────────────────────┘   │
│                                     │                                        │
│                                     │ Streams to Publish                     │
│                                     ▼                                        │
│  ┌───────────────────────────────────────────────────────────────────────┐   │
│  │                  Amazon IVS Real-Time Stage                           │   │
│  │                  (Stage.join() + WebRTC)                              │   │
│  │                                                                       │   │
│  │  • Publishes audio stream to stage                                    │   │
│  │  • Handles WebRTC connections                                         │   │
│  │  • Manages participant state                                          │   │
│  └──────────────────────────────────┬────────────────────────────────────┘   │
│                                     │                                        │
└─────────────────────────────────────┼────────────────────────────────────────┘
                                      │
                                      │ WebRTC Transmission
                                      ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                        REMOTE PARTICIPANTS                                   │
│                                                                              │
│  Receive clean audio without background noise via IVS Real-Time stage        │
│  • No additional processing needed                                           │
│  • Voice Focus applied at source (publisher side)                            │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────────────────────────┐
│                        ERROR HANDLING & FALLBACK                             │
│                                                                              │
│  Voice Focus Failure Scenarios:                                              │
│                                                                              │
│  1. Browser Not Supported                                                    │
│     └─> Fall back to native microphone                                       │
│                                                                              │
│  2. Transformer Initialization Failed                                        │
│     └─> Show error toast                                                     │
│     └─> Fall back to native microphone                                       │
│                                                                              │
│  3. Transform Device Creation Failed                                         │
│     └─> Log error                                                            │
│     └─> Fall back to native microphone                                       │
│                                                                              │
│  4. getUserMedia with Voice Focus Device Failed                              │
│     └─> Catch error                                                          │
│     └─> Fall back to native microphone                                       │
│     └─> Show error toast                                                     │
│                                                                              │
│  In all cases, the user can still join the stage with standard audio         │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Details

### Voice Focus Initialization Flow

#### 1. **Browser Support Check**

On application load, the system checks if Voice Focus is supported:

```javascript
// In useAudioFilters hook
const supported = await voiceFocusService.checkSupport();
// Uses: VoiceFocusDeviceTransformer.isSupported()
```

**Requirements**:

- WebAssembly (WASM) support
- Web Audio API support
- Sufficient CPU/memory resources

#### 2. **Transformer Initialization**

When Voice Focus is enabled, the transformer is initialized with a specification:

```javascript
const spec = {
  name: "default", // Noise suppression only
  variant: "c20", // Quality level (c10, c20, c50, c100)
};

const options = {
  preload: false, // By default, this demo does not preload to save bandwidth
};

transformer = await VoiceFocusDeviceTransformer.create(spec, options);
```

**Specification Options**:

- **name**: `'default'` (noise suppression)
- **variant**: Quality vs. CPU tradeoff
  - `c10`: Lowest CPU, basic quality
  - `c20`: Balanced (default)
  - `c50`: Higher quality
  - `c100`: Highest quality, most CPU

#### 3. **Transform Device Creation**

The transformer wraps the user's device ID to create a Voice Focus device:

```javascript
const vfDevice = await transformer.createTransformDevice(deviceId);
// Returns: Voice Focus device constraint (not a MediaStream)
```

This device acts as a constraint that can be passed to `getUserMedia()`.

#### 4. **Audio Stream Acquisition**

The Voice Focus device is used to get a transformed audio stream:

```javascript
const stream = await navigator.mediaDevices.getUserMedia({
  audio: vfDevice, // Voice Focus device constraint
  video: false,
});

const audioTrack = stream.getAudioTracks()[0];
```

#### 5. **Stage Publishing**

The transformed audio track is wrapped in a `LocalStageStream` and published to the IVS stage:

```javascript
const localAudioStream = new LocalStageStream(audioTrack, {
  simulcast: { enabled: true },
});

// StageStrategy includes this stream in stageStreamsToPublish()
stage.refreshStrategy(); // Publishes to stage
```

### Voice Focus Processing

Voice Focus uses machine learning models to:

1. **Detect Voice**: Identify human speech patterns in the audio input
2. **Classify Noise**: Distinguish between voice and background noise
3. **Suppress Noise**: Remove non-voice audio components
4. **Preserve Voice**: Maintain natural voice characteristics

The processing happens in real-time with minimal latency (typically <10ms).

### State Management

Voice Focus state is managed through React Context:

```javascript
// AudioFiltersContext provides:
{
  voiceFocusEnabled: boolean,        // User preference
  voiceFocusSupported: boolean,      // Browser capability
  isCheckingSupport: boolean,        // Loading state
  toggleVoiceFocus: (enabled) => {},  // Enable/disable
  applyVoiceFocus: (deviceId) => {}  // Apply to device
}
```

Settings are persisted to `localStorage` for consistency across sessions.

### Lifecycle Management

1. **Enable**: Initialize transformer → Create device → Get stream
2. **Disable**: Stop current device → Clear reference → Use native microphone
3. **Device Change**: Stop old device → Create new device → Switch stream
4. **Cleanup**: Stop device → Destroy transformer → Free resources

---

## Configuration Parameters

### Voice Focus Specification

Located in `VoiceFocusService.initialize()`:

```javascript
{
  name: 'default',    // Only model type 'default' is supported
  variant: 'c20',     // Quality: 'c10', 'c20', 'c50', 'c100'
}
```

### Transformer Options

```javascript
{
  preload: false; // Whether to preload models (saves bandwidth)
}
```

### Recommendations by Use Case

#### **Demo/Development** (Current Settings)

- **variant**: `'c20'` (balanced quality/CPU)
- **preload**: `false` (reduce bandwidth)

**Rationale**: Provides good noise suppression without excessive resource usage, suitable for testing and demonstrations.

#### **Production/High Quality**

- **variant**: `'c50'` or `'c100'` (higher quality)
- **preload**: `true` (faster initialization)

**Rationale**: Best quality for professional use cases, assuming users have capable devices.

#### **Mobile/Low-End Devices**

- **variant**: `'c10'` (minimal CPU)
- **preload**: `false`

**Rationale**: Reduces CPU load and battery consumption on resource-constrained devices.

---

## Current Limitations

### 1. **Browser Compatibility**

- **Issue**: Voice Focus requires modern browser features (WASM, Web Audio API)
- **Impact**: Not supported in older browsers or some mobile browsers
- **Affected**: Older browsers, iframes, and some WebView implementations
- **Workaround**: Graceful fallback to native microphone with support detection

### 2. **Model Loading Overhead**

- **Issue**: ML models must be downloaded on first use (~500KB-2MB depending on variant)
- **Impact**: Initial loading delay (1-3 seconds) when enabling Voice Focus
- **Causes**: Network latency, model size, device performance
- **Mitigation**: `preload: false` setting defers loading until needed, async initialization doesn't block UI

### 3. **CPU and Battery Impact**

- **Issue**: Real-time ML processing requires continuous CPU usage
- **Impact**: Increased CPU load (5-15% depending on variant), higher battery drain on mobile devices
- **Scale**: More noticeable on low-end devices or when using higher quality variants
- **Tradeoff**: Quality vs. performance (variant selection)

---

## Production Improvements

### 1. **Adaptive Quality Selection**

**Current**: Fixed quality variant (`c20`)  
**Improvement**: Automatically adjust quality based on device capabilities

```javascript
class AdaptiveVoiceFocusService {
  async selectOptimalVariant() {
    const deviceInfo = await this.detectDeviceCapabilities();

    // CPU cores, memory, battery status
    if (deviceInfo.isMobile && deviceInfo.batteryLevel < 0.3) {
      return "c10"; // Low power mode
    } else if (deviceInfo.cpuCores >= 4 && deviceInfo.memory > 4096) {
      return "c50"; // High quality
    } else {
      return "c20"; // Balanced (default)
    }
  }

  async detectDeviceCapabilities() {
    return {
      cpuCores: navigator.hardwareConcurrency || 2,
      memory: navigator.deviceMemory || 4,
      isMobile: /Mobile|Android|iOS/.test(navigator.userAgent),
      batteryLevel: await this.getBatteryLevel(),
    };
  }
}
```

**Benefits**:

- Optimal quality on capable devices
- Better battery life on mobile
- Reduced CPU on low-end devices
- Automatic adaptation

---

### 2. **Model Preloading with Service Worker**

**Current**: Models loaded on-demand  
**Improvement**: Pre-cache models using Service Worker

```javascript
// service-worker.js
const VOICE_FOCUS_MODELS = [
  "/voice-focus/models/c20-model.bin",
  "/voice-focus/models/c20-wasm.wasm",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("voice-focus-v1").then((cache) => {
      return cache.addAll(VOICE_FOCUS_MODELS);
    })
  );
});

// In app
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js");
}
```

**Benefits**:

- Faster initialization
- Works offline
- Reduced perceived latency
- Better user experience

---

### 3. **Real-Time Performance Monitoring**

**Current**: No performance metrics  
**Improvement**: Track CPU usage, latency, and quality

```javascript
class VoiceFocusMonitor {
  constructor() {
    this.metrics = {
      cpuUsage: [],
      latency: [],
      noiseReduction: [],
    };
  }

  startMonitoring() {
    this.interval = setInterval(() => {
      const cpu = this.measureCPU();
      const latency = this.measureLatency();
      const reduction = this.measureNoiseReduction();

      this.metrics.cpuUsage.push(cpu);
      this.metrics.latency.push(latency);
      this.metrics.noiseReduction.push(reduction);

      // Alert if performance degrades
      if (cpu > 80 || latency > 50) {
        this.recommendQualityDowngrade();
      }
    }, 1000);
  }

  recommendQualityDowngrade() {
    // Suggest lower variant to user
    toast("High CPU usage detected. Consider lowering Voice Focus quality.", {
      action: {
        label: "Lower Quality",
        onClick: () => this.switchToLowerVariant(),
      },
    });
  }
}
```

**Benefits**:

- Proactive quality management
- User awareness of performance impact
- Data for optimization
- Better resource utilization

---

### 4. **Visual Noise Suppression Indicator**

**Current**: No visual feedback  
**Improvement**: Real-time visualization of noise suppression

```javascript
class VoiceFocusVisualizer {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext("2d");
    this.analyser = null;
  }

  attachToStream(stream) {
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    this.analyser = audioContext.createAnalyser();
    source.connect(this.analyser);

    this.visualize();
  }

  visualize() {
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

    const draw = () => {
      this.analyser.getByteFrequencyData(dataArray);

      // Visualize:
      // - Input level (before Voice Focus)
      // - Output level (after Voice Focus)
      // - Noise reduction amount
      // - Voice detection indicator

      this.drawNoiseReductionMeter(dataArray);
      requestAnimationFrame(draw);
    };

    draw();
  }

  drawNoiseReductionMeter(data) {
    // Draw colored bars showing:
    // Green: Clean voice
    // Yellow: Moderate noise
    // Red: High noise (being suppressed)
  }
}
```

**Benefits**:

- User confidence in Voice Focus
- Visual feedback on noise levels
- Educational value
- Debug assistance

---

### 5. **Network-Aware Model Loading**

**Current**: Fixed loading strategy  
**Improvement**: Adapt based on network conditions

```javascript
class NetworkAwareLoader {
  async loadVoiceFocusModels(variant) {
    const connection =
      navigator.connection ||
      navigator.mozConnection ||
      navigator.webkitConnection;

    if (!connection) {
      return this.standardLoad(variant);
    }

    // Check network type and speed
    if (
      connection.effectiveType === "slow-2g" ||
      connection.effectiveType === "2g"
    ) {
      // On slow connections, use smaller model
      console.log("Slow connection detected, using c10 variant");
      return this.standardLoad("c10");
    } else if (connection.saveData) {
      // User has data saver enabled
      console.log("Data saver enabled, deferring model load");
      return this.deferredLoad(variant);
    } else {
      return this.standardLoad(variant);
    }
  }

  async deferredLoad(variant) {
    // Wait until user explicitly enables Voice Focus
    return { deferred: true, variant };
  }
}
```

**Benefits**:

- Respects user's network conditions
- Better experience on slow connections
- Reduced data usage
- Adaptive loading

---

## Summary

The current implementation provides a solid foundation for noise suppression in a demo/prototype context:

✅ Integrates Amazon Chime SDK Voice Focus with IVS Real-time
✅ Applies AI-powered noise suppression to local audio
✅ Publishes clean audio to IVS Real-Time stage
✅ Provides graceful fallback to native microphone
✅ Persists user preferences

For production deployment, consider implementing:

- Adaptive quality selection based on device capabilities
- Progressive fallback strategy (try multiple variants)
- Visual feedback for noise suppression activity
- Model preloading with Service Worker
- Network-aware model loading
