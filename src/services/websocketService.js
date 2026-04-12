/**
 * WebSocket Service for Real-time Autism Detection
 * Provides WebSocket alternative to HTTP polling for real-time communication
 */

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.isAnalyzing = false;
    this.clientId = null;
    this.callbacks = {
      onConnect: null,
      onDisconnect: null,
      onPrediction: null,
      onError: null,
      onStatus: null,
      onConfig: null
    };
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 2000;
  }

  /**
   * Connect to WebSocket server
   * @param {string} url - WebSocket server URL
   * @returns {Promise<boolean>} - Connection success
   */
  async connect(url = 'ws://127.0.0.1:5001') {
    try {
      // Load Socket.IO client
      if (typeof io === 'undefined') {
        // Dynamically load Socket.IO if not available
        await this.loadSocketIO();
      }

      this.socket = io(url, {
        transports: ['websocket', 'polling'],
        upgrade: true,
        rememberUpgrade: true,
        timeout: 20000,
        forceNew: true
      });

      // Set up event listeners
      this.setupEventListeners();

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 10000);

        this.socket.on('connect', () => {
          clearTimeout(timeout);
          this.isConnected = true;
          this.clientId = this.socket.id;
          this.reconnectAttempts = 0;
          
          if (this.callbacks.onConnect) {
            this.callbacks.onConnect({
              clientId: this.clientId,
              message: 'Connected to WebSocket server'
            });
          }
          
          resolve(true);
        });

        this.socket.on('connect_error', (error) => {
          clearTimeout(timeout);
          console.error('WebSocket connection error:', error);
          reject(error);
        });
      });

    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      throw error;
    }
  }

  /**
   * Dynamically load Socket.IO client library
   */
  async loadSocketIO() {
    return new Promise((resolve, reject) => {
      if (typeof io !== 'undefined') {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.socket.io/4.7.2/socket.io.min.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  /**
   * Set up WebSocket event listeners
   */
  setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      this.isAnalyzing = false;
      
      if (this.callbacks.onDisconnect) {
        this.callbacks.onDisconnect({
          reason: reason,
          clientId: this.clientId
        });
      }

      // Attempt reconnection if not intentional
      if (reason !== 'io client disconnect') {
        this.attemptReconnection();
      }
    });

    // Analysis events
    this.socket.on('analysis_started', (data) => {
      this.isAnalyzing = true;
      if (this.callbacks.onStatus) {
        this.callbacks.onStatus('Real-time analysis started (WebSocket)');
      }
    });

    this.socket.on('analysis_stopped', (data) => {
      this.isAnalyzing = false;
      if (this.callbacks.onStatus) {
        this.callbacks.onStatus('Real-time analysis stopped');
      }
    });

    // Prediction results
    this.socket.on('prediction_result', (data) => {
      if (this.callbacks.onPrediction) {
        this.callbacks.onPrediction(data);
      }
    });

    // Error handling
    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
      if (this.callbacks.onError) {
        this.callbacks.onError(error.message || 'WebSocket error occurred');
      }
    });

    // Configuration
    this.socket.on('config', (config) => {
      if (this.callbacks.onConfig) {
        this.callbacks.onConfig(config);
      }
    });

    this.socket.on('config_updated', (data) => {
      if (this.callbacks.onStatus) {
        this.callbacks.onStatus(`Configuration updated: ${data.message}`);
      }
    });
  }

  /**
   * Start real-time analysis via WebSocket
   */
  startAnalysis() {
    if (!this.isConnected || !this.socket) {
      throw new Error('WebSocket not connected');
    }

    this.socket.emit('start_analysis', {
      timestamp: Date.now()
    });
  }

  /**
   * Stop real-time analysis
   */
  stopAnalysis() {
    if (!this.isConnected || !this.socket) {
      return;
    }

    this.socket.emit('stop_analysis', {
      timestamp: Date.now()
    });
  }

  /**
   * Send frame data for analysis
   * @param {string} base64Image - Base64 encoded image
   * @param {number} timestamp - Frame timestamp
   */
  sendFrame(base64Image, timestamp = Date.now()) {
    if (!this.isConnected || !this.socket || !this.isAnalyzing) {
      return;
    }

    this.socket.emit('frame_data', {
      image: base64Image,
      timestamp: timestamp
    });
  }

  /**
   * Get current configuration
   */
  getConfig() {
    if (!this.isConnected || !this.socket) {
      return;
    }

    this.socket.emit('get_config');
  }

  /**
   * Update configuration
   * @param {object} config - Configuration updates
   */
  updateConfig(config) {
    if (!this.isConnected || !this.socket) {
      return;
    }

    this.socket.emit('update_config', config);
  }

  /**
   * Set event callbacks
   * @param {object} callbacks - Callback functions
   */
  setCallbacks(callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Attempt to reconnect to WebSocket server
   */
  attemptReconnection() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      if (this.callbacks.onError) {
        this.callbacks.onError('Failed to reconnect after multiple attempts');
      }
      return;
    }

    this.reconnectAttempts++;
    
    if (this.callbacks.onStatus) {
      this.callbacks.onStatus(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    }

    setTimeout(() => {
      this.connect().catch(error => {
        console.error('Reconnection failed:', error);
        this.attemptReconnection();
      });
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.isConnected = false;
    this.isAnalyzing = false;
    this.clientId = null;
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      isAnalyzing: this.isAnalyzing,
      clientId: this.clientId,
      reconnectAttempts: this.reconnectAttempts
    };
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.disconnect();
    this.callbacks = {
      onConnect: null,
      onDisconnect: null,
      onPrediction: null,
      onError: null,
      onStatus: null,
      onConfig: null
    };
  }
}

export default WebSocketService;
