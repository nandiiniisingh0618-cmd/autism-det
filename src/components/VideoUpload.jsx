/**
 * VideoUpload Component - Handles video file upload and preview
 * Supports frame extraction and batch processing for autism detection
 */

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, Video, Play, Pause, SkipForward, SkipBack, AlertCircle, CheckCircle, Progress, Clock, BarChart3 } from 'lucide-react';

const VideoUpload = ({ 
  onVideoProcessed, 
  onFrameExtracted, 
  isProcessing, 
  setIsProcessing 
}) => {
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [framesExtracted, setFramesExtracted] = useState([]);
  const [currentFrame, setCurrentFrame] = useState(null);
  const [error, setError] = useState(null);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Handle video file upload
  const handleVideoUpload = useCallback((event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid video file (MP4, WebM, MOV, AVI)');
      return;
    }

    // Validate file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      setError('Video file must be less than 100MB');
      return;
    }

    setError(null);
    setVideoFile(file);
    
    // Create video URL
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    
    // Reset state
    setFramesExtracted([]);
    setCurrentFrame(null);
    setProcessingProgress(0);
    setIsPlaying(false);
  }, []);

  // Extract frame from video at specific time
  const extractFrameAtTime = useCallback((time) => {
    if (!videoRef.current || !canvasRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Set video time
    video.currentTime = time;

    return new Promise((resolve) => {
      const handleSeeked = () => {
        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert to base64
        const base64Image = canvas.toDataURL('image/jpeg', 0.8);
        
        resolve({
          timestamp: time,
          base64: base64Image,
          width: canvas.width,
          height: canvas.height
        });

        video.removeEventListener('seeked', handleSeeked);
      };

      video.addEventListener('seeked', handleSeeked);
    });
  }, []);

  // Extract frames throughout the video
  const extractAllFrames = useCallback(async () => {
    if (!videoRef.current || !videoFile) return;

    try {
      setIsProcessing(true);
      setError(null);
      setProcessingProgress(0);
      setFramesExtracted([]);

      const video = videoRef.current;
      const frameInterval = 1.0; // Extract frame every 1 second
      const totalFrames = Math.ceil(video.duration / frameInterval);
      const frames = [];

      for (let i = 0; i < totalFrames; i++) {
        const timestamp = i * frameInterval;
        
        try {
          const frame = await extractFrameAtTime(timestamp);
          if (frame) {
            frames.push(frame);
            
            // Update progress
            const progress = ((i + 1) / totalFrames) * 100;
            setProcessingProgress(progress);
            setFramesExtracted([...frames]);
            
            // Notify parent component
            if (onFrameExtracted) {
              onFrameExtracted(frame, i + 1, totalFrames);
            }
          }
        } catch (frameError) {
          console.warn(`Failed to extract frame at ${timestamp}s:`, frameError);
        }
      }

      setFramesExtracted(frames);
      
      if (onVideoProcessed) {
        onVideoProcessed(frames);
      }

    } catch (error) {
      console.error('Frame extraction failed:', error);
      setError('Failed to extract frames from video');
    } finally {
      setIsProcessing(false);
      setProcessingProgress(100);
    }
  }, [videoFile, extractFrameAtTime, onFrameExtracted, onVideoProcessed, setIsProcessing]);

  // Process video for analysis
  const processVideo = useCallback(async () => {
    if (!framesExtracted.length) {
      await extractAllFrames();
    }
    
    // Send frames to backend for processing
    if (framesExtracted.length > 0) {
      try {
        setIsProcessing(true);
        
        const response = await fetch('http://127.0.0.1:5000/predict-video', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            frames: framesExtracted,
            videoInfo: {
              fileName: videoFile.name,
              duration: duration,
              frameCount: framesExtracted.length,
              frameInterval: 1.0
            }
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Video processing failed');
        }

        const result = await response.json();
        
        if (onVideoProcessed) {
          onVideoProcessed(framesExtracted, result);
        }

      } catch (error) {
        console.error('Video processing failed:', error);
        setError(`Processing failed: ${error.message}`);
      } finally {
        setIsProcessing(false);
      }
    }
  }, [framesExtracted, videoFile, duration, onVideoProcessed, setIsProcessing]);

  // Video controls
  const togglePlayPause = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  const handleSeek = useCallback((event) => {
    const time = parseFloat(event.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const skipTime = useCallback((seconds) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(duration, currentTime + seconds));
    }
  }, [currentTime, duration]);

  // Update current time during playback
  const updateTime = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      animationFrameRef.current = requestAnimationFrame(updateTime);
    }
  }, []);

  // Handle video metadata loaded
  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setCurrentTime(0);
    }
  }, []);

  // Cleanup
  React.useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="bg-surface-container-low p-6 rounded-3xl border border-outline-variant/10">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Upload size={20} className="text-primary" />
          Upload Video for Analysis
        </h3>
        
        <div className="space-y-4">
          {/* File Input */}
          <div
            className="border-2 border-dashed border-outline-variant/30 rounded-2xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
              onChange={handleVideoUpload}
              className="hidden"
            />
            
            <Video size={48} className="mx-auto mb-4 text-on-surface-variant/40" />
            <p className="font-medium text-on-surface mb-2">
              {videoFile ? videoFile.name : 'Click to upload video file'}
            </p>
            <p className="text-sm text-on-surface-variant">
              Supports MP4, WebM, MOV, AVI (max 100MB)
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-error-container text-error rounded-xl flex items-center gap-3">
              <AlertCircle size={20} />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* Video Preview and Controls */}
      <AnimatePresence>
        {videoUrl && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Video Player */}
            <div className="bg-surface-container-low p-6 rounded-3xl border border-outline-variant/10">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Video size={20} className="text-tertiary" />
                Video Preview
              </h3>
              
              <div className="aspect-video bg-surface-container-highest rounded-2xl overflow-hidden relative mb-4">
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className="w-full h-full object-contain"
                  onLoadedMetadata={handleLoadedMetadata}
                  onTimeUpdate={updateTime}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
                
                {/* Hidden canvas for frame extraction */}
                <canvas ref={canvasRef} className="hidden" />
              </div>

              {/* Video Controls */}
              <div className="space-y-4">
                {/* Progress Bar */}
                <div className="flex items-center gap-3">
                  <span className="text-sm text-on-surface-variant w-12">
                    {Math.floor(currentTime)}s
                  </span>
                  <input
                    type="range"
                    min="0"
                    max={duration || 0}
                    value={currentTime}
                    onChange={handleSeek}
                    className="flex-1"
                    disabled={!duration}
                  />
                  <span className="text-sm text-on-surface-variant w-12">
                    {Math.floor(duration)}s
                  </span>
                </div>

                {/* Control Buttons */}
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => skipTime(-10)}
                    className="p-2 bg-surface-container-high rounded-xl hover:bg-surface-container-highest transition-colors"
                  >
                    <SkipBack size={20} />
                  </button>
                  
                  <button
                    onClick={togglePlayPause}
                    className="p-3 bg-tertiary text-white rounded-xl hover:opacity-90 transition-all"
                  >
                    {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                  </button>
                  
                  <button
                    onClick={() => skipTime(10)}
                    className="p-2 bg-surface-container-high rounded-xl hover:bg-surface-container-highest transition-colors"
                  >
                    <SkipForward size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* Processing Section */}
            <div className="bg-surface-container-low p-6 rounded-3xl border border-outline-variant/10">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Progress size={20} className="text-secondary" />
                Video Processing
              </h3>
              
              <div className="space-y-4">
                {/* Processing Progress */}
                {isProcessing && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {framesExtracted.length > 0 ? 'Analyzing frames...' : 'Extracting frames...'}
                      </span>
                      <span className="text-sm text-on-surface-variant">
                        {Math.round(processingProgress)}%
                      </span>
                    </div>
                    
                    <div className="w-full bg-surface-container-highest rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${processingProgress}%` }}
                      />
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-on-surface-variant">
                      <div className="flex items-center gap-2">
                        <BarChart3 size={16} />
                        <span>{framesExtracted.length} frames extracted</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={16} />
                        <span>{Math.floor(duration)}s video duration</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Processing Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={extractAllFrames}
                    disabled={isProcessing || !videoFile}
                    className="flex-1 bg-tertiary text-white py-3 rounded-xl font-bold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Extracting Frames...
                      </>
                    ) : (
                      <>
                        <BarChart3 size={18} />
                        Extract Frames
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={processVideo}
                    disabled={isProcessing || framesExtracted.length === 0}
                    className="flex-1 bg-primary text-white py-3 rounded-xl font-bold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={18} />
                        Analyze Video
                      </>
                    )}
                  </button>
                </div>

                {/* Frames Summary */}
                {framesExtracted.length > 0 && !isProcessing && (
                  <div className="p-4 bg-[#e8f5e9] text-[#2e7d32] rounded-xl">
                    <div className="flex items-center gap-3">
                      <CheckCircle size={20} />
                      <div>
                        <p className="font-medium">Frames Ready for Analysis</p>
                        <p className="text-sm">
                          {framesExtracted.length} frames extracted from {Math.floor(duration)}s video
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Frame Preview Grid */}
            {framesExtracted.length > 0 && (
              <div className="bg-surface-container-low p-6 rounded-3xl border border-outline-variant/10">
                <h3 className="text-xl font-bold mb-4">Extracted Frames ({framesExtracted.length})</h3>
                
                <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 max-h-48 overflow-y-auto">
                  {framesExtracted.slice(0, 24).map((frame, index) => (
                    <div
                      key={index}
                      className="aspect-video bg-surface-container-highest rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                      onClick={() => setCurrentFrame(frame)}
                    >
                      <img
                        src={frame.base64}
                        alt={`Frame ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                  
                  {framesExtracted.length > 24 && (
                    <div className="aspect-video bg-surface-container-highest rounded-lg flex items-center justify-center text-xs text-on-surface-variant">
                      +{framesExtracted.length - 24}
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Current Frame Modal */}
      <AnimatePresence>
        {currentFrame && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setCurrentFrame(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface-container-lowest rounded-2xl p-4 max-w-4xl max-h-[90vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold">Frame at {currentFrame.timestamp.toFixed(1)}s</h4>
                <button
                  onClick={() => setCurrentFrame(null)}
                  className="p-2 hover:bg-surface-container rounded-lg transition-colors"
                >
                  ×
                </button>
              </div>
              
              <img
                src={currentFrame.base64}
                alt={`Frame at ${currentFrame.timestamp.toFixed(1)}s`}
                className="w-full h-auto rounded-lg"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VideoUpload;
