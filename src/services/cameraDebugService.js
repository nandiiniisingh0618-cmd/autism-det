/**
 * Camera Debug Service - Enhanced camera access with detailed error handling
 */

class CameraDebugService {
  constructor() {
    this.stream = null;
    this.videoElement = null;
    this.constraints = {
      video: {
        width: { ideal: 640, max: 1280 },
        height: { ideal: 480, max: 720 },
        facingMode: 'user',
        frameRate: { ideal: 15, max: 30 }
      },
      audio: false
    };
  }

  /**
   * Check browser compatibility and permissions
   */
  async checkCameraSupport() {
    const diagnostics = {
      hasGetUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
      isSecure: location.protocol === 'https:' || location.hostname === 'localhost',
      hasWebcam: false,
      availableDevices: [],
      errors: []
    };

    // Check basic API support
    if (!diagnostics.hasGetUserMedia) {
      diagnostics.errors.push('getUserMedia API not supported in this browser');
      return diagnostics;
    }

    // Check secure context
    if (!diagnostics.isSecure) {
      console.warn('Camera access requires HTTPS (except on localhost)');
    }

    try {
      // Enumerate devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      diagnostics.availableDevices = devices.filter(device => device.kind === 'videoinput');
      diagnostics.hasWebcam = diagnostics.availableDevices.length > 0;

      if (!diagnostics.hasWebcam) {
        console.warn('No webcam devices found yet. This might require permissions first.');
      }

      console.log('Camera diagnostics:', diagnostics);
      return diagnostics;

    } catch (error) {
      console.warn(`Device enumeration failed: ${error.message}`);
      return diagnostics;
    }
  }

  /**
   * Request camera permissions with fallback constraints
   */
  async requestCameraPermission() {
    const permissionDiagnostics = {
      attempts: [],
      successful: false,
      stream: null,
      error: null
    };

    // Try different constraint sets in order of preference
    const constraintSets = [
      // High quality
      {
        video: {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          facingMode: 'user',
          frameRate: { ideal: 30 }
        },
        audio: false
      },
      // Medium quality
      {
        video: {
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 },
          facingMode: 'user',
          frameRate: { ideal: 15 }
        },
        audio: false
      },
      // Low quality (most compatible)
      {
        video: {
          width: { min: 320, ideal: 640 },
          height: { min: 240, ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      },
      // Minimal constraints
      {
        video: true,
        audio: false
      }
    ];

    for (let i = 0; i < constraintSets.length; i++) {
      const constraints = constraintSets[i];
      
      try {
        console.log(`Attempting camera with constraints:`, constraints);
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        permissionDiagnostics.successful = true;
        permissionDiagnostics.stream = stream;
        permissionDiagnostics.attempts.push({
          constraints,
          success: true,
          index: i
        });
        
        console.log('Camera access successful with constraints:', constraints);
        break;

      } catch (error) {
        const errorInfo = {
          constraints,
          success: false,
          error: error.name,
          message: error.message,
          index: i
        };
        
        permissionDiagnostics.attempts.push(errorInfo);
        console.warn(`Camera attempt ${i + 1} failed:`, errorInfo);

        // Break early for errors that won't be fixed by changing constraints
        const constraintErrors = ['OverconstrainedError', 'ConstraintNotSatisfiedError'];
        if (!constraintErrors.includes(error.name)) {
          permissionDiagnostics.error = error;
          break;
        }
        
        // Keep track of the last error to return if all attempts fail
        permissionDiagnostics.lastError = error;
      }
    }

    if (!permissionDiagnostics.successful && !permissionDiagnostics.error) {
      if (permissionDiagnostics.lastError) {
        const enhancedError = new Error(`All camera constraint attempts failed. Underlying error: ${permissionDiagnostics.lastError.name} - ${permissionDiagnostics.lastError.message}`);
        enhancedError.name = permissionDiagnostics.lastError.name;
        permissionDiagnostics.error = enhancedError;
      } else {
        permissionDiagnostics.error = new Error('All camera constraint attempts failed');
      }
    }

    return permissionDiagnostics;
  }

  /**
   * Initialize camera with comprehensive error handling
   */
  async initializeCamera(videoElement) {
    try {
      if (!videoElement) {
        throw new Error('Video element not provided to initializeCamera');
      }
      
      this.videoElement = videoElement;

      // Step 1: Check camera support
      const diagnostics = await this.checkCameraSupport();
      
      if (diagnostics.errors.length > 0) {
        console.warn(`Camera check warnings: ${diagnostics.errors.join(', ')}`);
      }

      // Step 2: Request permissions
      const permissionResult = await this.requestCameraPermission();
      
      if (!permissionResult.successful) {
        throw permissionResult.error;
      }

      // Step 3: Set up video element
      this.stream = permissionResult.stream;
      
      this.videoElement.srcObject = this.stream;
      
      // Wait for video to be ready
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Video element timeout - failed to load stream'));
        }, 10000);

        this.videoElement.onloadedmetadata = () => {
          clearTimeout(timeout);
          this.videoElement.play().catch(playError => {
            console.warn('Video play() failed:', playError);
            // Try muted play as fallback
            this.videoElement.muted = true;
            this.videoElement.play().then(() => {
              console.log('Video started with muted fallback');
              resolve(true);
            }).catch(reject);
          }).then(() => {
            resolve(true);
          });
        };

        this.videoElement.onerror = (error) => {
          clearTimeout(timeout);
          reject(new Error(`Video element error: ${error}`));
        };
      });

    } catch (error) {
      console.error('Camera initialization failed:', error);
      throw error;
    }
  }

  /**
   * Get current stream settings
   */
  getStreamSettings() {
    if (!this.stream || !this.stream.getVideoTracks().length) {
      return null;
    }

    const videoTrack = this.stream.getVideoTracks()[0];
    const settings = videoTrack.getSettings();
    
    return {
      width: settings.width,
      height: settings.height,
      frameRate: settings.frameRate,
      facingMode: settings.facingMode,
      deviceId: settings.deviceId
    };
  }

  /**
   * Stop camera and cleanup
   */
  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => {
        track.stop();
      });
      this.stream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }
  }

  /**
   * Generate detailed error message
   */
  getErrorMessage(error) {
    const errorMessages = {
      'NotAllowedError': 'Camera permission denied. Please allow camera access in your browser settings.',
      'PermissionDeniedError': 'Camera permission denied. Please allow camera access in your browser settings.',
      'NotFoundError': 'No camera device found. Please connect a webcam.',
      'DevicesNotFoundError': 'No camera device found. Please connect a webcam.',
      'NotReadableError': 'Camera is already in use by another application.',
      'TrackStartError': 'Camera failed to start. Please try refreshing the page.',
      'OverconstrainedError': 'Camera does not support the requested settings.',
      'ConstraintNotSatisfiedError': 'Camera does not support the requested settings.'
    };

    return errorMessages[error.name] || `Camera error: ${error.message}`;
  }

  /**
   * Create user-friendly help message
   */
  createHelpMessage(error) {
    const isChrome = /Chrome/.test(navigator.userAgent);
    const isFirefox = /Firefox/.test(navigator.userAgent);
    const isLocalhost = location.hostname === 'localhost' || location.hostname === '127.0.0.1';

    let helpMessage = this.getErrorMessage(error);

    if (error.name === 'NotAllowedError') {
      helpMessage += '\n\nTo fix this:\n';
      helpMessage += '1. Click the camera icon in your browser address bar\n';
      helpMessage += '2. Select "Allow" for camera access\n';
      helpMessage += '3. Refresh the page and try again';
    }

    if (!isLocalhost && location.protocol !== 'https:') {
      helpMessage += '\n\nNote: Camera access requires HTTPS in production environments.';
    }

    if (isChrome) {
      helpMessage += '\n\nChrome users: Check chrome://settings/content/camera for camera permissions.';
    } else if (isFirefox) {
      helpMessage += '\n\nFirefox users: Check about:preferences#privacy for camera permissions.';
    }

    return helpMessage;
  }
}

export default CameraDebugService;
