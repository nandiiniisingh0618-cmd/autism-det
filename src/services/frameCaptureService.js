/**
 * Frame Capture Service for Real-time Autism Detection
 * Handles webcam access, frame extraction, and API communication
 */

class FrameCaptureService {
  constructor() {
    this.videoRef = null;
    this.streamRef = null;
    this.captureInterval = null;
    this.isCapturing = false;
    this.onPredictionCallback = null;
    this.onStatusCallback = null;
    this.onErrorCallback = null;
    this.captureFrequency = 6000; // 6 seconds (Avoids Gemini 2.0 Flash 15 RPM limit)
    this.apiBaseUrl = 'http://localhost:5000';
    this.isProcessing = false;
  }

  /**
   * Initialize webcam access
   * @param {HTMLVideoElement} videoElement - Video element reference
   * @returns {Promise<boolean>} - Success status
   */
  async initializeWebcam(videoElement) {
    try {
      this.videoRef = videoElement;
      
      // Try multiple constraint sets in order of preference
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

      let stream = null;
      let lastError = null;

      for (let i = 0; i < constraintSets.length; i++) {
        const constraints = constraintSets[i];
        
        try {
          console.log(`Attempting camera with constraints set ${i + 1}:`, constraints);
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          console.log(`Success with constraints set ${i + 1}`);
          break;
        } catch (error) {
          console.warn(`Constraints set ${i + 1} failed:`, error);
          lastError = error;
          
          // If it's a permission error, don't try further
          if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
            throw new Error('Camera permission denied. Please allow camera access in your browser.');
          }
          
          // Continue to next constraint set
          continue;
        }
      }

      if (!stream) {
        throw lastError || new Error('Failed to get camera stream with any constraints');
      }
      
      if (this.videoRef) {
        this.videoRef.srcObject = stream;
        this.streamRef = stream;
        
        // Wait for video to be ready
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Video element timeout - failed to load stream'));
          }, 10000);

          this.videoRef.onloadedmetadata = () => {
            clearTimeout(timeout);
            
            // Try to play
            this.videoRef.play().then(() => {
              console.log('Video playing successfully');
              resolve(true);
            }).catch(playError => {
              console.warn('Video play() failed:', playError);
              // Try muted play as fallback
              this.videoRef.muted = true;
              this.videoRef.play().then(() => {
                console.log('Video playing with muted fallback');
                resolve(true);
              }).catch(reject);
            });
          };

          this.videoRef.onerror = (error) => {
            clearTimeout(timeout);
            console.error('Video element error:', error);
            reject(new Error('Video element error'));
          };
        });
      }
      
      return false;
    } catch (error) {
      console.error('Webcam initialization error:', error);
      this.handleError(error.message || 'Unable to access camera. Please ensure camera permissions are granted.');
      return false;
    }
  }

  /**
   * Start real-time frame capture and analysis
   * @param {Function} onPrediction - Callback for prediction results
   * @param {Function} onStatus - Callback for status updates
   * @param {Function} onError - Callback for errors
   */
  startRealTimeCapture(onPrediction, onStatus, onError) {
    this.onPredictionCallback = onPrediction;
    this.onStatusCallback = onStatus;
    this.onErrorCallback = onError;
    this.isCapturing = true;

    this.updateStatus('Initializing camera...');
    
    // Start capture interval
    this.captureInterval = setInterval(() => {
      this.captureAndAnalyze();
    }, this.captureFrequency);

    // Capture first frame immediately
    setTimeout(() => this.captureAndAnalyze(), 1000);
  }

  /**
   * Stop real-time capture
   */
  stopRealTimeCapture() {
    this.isCapturing = false;
    
    if (this.captureInterval) {
      clearInterval(this.captureInterval);
      this.captureInterval = null;
    }
    
    this.updateStatus('Capture stopped');
  }

  /**
   * Capture current frame and send to backend
   */
  async captureAndAnalyze() {
    if (!this.isCapturing || !this.videoRef || this.isProcessing) return;

    try {
      this.isProcessing = true;
      this.updateStatus('Analyzing...');

      // Create canvas for frame capture
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      // Set canvas dimensions to match video
      canvas.width = this.videoRef.videoWidth;
      canvas.height = this.videoRef.videoHeight;
      
      // Draw current video frame to canvas
      context.drawImage(this.videoRef, 0, 0, canvas.width, canvas.height);
      
      // Convert to base64
      const base64Image = canvas.toDataURL('image/jpeg', 0.8);
      
      // Send to backend for prediction
      const prediction = await this.sendFrameToBackend(base64Image);
      
      if (prediction && this.onPredictionCallback) {
        this.onPredictionCallback(prediction);
      }
      
      this.updateStatus('Monitoring...');
      
    } catch (error) {
      console.error('Frame capture error:', error);
      this.handleError('Failed to capture or analyze frame. Please try again.');
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Send frame to backend API for prediction
   * @param {string} base64Image - Base64 encoded image
   * @returns {Promise<Object>} - Prediction result
   */
  async sendFrameToBackend(base64Image) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64Image,
          timestamp: Date.now()
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request error:', error);
      
      const isNetworkError = error.message.includes('Failed to fetch') || error.message.includes('NetworkError');
      const errorPrefix = isNetworkError ? 'Network Error' : 'Analysis failed';
      const helpSnippet = isNetworkError ? ' (Is the backend server running?)' : '';
      
      this.handleError(`${errorPrefix}: ${error.message}${helpSnippet}`);
      return null;
    }
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.stopRealTimeCapture();
    
    if (this.streamRef) {
      this.streamRef.getTracks().forEach(track => track.stop());
      this.streamRef = null;
    }
    
    if (this.videoRef) {
      this.videoRef.srcObject = null;
      this.videoRef = null;
    }
  }

  /**
   * Update status via callback
   * @param {string} status - Current status message
   */
  updateStatus(status) {
    if (this.onStatusCallback) {
      this.onStatusCallback(status);
    }
  }

  /**
   * Handle errors via callback
   * @param {string} error - Error message
   */
  handleError(error) {
    if (this.onErrorCallback) {
      this.onErrorCallback(error);
    }
  }

  /**
   * Set capture frequency
   * @param {number} milliseconds - Capture interval in milliseconds
   */
  setCaptureFrequency(milliseconds) {
    this.captureFrequency = milliseconds;
    
    // Restart interval if currently capturing
    if (this.isCapturing) {
      this.stopRealTimeCapture();
      this.startRealTimeCapture(
        this.onPredictionCallback,
        this.onStatusCallback,
        this.onErrorCallback
      );
    }
  }

  /**
   * Get current capture statistics
   */
  getStats() {
    return {
      isCapturing: this.isCapturing,
      isProcessing: this.isProcessing,
      captureFrequency: this.captureFrequency,
      hasVideo: !!this.videoRef,
      hasStream: !!this.streamRef
    };
  }
}

export default FrameCaptureService;
