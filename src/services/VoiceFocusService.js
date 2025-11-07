/**
 * VoiceFocusService
 * Manages Amazon Chime SDK Voice Focus integration
 */

import { VoiceFocusDeviceTransformer } from 'amazon-chime-sdk-js';
import toast from 'react-hot-toast';

class VoiceFocusService {
  constructor() {
    this.transformer = null;
    this.currentVoiceFocusDevice = null;
    this.isSupported = false;
    this.isInitialized = false;
  }

  /**
   * Check if Voice Focus is supported in this browser
   * @returns {Promise<boolean>}
   */
  async checkSupport() {
    try {
      this.isSupported = await VoiceFocusDeviceTransformer.isSupported();
      return this.isSupported;
    } catch (error) {
      console.error('Error checking Voice Focus support:', error);
      this.isSupported = false;
      return false;
    }
  }

  /**
   * Initialize Voice Focus transformer
   * @param {Object} spec - Voice Focus specification
   * @param {Object} options - Additional options
   * @returns {Promise<boolean>} Success status
   */
  async initialize(spec = {}, options = {}) {
    if (this.isInitialized) {
      return true;
    }

    try {
      // Check support first
      const supported = await this.checkSupport();
      if (!supported) {
        console.warn('Voice Focus is not supported in this browser');
        return false;
      }

      // Default spec for noise suppression only (not echo reduction)
      const defaultSpec = {
        name: 'default', // Use 'ns_es' for echo reduction
        variant: 'c20', // c10, c20, c50, c100 (higher = better quality, more CPU)
        ...spec,
      };

      // Default options
      const defaultOptions = {
        preload: false, // Don't preload to save bandwidth
        ...options,
      };

      // Create transformer
      this.transformer = await VoiceFocusDeviceTransformer.create(
        defaultSpec,
        defaultOptions
      );

      // Verify it's supported after creation
      this.isSupported = this.transformer.isSupported();
      this.isInitialized = true;

      return this.isSupported;
    } catch (error) {
      console.error('Error initializing Voice Focus:', error);
      toast.error('Failed to initialize Voice Focus: ' + error.message, {
        id: 'voice-focus-init-error',
      });
      this.isSupported = false;
      this.isInitialized = false;
      return false;
    }
  }

  /**
   * Create a Voice Focus enhanced device from a device ID
   * @param {string} deviceId - Audio device ID
   * @returns {Promise<Object|null>} Voice Focus transform device or null
   */
  async createVoiceFocusDevice(deviceId) {
    if (!this.isInitialized || !this.transformer) {
      const initialized = await this.initialize();
      if (!initialized) {
        return null;
      }
    }

    try {
      console.log('Creating Voice Focus device for:', deviceId);
      
      // Create the transform device with the device ID
      const vfDevice = await this.transformer.createTransformDevice(deviceId);
      
      if (!vfDevice) {
        console.warn('Could not create Voice Focus device, falling back to original device');
        return null;
      }

      console.log('Voice Focus device created successfully');
      this.currentVoiceFocusDevice = vfDevice;
      return vfDevice;
    } catch (error) {
      console.error('Error creating Voice Focus device:', error);
      toast.error('Failed to apply Voice Focus: ' + error.message, {
        id: 'voice-focus-device-error',
      });
      return null;
    }
  }

  /**
   * Get MediaStream from a Voice Focus device
   * @param {Object} vfDevice - Voice Focus transform device
   * @returns {Promise<MediaStream|null>} The transformed MediaStream or null
   */
  async getStreamFromDevice(vfDevice) {
    if (!vfDevice) {
      return null;
    }

    try {
      // For Voice Focus devices, we need to get the actual MediaStream
      // The device can be used as a constraint to get the transformed stream
      // Use getUserMedia with the Voice Focus device as the audio constraint
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: vfDevice,
        video: false
      });
      
      console.log('Got MediaStream from Voice Focus device:', stream);
      return stream;
    } catch (error) {
      console.error('Error getting stream from Voice Focus device:', error);
      return null;
    }
  }

  /**
   * Get the current Voice Focus device
   * @returns {Object|null}
   */
  getCurrentDevice() {
    return this.currentVoiceFocusDevice;
  }

  /**
   * Stop and destroy current Voice Focus device
   */
  async stopCurrentDevice() {
    if (this.currentVoiceFocusDevice) {
      try {
        if (typeof this.currentVoiceFocusDevice.stop === 'function') {
          await this.currentVoiceFocusDevice.stop();
        }
        this.currentVoiceFocusDevice = null;
      } catch (error) {
        console.error('Error stopping Voice Focus device:', error);
      }
    }
  }

  /**
   * Destroy the Voice Focus transformer
   */
  async destroy() {
    try {
      // Stop current device
      await this.stopCurrentDevice();

      // Destroy transformer
      if (this.transformer) {
        await VoiceFocusDeviceTransformer.destroyVoiceFocus(this.transformer);
        this.transformer = null;
      }

      this.isInitialized = false;
    } catch (error) {
      console.error('Error destroying Voice Focus:', error);
    }
  }

  /**
   * Check if Voice Focus is currently active
   * @returns {boolean}
   */
  isActive() {
    return this.currentVoiceFocusDevice !== null;
  }

  /**
   * Get Voice Focus status
   * @returns {Object}
   */
  getStatus() {
    return {
      isSupported: this.isSupported,
      isInitialized: this.isInitialized,
      isActive: this.isActive(),
      hasDevice: this.currentVoiceFocusDevice !== null,
    };
  }
}

// Export singleton instance
const voiceFocusService = new VoiceFocusService();
export default voiceFocusService;
