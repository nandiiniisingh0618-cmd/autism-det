/**
 * Simple Camera Test Page
 * Use this to test camera access before the main application
 */

import React, { useState, useRef } from 'react';
import { Camera, CameraOff, AlertCircle, CheckCircle } from 'lucide-react';

export default function CameraTest() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const [diagnostics, setDiagnostics] = useState(null);
  const [streamSettings, setStreamSettings] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const testCamera = async () => {
    try {
      setError(null);
      setDiagnostics(null);
      
      // Step 1: Check basic support
      const support = {
        hasGetUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
        isSecure: location.protocol === 'https:' || location.hostname === 'localhost',
        userAgent: navigator.userAgent
      };
      
      setDiagnostics(support);
      
      if (support.hasGetUserMedia) {
        throw new Error('getUserMedia not supported');
      }

      // Step 2: Try simple constraints first
      const simpleConstraints = {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(simpleConstraints);
      
      // Step 3: Set up video
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        videoRef.current.onloadedmetadata = () => {
          // Get actual stream settings
          const videoTrack = stream.getVideoTracks()[0];
          const settings = videoTrack.getSettings();
          
          setStreamSettings({
            width: settings.width,
            height: settings.height,
            frameRate: settings.frameRate,
            deviceId: settings.deviceId,
            facingMode: settings.facingMode
          });
          
          setIsStreaming(true);
          videoRef.current.play().catch(e => {
            console.warn('Play failed:', e);
            videoRef.current.muted = true;
            videoRef.current.play();
          });
        };
      }

    } catch (err) {
      console.error('Camera test failed:', err);
      setError(err.message || 'Camera access failed');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsStreaming(false);
    setStreamSettings(null);
  };

  return (
    <div className="min-h-screen bg-surface p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-on-surface mb-8">Camera Access Test</h1>
        
        {/* Test Controls */}
        <div className="bg-surface-container-low p-6 rounded-2xl mb-6">
          <div className="flex gap-4 mb-4">
            {!isStreaming ? (
              <button
                onClick={testCamera}
                className="bg-primary text-white px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-all flex items-center gap-2"
              >
                <Camera size={20} />
                Test Camera Access
              </button>
            ) : (
              <button
                onClick={stopCamera}
                className="bg-error text-white px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-all flex items-center gap-2"
              >
                <CameraOff size={20} />
                Stop Camera
              </button>
            )}
          </div>

          {/* Status */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isStreaming ? 'bg-[#2e7d32]' : 'bg-error'}`}></div>
              <span className="text-sm font-medium">
                {isStreaming ? 'Camera Active' : 'Camera Inactive'}
              </span>
            </div>
          </div>
        </div>

        {/* Video Display */}
        <div className="bg-surface-container-low p-6 rounded-2xl mb-6">
          <h2 className="text-xl font-bold mb-4">Video Feed</h2>
          <div className="aspect-video bg-surface-container-highest rounded-2xl overflow-hidden relative">
            {!isStreaming ? (
              <div className="absolute inset-0 flex items-center justify-center text-on-surface-variant/60">
                <Camera size={64} strokeWidth={1} />
              </div>
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            )}
          </div>
        </div>

        {/* Diagnostics */}
        {diagnostics && (
          <div className="bg-surface-container-low p-6 rounded-2xl mb-6">
            <h2 className="text-xl font-bold mb-4">Browser Diagnostics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-on-surface-variant">getUserMedia Support:</span>
                <span className={`ml-2 ${diagnostics.hasGetUserMedia ? 'text-[#2e7d32]' : 'text-error'}`}>
                  {diagnostics.hasGetUserMedia ? '✅ Yes' : '❌ No'}
                </span>
              </div>
              <div>
                <span className="text-on-surface-variant">Secure Context:</span>
                <span className={`ml-2 ${diagnostics.isSecure ? 'text-[#2e7d32]' : 'text-tertiary'}`}>
                  {diagnostics.isSecure ? '✅ Yes' : '⚠️ No (HTTP)'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Stream Settings */}
        {streamSettings && (
          <div className="bg-surface-container-low p-6 rounded-2xl mb-6">
            <h2 className="text-xl font-bold mb-4">Stream Settings</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-on-surface-variant">Resolution:</span>
                <span className="ml-2 font-medium">{streamSettings.width}×{streamSettings.height}</span>
              </div>
              <div>
                <span className="text-on-surface-variant">Frame Rate:</span>
                <span className="ml-2 font-medium">{streamSettings.frameRate} fps</span>
              </div>
              <div>
                <span className="text-on-surface-variant">Device ID:</span>
                <span className="ml-2 font-mono text-xs">{streamSettings.deviceId}</span>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-error-container text-error p-6 rounded-2xl mb-6">
            <div className="flex items-center gap-3">
              <AlertCircle size={24} />
              <div>
                <h3 className="font-bold mb-2">Camera Access Failed</h3>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {isStreaming && !error && (
          <div className="bg-[#e8f5e9] text-[#2e7d32] p-6 rounded-2xl">
            <div className="flex items-center gap-3">
              <CheckCircle size={24} />
              <div>
                <h3 className="font-bold mb-2">Camera Working!</h3>
                <p className="text-sm">Your camera is successfully accessible. You can now return to the main application.</p>
              </div>
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="bg-surface-container-low p-6 rounded-2xl">
          <h2 className="text-xl font-bold mb-4">Troubleshooting Tips</h2>
          <div className="space-y-3 text-sm text-on-surface-variant">
            <p><strong>Permission Denied:</strong> Click the camera icon in your browser's address bar and select "Allow".</p>
            <p><strong>No Camera Found:</strong> Ensure your webcam is connected and not being used by another application.</p>
            <p><strong>HTTPS Required:</strong> In production, camera access requires HTTPS. For development, localhost should work.</p>
            <p><strong>Browser Issues:</strong> Try Chrome or Edge for best compatibility.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
