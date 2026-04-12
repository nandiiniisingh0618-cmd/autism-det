/**
 * Lightweight VideoUpload Component - Optimized for faster loading
 */

import React, { useState, useRef, useCallback } from 'react';
import { Upload, Video, Play, Pause, AlertCircle, CheckCircle } from 'lucide-react';

const VideoUploadLite = ({ 
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
  const [error, setError] = useState(null);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Handle video file upload
  const handleVideoUpload = useCallback((event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid video file (MP4, WebM, MOV)');
      return;
    }

    // Validate file size (max 50MB for faster processing)
    if (file.size > 50 * 1024 * 1024) {
      setError('Video file must be less than 50MB for demo');
      return;
    }

    setError(null);
    setVideoFile(file);
    
    // Create video URL
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    
    // Reset state
    setFramesExtracted([]);
    setProcessingProgress(0);
    setIsPlaying(false);
  }, []);

  // Extract frame from video at specific time
  const extractFrameAtTime = useCallback((time) => {
    if (!videoRef.current || !canvasRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    return new Promise((resolve) => {
      const handleSeeked = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64Image = canvas.toDataURL('image/jpeg', 0.7);
        
        resolve({
          timestamp: time,
          base64: base64Image,
          width: canvas.width,
          height: canvas.height
        });

        video.removeEventListener('seeked', handleSeeked);
      };

      video.addEventListener('seeked', handleSeeked);
      video.currentTime = time;
    });
  }, []);

  // Extract frames (simplified for demo)
  const extractAllFrames = useCallback(async () => {
    if (!videoRef.current || !videoFile) return;

    try {
      setIsProcessing(true);
      setError(null);
      setProcessingProgress(0);
      setFramesExtracted([]);

      const video = videoRef.current;
      const frameInterval = 2.0; // Extract frame every 2 seconds for faster demo
      const totalFrames = Math.ceil(video.duration / frameInterval);
      const frames = [];

      for (let i = 0; i < totalFrames && i < 10; i++) { // Limit to 10 frames for demo
        const timestamp = i * frameInterval;
        
        try {
          const frame = await extractFrameAtTime(timestamp);
          if (frame) {
            frames.push(frame);
            
            const progress = ((i + 1) / Math.min(totalFrames, 10)) * 100;
            setProcessingProgress(progress);
            setFramesExtracted([...frames]);
            
            if (onFrameExtracted) {
              onFrameExtracted(frame, i + 1, Math.min(totalFrames, 10));
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
    
    if (framesExtracted.length > 0) {
      try {
        setIsProcessing(true);
        
        // Simulate processing for demo
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const mockResult = {
          final_prediction: framesExtracted.length > 5 ? "ASD Detected" : "No ASD Traits",
          confidence: 0.75 + Math.random() * 0.2,
          confidence_percentage: 75 + Math.random() * 20,
          frames_analyzed: framesExtracted.length,
          processing_time_ms: 2000
        };
        
        if (onVideoProcessed) {
          onVideoProcessed(framesExtracted, mockResult);
        }

      } catch (error) {
        console.error('Video processing failed:', error);
        setError(`Processing failed: ${error.message}`);
      } finally {
        setIsProcessing(false);
      }
    }
  }, [framesExtracted, onVideoProcessed, setIsProcessing, extractAllFrames]);

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

  // Update current time during playback
  const updateTime = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      requestAnimationFrame(updateTime);
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
              accept="video/mp4,video/webm,video/quicktime"
              onChange={handleVideoUpload}
              className="hidden"
            />
            
            <Video size={48} className="mx-auto mb-4 text-on-surface-variant/40" />
            <p className="font-medium text-on-surface mb-2">
              {videoFile ? videoFile.name : 'Click to upload video file'}
            </p>
            <p className="text-sm text-on-surface-variant">
              Supports MP4, WebM, MOV (max 50MB for demo)
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
      {videoUrl && (
        <div className="space-y-6">
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
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={togglePlayPause}
                className="p-3 bg-tertiary text-white rounded-xl hover:opacity-90 transition-all"
              >
                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
              </button>
            </div>
          </div>

          {/* Processing Section */}
          <div className="bg-surface-container-low p-6 rounded-3xl border border-outline-variant/10">
            <h3 className="text-xl font-bold mb-4">Video Processing</h3>
            
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
                      Extracting...
                    </>
                  ) : (
                    <>
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
        </div>
      )}
    </div>
  );
};

export default VideoUploadLite;
