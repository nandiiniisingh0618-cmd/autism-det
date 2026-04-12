import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Video, Shield, Activity, Zap, Camera, CameraOff, AlertCircle, Settings, Play, Pause, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import FrameCaptureService from '../services/frameCaptureService';
import CameraDebugService from '../services/cameraDebugService';
import VideoProcessorLite from '../services/VideoProcessorLite';
import RealTimeDashboard from '../components/RealTimeDashboard';
import VideoUploadLite from '../components/VideoUploadLite';
import ModeToggleLite from '../components/ModeToggleLite';

export default function Live() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isRealTimeActive, setIsRealTimeActive] = useState(false);
  const [status, setStatus] = useState('Ready to start');
  const [error, setError] = useState(null);
  const [currentPrediction, setCurrentPrediction] = useState(null);
  const [processingTime, setProcessingTime] = useState(null);
  const [features, setFeatures] = useState(null);
  const [captureFrequency, setCaptureFrequency] = useState(2500);
  const [showSettings, setShowSettings] = useState(false);
  const [showCameraHelp, setShowCameraHelp] = useState(false);
  const [cameraDiagnostics, setCameraDiagnostics] = useState(null);
  const [mode, setMode] = useState('webcam'); // 'webcam' or 'video'
  const [videoProcessingResult, setVideoProcessingResult] = useState(null);
  const [isVideoProcessing, setIsVideoProcessing] = useState(false);
  
  const videoRef = useRef(null);
  const frameCaptureService = useRef(null);
  const cameraDebugService = useRef(null);
  const videoProcessor = useRef(null);
  const navigate = useNavigate();

  // Initialize services
  useEffect(() => {
    frameCaptureService.current = new FrameCaptureService();
    cameraDebugService.current = new CameraDebugService();
    videoProcessor.current = new VideoProcessorLite();
    
    // Set up video processor callbacks
    videoProcessor.current.setCallbacks({
      onProgress: (progress, processed, total) => {
        setStatus(`Processing video... ${Math.round(progress)}% (${processed}/${total} frames)`);
      },
      onComplete: (result) => {
        setVideoProcessingResult(result);
        setIsVideoProcessing(false);
        setStatus('Video analysis complete');
        // Update dashboard with video result
        setCurrentPrediction({
          prediction: result.final_prediction,
          confidence_percentage: result.confidence_percentage,
          processing_time_ms: result.total_processing_time_ms,
          features: result.breakdown || {},
          video_analysis: true
        });
      },
      onError: (error) => {
        setError(`Video processing failed: ${error}`);
        setIsVideoProcessing(false);
        setStatus('Video processing failed');
      },
      onFrameProcessed: (prediction, frameIndex) => {
        // Optional: Update status with frame progress
        if (frameIndex % 10 === 0) {
          setStatus(`Analyzing frame ${frameIndex}...`);
        }
      }
    });
    
    return () => {
      if (frameCaptureService.current) {
        frameCaptureService.current.cleanup();
      }
      if (cameraDebugService.current) {
        cameraDebugService.current.stopCamera();
      }
      if (videoProcessor.current) {
        videoProcessor.current.cancelProcessing();
      }
    };
  }, []);

  // Handle mode switching
  const handleModeChange = (newMode) => {
    // Stop current operations
    if (isRealTimeActive) {
      stopRealTimeAnalysis();
    }
    if (isStreaming) {
      stopCamera();
    }
    if (isVideoProcessing && videoProcessor.current) {
      videoProcessor.current.cancelProcessing();
    }
    
    // Reset state
    setError(null);
    setCurrentPrediction(null);
    setVideoProcessingResult(null);
    setIsVideoProcessing(false);
    setStatus('Ready to start');
    
    // Switch mode
    setMode(newMode);
  };

  const startCamera = async () => {
    try {
      setError(null);
      setStatus('Checking camera support...');
      setCameraDiagnostics(null);
      
      // First check camera support
      const diagnostics = await cameraDebugService.current.checkCameraSupport();
      setCameraDiagnostics(diagnostics);
      
      if (diagnostics.errors.length > 0) {
        setShowCameraHelp(true);
        setError(`Camera check failed: ${diagnostics.errors.join(', ')}`);
        return;
      }
      
      setStatus('Requesting camera permission...');
      
      // Try enhanced camera initialization
      const success = await cameraDebugService.current.initializeCamera(videoRef.current);
      
      if (success) {
        setIsStreaming(true);
        setStatus('Camera ready');
        
        // Get stream settings for debugging
        const settings = cameraDebugService.current.getStreamSettings();
        console.log('Camera settings:', settings);
        
        // Initialize frame capture service with working camera
        if (frameCaptureService.current) {
          frameCaptureService.current.videoRef = videoRef.current;
          frameCaptureService.current.streamRef = cameraDebugService.current.stream;
        }
      } else {
        setShowCameraHelp(true);
        setError('Failed to initialize camera. Please check camera permissions and device connection.');
      }
    } catch (err) {
      setShowCameraHelp(true);
      const helpMessage = cameraDebugService.current.createHelpMessage(err);
      setError(helpMessage);
      console.error('Camera error:', err);
    }
  };

  const stopCamera = () => {
    if (frameCaptureService.current) {
      frameCaptureService.current.cleanup();
    }
    if (cameraDebugService.current) {
      cameraDebugService.current.stopCamera();
    }
    setIsStreaming(false);
    setIsRealTimeActive(false);
    setStatus('Camera stopped');
    setShowCameraHelp(false);
  };

  const startRealTimeAnalysis = () => {
    if (!frameCaptureService.current || !isStreaming) return;

    setIsRealTimeActive(true);
    
    frameCaptureService.current.startRealTimeCapture(
      // On prediction
      (prediction) => {
        setCurrentPrediction(prediction);
        setProcessingTime(prediction.processing_time_ms);
        setFeatures(prediction.features);
        setError(null);
      },
      // On status update
      (newStatus) => {
        setStatus(newStatus);
      },
      // On error
      (errorMessage) => {
        setError(errorMessage);
        setIsRealTimeActive(false);
      }
    );
  };

  const stopRealTimeAnalysis = () => {
    if (frameCaptureService.current) {
      frameCaptureService.current.stopRealTimeCapture();
    }
    setIsRealTimeActive(false);
    setStatus('Real-time analysis stopped');
  };

  const updateCaptureFrequency = (newFrequency) => {
    setCaptureFrequency(newFrequency);
    if (frameCaptureService.current) {
      frameCaptureService.current.setCaptureFrequency(newFrequency);
    }
  };

  // Video processing handlers
  const handleVideoProcessed = async (frames, result = null) => {
    if (result) {
      // Direct result from backend
      setVideoProcessingResult(result);
      setCurrentPrediction({
        prediction: result.final_prediction,
        confidence_percentage: result.confidence_percentage,
        processing_time_ms: result.total_processing_time_ms,
        features: result.breakdown || {},
        video_analysis: true
      });
    } else {
      // Process frames through video processor
      try {
        setIsVideoProcessing(true);
        setStatus('Starting video analysis...');
        
        const processedResult = await videoProcessor.current.processVideoFrames(frames, {
          aggregationMethod: 'majority',
          batchSize: 10
        });
        
        setVideoProcessingResult(processedResult);
        
      } catch (error) {
        console.error('Video processing failed:', error);
        setError(`Video processing failed: ${error.message}`);
        setIsVideoProcessing(false);
      }
    }
  };

  const handleFrameExtracted = (frame, processed, total) => {
    // Update status during frame extraction
    if (processed % 5 === 0) {
      setStatus(`Extracting frames... ${processed}/${total}`);
    }
  };

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-12 md:py-20">
      <header className="mb-12 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-container text-primary text-[10px] font-bold uppercase tracking-widest mb-4"
        >
          <Activity size={14} /> {mode === 'webcam' ? 'Real-time Analysis' : 'Video Analysis'}
        </motion.div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-on-surface tracking-tight leading-tight">
          {mode === 'webcam' ? 'Live Detection' : 'Video Upload'} Interface
        </h1>
        <p className="text-on-surface-variant mt-4 max-w-2xl mx-auto text-lg leading-relaxed">
          {mode === 'webcam' 
            ? `Our advanced eye-tracking AI analyzes behavioral markers in real-time. Frames are captured every ${captureFrequency/1000} seconds for analysis.`
            : 'Upload a video file for comprehensive autism detection analysis. Frames will be extracted and processed sequentially.'
          }
        </p>
      </header>

      {/* Mode Toggle */}
      <div className="mb-8">
        <ModeToggleLite 
          mode={mode} 
          onModeChange={handleModeChange}
          disabled={isRealTimeActive || isVideoProcessing}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-8">
          {mode === 'webcam' ? (
            /* Webcam Mode */
            <div className="space-y-6">
              <div className="aspect-video bg-surface-container-highest rounded-3xl overflow-hidden relative shadow-2xl border border-outline-variant/20">
                {!isStreaming ? (
                  <div className="absolute inset-0 flex items-center justify-center text-on-surface-variant/40 flex-col gap-4">
                    <Video size={64} strokeWidth={1} />
                    <p className="font-medium">Camera Ready</p>
                    <p className="text-sm">Click "Enable Camera Access" to begin</p>
                  </div>
                ) : (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Overlay UI */}
                    <div className="absolute top-6 left-6 flex gap-3">
                      <div className="px-3 py-1.5 bg-black/50 backdrop-blur-md rounded-full text-white text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isRealTimeActive ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></span> 
                        {isRealTimeActive ? 'Analyzing' : 'Ready'}
                      </div>
                      <div className="px-3 py-1.5 bg-black/50 backdrop-blur-md rounded-full text-white text-[10px] font-bold uppercase tracking-widest">
                        {captureFrequency/1000}s interval
                      </div>
                    </div>

                    {currentPrediction && (
                      <div className="absolute bottom-6 left-6 right-6 grid grid-cols-3 gap-4">
                        <div className="bg-black/50 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                          <p className="text-[9px] font-bold text-white/60 uppercase tracking-widest mb-1">Result</p>
                          <p className="text-xl font-bold text-white">{currentPrediction.prediction}</p>
                        </div>
                        <div className="bg-black/50 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                          <p className="text-[9px] font-bold text-white/60 uppercase tracking-widest mb-1">Confidence</p>
                          <p className="text-xl font-bold text-white">{currentPrediction.confidence_percentage}%</p>
                        </div>
                        <div className="bg-black/50 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                          <p className="text-[9px] font-bold text-white/60 uppercase tracking-widest mb-1">Time</p>
                          <p className="text-xl font-bold text-white">{currentPrediction.processing_time_ms}ms</p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Error Display */}
              {error && (
                <div className="p-4 bg-error-container text-error rounded-2xl flex items-center gap-3">
                  <AlertCircle size={20} />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}
            </div>
          ) : (
            /* Video Upload Mode */
            <VideoUploadLite
              onVideoProcessed={handleVideoProcessed}
              onFrameExtracted={handleFrameExtracted}
              isProcessing={isVideoProcessing}
              setIsProcessing={setIsVideoProcessing}
            />
          )}
        </div>

        {/* Controls & Dashboard */}
        <div className="lg:col-span-4 space-y-6">
          {mode === 'webcam' ? (
            /* Webcam Controls */
            <div className="bg-surface-container-low p-8 rounded-3xl border border-outline-variant/10">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Shield size={20} className="text-primary" /> Camera Controls
              </h3>
              
              <div className="space-y-3">
                {!isStreaming ? (
                  <button 
                    onClick={startCamera}
                    className="w-full bg-primary text-white py-4 rounded-2xl font-bold hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                  >
                    <Camera size={20} />
                    Enable Camera Access
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={isRealTimeActive ? stopRealTimeAnalysis : startRealTimeAnalysis}
                      className={`w-full py-4 rounded-2xl font-bold hover:opacity-90 transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2 ${
                        isRealTimeActive 
                          ? 'bg-error text-white shadow-error/20' 
                          : 'bg-tertiary text-white shadow-tertiary/20'
                      }`}
                    >
                      {isRealTimeActive ? (
                        <>
                          <Pause size={20} />
                          Stop Analysis
                        </>
                      ) : (
                        <>
                          <Play size={20} />
                          Start Real-time Analysis
                        </>
                      )}
                    </button>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setShowSettings(!showSettings)}
                        className="flex-1 bg-surface-container-high text-on-surface-variant py-3 rounded-2xl font-bold hover:bg-surface-container-highest transition-all active:scale-95 flex items-center justify-center gap-2"
                      >
                        <Settings size={18} />
                        Settings
                      </button>
                      
                      <button 
                        onClick={stopCamera}
                        className="flex-1 bg-surface-container-high text-on-surface-variant py-3 rounded-2xl font-bold hover:bg-surface-container-highest transition-all active:scale-95 flex items-center justify-center gap-2"
                      >
                        <CameraOff size={18} />
                        Stop Camera
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            /* Video Processing Status */
            <div className="bg-surface-container-low p-8 rounded-3xl border border-outline-variant/10">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Video size={20} className="text-tertiary" /> Video Processing
              </h3>
              
              <div className="space-y-4">
                <div className="text-center">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                    isVideoProcessing 
                      ? 'bg-tertiary-container' 
                      : videoProcessingResult 
                        ? 'bg-[#e8f5e9]' 
                        : 'bg-surface-container-highest'
                  }`}>
                    {isVideoProcessing ? (
                      <div className="w-8 h-8 border-2 border-tertiary border-t-transparent rounded-full animate-spin"></div>
                    ) : videoProcessingResult ? (
                      <Video size={24} className="text-[#2e7d32]" />
                    ) : (
                      <Video size={24} className="text-on-surface-variant/40" />
                    )}
                  </div>
                  
                  <p className="font-medium text-on-surface mb-2">
                    {isVideoProcessing ? 'Processing Video...' : 
                     videoProcessingResult ? 'Analysis Complete' : 
                     'Ready to Upload'}
                  </p>
                  
                  <p className="text-sm text-on-surface-variant">
                    {status}
                  </p>
                </div>

                {videoProcessingResult && (
                  <div className="p-4 bg-[#e8f5e9] text-[#2e7d32] rounded-xl">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Final Result:</span>
                        <span className="font-bold">{videoProcessingResult.final_prediction}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Confidence:</span>
                        <span className="font-bold">{videoProcessingResult.confidence_percentage}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Frames Analyzed:</span>
                        <span className="font-bold">{videoProcessingResult.frames_analyzed}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Settings Panel */}
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-surface-container-low p-6 rounded-3xl border border-outline-variant/10"
            >
              <h4 className="font-bold mb-4 flex items-center gap-2">
                <Settings size={16} />
                Capture Settings
              </h4>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-on-surface-variant block mb-2">
                    Capture Frequency: {captureFrequency/1000} seconds
                  </label>
                  <input
                    type="range"
                    min="1000"
                    max="10000"
                    step="500"
                    value={captureFrequency}
                    onChange={(e) => updateCaptureFrequency(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-on-surface-variant mt-1">
                    <span>1s</span>
                    <span>5s</span>
                    <span>10s</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Real-time Dashboard */}
          <RealTimeDashboard
            prediction={currentPrediction}
            status={status}
            error={error}
            processingTime={processingTime}
            features={features}
            isAnalyzing={isRealTimeActive}
          />

          {/* Quick Tips */}
          <div className="bg-surface-container-low p-6 rounded-3xl border border-outline-variant/10">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Zap size={18} className="text-tertiary" /> Quick Tips
            </h3>
            <ul className="space-y-3 text-sm text-on-surface-variant">
              <li className="flex gap-3">
                <span className="w-5 h-5 rounded-full bg-tertiary/10 text-tertiary flex items-center justify-center text-[10px] font-bold shrink-0">1</span>
                Ensure neutral background
              </li>
              <li className="flex gap-3">
                <span className="w-5 h-5 rounded-full bg-tertiary/10 text-tertiary flex items-center justify-center text-[10px] font-bold shrink-0">2</span>
                Position camera at eye level
              </li>
              <li className="flex gap-3">
                <span className="w-5 h-5 rounded-full bg-tertiary/10 text-tertiary flex items-center justify-center text-[10px] font-bold shrink-0">3</span>
                Ensure good lighting on face
              </li>
            </ul>
          </div>

          {/* Camera Help Dialog */}
          {showCameraHelp && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowCameraHelp(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-surface-container-lowest rounded-3xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-outline-variant/20"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold flex items-center gap-2">
                    <HelpCircle size={24} className="text-error" />
                    Camera Troubleshooting
                  </h3>
                  <button
                    onClick={() => setShowCameraHelp(false)}
                    className="p-2 hover:bg-surface-container rounded-xl transition-colors"
                  >
                    ×
                  </button>
                </div>

                {/* Camera Diagnostics */}
                {cameraDiagnostics && (
                  <div className="mb-6 p-4 bg-surface-container rounded-2xl">
                    <h4 className="font-bold mb-3">Camera Diagnostics</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Browser Support:</span>
                        <span className={cameraDiagnostics.hasGetUserMedia ? "text-[#2e7d32]" : "text-error"}>
                          {cameraDiagnostics.hasGetUserMedia ? "✅ Supported" : "❌ Not Supported"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Secure Context:</span>
                        <span className={cameraDiagnostics.isSecure ? "text-[#2e7d32]" : "text-tertiary"}>
                          {cameraDiagnostics.isSecure ? "✅ HTTPS/Localhost" : "⚠️ HTTP (Insecure)"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Camera Devices:</span>
                        <span className={cameraDiagnostics.hasWebcam ? "text-[#2e7d32]" : "text-error"}>
                          {cameraDiagnostics.hasWebcam ? `✅ ${cameraDiagnostics.availableDevices.length} found` : "❌ None found"}
                        </span>
                      </div>
                      {cameraDiagnostics.errors.length > 0 && (
                        <div className="mt-3 p-3 bg-error-container rounded-xl">
                          <p className="text-error font-medium mb-2">Errors:</p>
                          {cameraDiagnostics.errors.map((error, index) => (
                            <p key={index} className="text-sm text-error">• {error}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Troubleshooting Steps */}
                <div className="space-y-4">
                  <h4 className="font-bold mb-3">Quick Fixes</h4>
                  
                  <div className="space-y-3">
                    <div className="p-3 bg-surface-container rounded-xl">
                      <h5 className="font-medium mb-2 text-primary">1. Check Browser Permissions</h5>
                      <ul className="text-sm text-on-surface-variant space-y-1">
                        <li>• Look for camera icon in address bar</li>
                        <li>• Click "Allow" when prompted</li>
                        <li>• Check browser settings → Privacy → Camera</li>
                      </ul>
                    </div>

                    <div className="p-3 bg-surface-container rounded-xl">
                      <h5 className="font-medium mb-2 text-primary">2. Try Different Browser</h5>
                      <ul className="text-sm text-on-surface-variant space-y-1">
                        <li>• Chrome/Edge: Best compatibility</li>
                        <li>• Firefox: Good alternative</li>
                        <li>• Safari: May require HTTPS</li>
                      </ul>
                    </div>

                    <div className="p-3 bg-surface-container rounded-xl">
                      <h5 className="font-medium mb-2 text-primary">3. Check Hardware</h5>
                      <ul className="text-sm text-on-surface-variant space-y-1">
                        <li>• Ensure webcam is connected</li>
                        <li>• Check if another app is using camera</li>
                        <li>• Try unplugging and reconnecting</li>
                        <li>• Test with different USB port</li>
                      </ul>
                    </div>

                    <div className="p-3 bg-surface-container rounded-xl">
                      <h5 className="font-medium mb-2 text-primary">4. Network Issues</h5>
                      <ul className="text-sm text-on-surface-variant space-y-1">
                        <li>• Use localhost for development</li>
                        <li>• Production requires HTTPS</li>
                        <li>• Clear browser cache</li>
                        <li>• Disable browser extensions</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => {
                        setShowCameraHelp(false);
                        setTimeout(() => startCamera(), 100);
                      }}
                      className="flex-1 bg-primary text-white py-3 rounded-xl font-medium hover:opacity-90 transition-all"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={() => setShowCameraHelp(false)}
                      className="flex-1 bg-surface-container-high text-on-surface-variant py-3 rounded-xl font-medium hover:bg-surface-container-highest transition-all"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
