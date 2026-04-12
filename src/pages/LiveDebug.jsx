/**
 * Live Debug Page - Enhanced debugging for camera initialization
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Video, Camera, CameraOff, AlertCircle, Bug, Terminal } from 'lucide-react';

export default function LiveDebug() {
  const [logs, setLogs] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState('Ready');
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, message, type }]);
    console.log(`[${timestamp}] ${message}`);
  };

  const testCameraStepByStep = async () => {
    addLog('=== Starting Camera Debug Test ===', 'header');
    setError(null);
    setStep('Checking browser support...');
    
    try {
      // Step 1: Check basic support
      addLog('Step 1: Checking getUserMedia support...');
      const hasGetUserMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      addLog(`getUserMedia support: ${hasGetUserMedia ? 'YES' : 'NO'}`, hasGetUserMedia ? 'success' : 'error');
      
      if (!hasGetUserMedia) {
        throw new Error('getUserMedia not supported in this browser');
      }

      // Step 2: Check secure context
      addLog('Step 2: Checking secure context...');
      const isSecure = location.protocol === 'https:' || location.hostname === 'localhost';
      addLog(`Secure context: ${isSecure ? 'YES' : 'NO'}`, isSecure ? 'success' : 'warning');
      
      // Step 3: Enumerate devices
      addLog('Step 3: Enumerating video devices...');
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      addLog(`Found ${videoDevices.length} video devices`, videoDevices.length > 0 ? 'success' : 'error');
      
      videoDevices.forEach((device, index) => {
        addLog(`  Device ${index + 1}: ${device.label || 'Unknown'} (${device.deviceId})`, 'info');
      });

      // Step 4: Try different constraint sets
      const constraintSets = [
        { name: 'High Quality', constraints: { video: { width: 1280, height: 720, facingMode: 'user' }, audio: false } },
        { name: 'Medium Quality', constraints: { video: { width: 640, height: 480, facingMode: 'user' }, audio: false } },
        { name: 'Low Quality', constraints: { video: { width: 320, height: 240, facingMode: 'user' }, audio: false } },
        { name: 'Minimal', constraints: { video: true, audio: false } }
      ];

      for (let i = 0; i < constraintSets.length; i++) {
        const { name, constraints } = constraintSets[i];
        addLog(`Step 4.${i + 1}: Trying ${name} constraints...`);
        
        try {
          setStep(`Requesting ${name} camera...`);
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          addLog(`SUCCESS: Got stream with ${name} constraints!`, 'success');
          
          // Step 5: Set up video element
          addLog('Step 5: Setting up video element...');
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            streamRef.current = stream;
            
            addLog('Waiting for video metadata...');
            
            return new Promise((resolve, reject) => {
              const timeout = setTimeout(() => {
                reject(new Error('Video element timeout'));
              }, 10000);

              videoRef.current.onloadedmetadata = () => {
                clearTimeout(timeout);
                addLog('Video metadata loaded successfully', 'success');
                
                // Get actual settings
                const videoTrack = stream.getVideoTracks()[0];
                const settings = videoTrack.getSettings();
                
                addLog(`Actual stream settings:`, 'info');
                addLog(`  Resolution: ${settings.width}x${settings.height}`, 'info');
                addLog(`  Frame Rate: ${settings.frameRate}`, 'info');
                addLog(`  Device ID: ${settings.deviceId}`, 'info');
                
                // Try to play
                addLog('Attempting to play video...');
                videoRef.current.play().then(() => {
                  addLog('Video playing successfully!', 'success');
                  setIsStreaming(true);
                  setStep('Camera working!');
                  resolve(true);
                }).catch(playError => {
                  addLog(`Play failed: ${playError.message}`, 'warning');
                  addLog('Trying muted play...', 'info');
                  videoRef.current.muted = true;
                  videoRef.current.play().then(() => {
                    addLog('Video playing with muted fallback!', 'success');
                    setIsStreaming(true);
                    setStep('Camera working!');
                    resolve(true);
                  }).catch(reject);
                });
              };

              videoRef.current.onerror = (error) => {
                clearTimeout(timeout);
                addLog(`Video element error: ${error}`, 'error');
                reject(new Error('Video element error'));
              };
            });
          }
        } catch (constraintError) {
          addLog(`FAILED with ${name}: ${constraintError.name} - ${constraintError.message}`, 'error');
          
          // If it's a permission error, don't try further
          if (constraintError.name === 'NotAllowedError' || constraintError.name === 'PermissionDeniedError') {
            throw new Error('Camera permission denied');
          }
          
          // Continue to next constraint set
          continue;
        }
      }
      
      throw new Error('All constraint sets failed');
      
    } catch (error) {
      addLog(`FINAL ERROR: ${error.name} - ${error.message}`, 'error');
      setError(error.message);
      setStep('Failed');
    }
  };

  const stopCamera = () => {
    addLog('Stopping camera...');
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        addLog(`Stopping track: ${track.kind} (${track.label || 'Unknown'})`);
        track.stop();
      });
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsStreaming(false);
    setStep('Camera stopped');
    addLog('Camera stopped successfully', 'success');
  };

  const clearLogs = () => {
    setLogs([]);
    addLog('Logs cleared', 'info');
  };

  return (
    <div className="min-h-screen bg-surface p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Bug size={32} className="text-tertiary" />
          <h1 className="text-3xl font-bold text-on-surface">Camera Debug Console</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Video Section */}
          <div className="space-y-6">
            <div className="bg-surface-container-low p-6 rounded-3xl">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Video size={20} />
                Video Feed
              </h2>
              
              <div className="aspect-video bg-surface-container-highest rounded-2xl overflow-hidden relative mb-4">
                {!isStreaming ? (
                  <div className="absolute inset-0 flex items-center justify-center text-on-surface-variant/40 flex-col gap-4">
                    <Video size={64} strokeWidth={1} />
                    <p className="font-medium">Camera Not Active</p>
                    <p className="text-sm">Click "Start Debug Test" to begin</p>
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

              {/* Controls */}
              <div className="flex gap-3">
                {!isStreaming ? (
                  <button
                    onClick={testCameraStepByStep}
                    className="flex-1 bg-primary text-white py-3 rounded-xl font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2"
                  >
                    <Terminal size={18} />
                    Start Debug Test
                  </button>
                ) : (
                  <button
                    onClick={stopCamera}
                    className="flex-1 bg-error text-white py-3 rounded-xl font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2"
                  >
                    <CameraOff size={18} />
                    Stop Camera
                  </button>
                )}
                
                <button
                  onClick={clearLogs}
                  className="bg-surface-container-high text-on-surface-variant px-4 py-3 rounded-xl font-bold hover:bg-surface-container-highest transition-all"
                >
                  Clear Logs
                </button>
              </div>

              {/* Status */}
              <div className="mt-4 p-3 bg-surface-container rounded-xl">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    isStreaming ? 'bg-[#2e7d32]' : error ? 'bg-error' : 'bg-tertiary'
                  }`}></div>
                  <span className="text-sm font-medium">Status: {step}</span>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="mt-4 p-4 bg-error-container text-error rounded-xl flex items-center gap-3">
                  <AlertCircle size={20} />
                  <div>
                    <p className="font-medium">Camera Error</p>
                    <p className="text-sm">{error}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Logs Section */}
          <div className="space-y-6">
            <div className="bg-surface-container-low p-6 rounded-3xl">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Terminal size={20} />
                Debug Console
              </h2>
              
              <div className="bg-surface-container-highest rounded-xl p-4 h-96 overflow-y-auto font-mono text-xs">
                {logs.length === 0 ? (
                  <div className="text-on-surface-variant/60 text-center py-8">
                    No logs yet. Click "Start Debug Test" to begin.
                  </div>
                ) : (
                  <div className="space-y-1">
                    {logs.map((log, index) => (
                      <div
                        key={index}
                        className={`flex gap-2 ${
                          log.type === 'error' ? 'text-error' :
                          log.type === 'success' ? 'text-[#2e7d32]' :
                          log.type === 'warning' ? 'text-tertiary' :
                          log.type === 'header' ? 'text-primary font-bold' :
                          'text-on-surface-variant'
                        }`}
                      >
                        <span className="text-on-surface-variant/60">[{log.timestamp}]</span>
                        <span className="flex-1">{log.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Log Stats */}
              {logs.length > 0 && (
                <div className="mt-4 grid grid-cols-4 gap-2 text-xs">
                  <div className="bg-surface-container rounded-lg p-2 text-center">
                    <div className="font-bold text-on-surface">{logs.length}</div>
                    <div className="text-on-surface-variant">Total</div>
                  </div>
                  <div className="bg-[#e8f5e9] rounded-lg p-2 text-center">
                    <div className="font-bold text-[#2e7d32]">
                      {logs.filter(l => l.type === 'success').length}
                    </div>
                    <div className="text-on-surface-variant">Success</div>
                  </div>
                  <div className="bg-error-container rounded-lg p-2 text-center">
                    <div className="font-bold text-error">
                      {logs.filter(l => l.type === 'error').length}
                    </div>
                    <div className="text-on-surface-variant">Errors</div>
                  </div>
                  <div className="bg-tertiary-container rounded-lg p-2 text-center">
                    <div className="font-bold text-tertiary">
                      {logs.filter(l => l.type === 'warning').length}
                    </div>
                    <div className="text-on-surface-variant">Warnings</div>
                  </div>
                </div>
              )}
            </div>

            {/* Browser Info */}
            <div className="bg-surface-container-low p-6 rounded-3xl">
              <h3 className="font-bold mb-4">Browser Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">User Agent:</span>
                  <span className="font-mono text-xs truncate max-w-xs">{navigator.userAgent}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Protocol:</span>
                  <span>{location.protocol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Hostname:</span>
                  <span>{location.hostname}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Port:</span>
                  <span>{location.port || 'default'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
