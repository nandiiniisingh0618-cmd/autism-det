/**
 * ModeToggle Component - Switch between webcam and video upload modes
 */

import React from 'react';
import { motion } from 'motion/react';
import { Camera, Video, ToggleLeft, ToggleRight } from 'lucide-react';

const ModeToggle = ({ mode, onModeChange, disabled = false }) => {
  const modes = [
    { id: 'webcam', label: 'Live Detection', icon: Camera, color: 'primary' },
    { id: 'video', label: 'Upload Video', icon: Video, color: 'tertiary' }
  ];

  const currentMode = modes.find(m => m.id === mode) || modes[0];
  const CurrentIcon = currentMode.icon;

  return (
    <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <CurrentIcon size={20} className={`text-${currentMode.color}`} />
          <span className="font-bold text-on-surface">{currentMode.label}</span>
        </div>
        
        <button
          onClick={() => onModeChange(mode === 'webcam' ? 'video' : 'webcam')}
          disabled={disabled}
          className={`p-2 rounded-xl transition-all ${
            disabled 
              ? 'opacity-50 cursor-not-allowed' 
              : 'hover:bg-surface-container-highest cursor-pointer'
          }`}
        >
          {mode === 'webcam' ? (
            <ToggleRight size={24} className="text-primary" />
          ) : (
            <ToggleLeft size={24} className="text-tertiary" />
          )}
        </button>
      </div>

      {/* Mode Description */}
      <div className="text-sm text-on-surface-variant">
        {mode === 'webcam' ? (
          <p>Real-time analysis using your webcam. Frames captured every 2-3 seconds.</p>
        ) : (
          <p>Upload a video file for batch analysis. Extracts frames and processes them sequentially.</p>
        )}
      </div>

      {/* Visual Mode Indicator */}
      <div className="mt-4 flex items-center gap-2">
        {modes.map((modeOption) => {
          const Icon = modeOption.icon;
          const isActive = modeOption.id === mode;
          
          return (
            <div
              key={modeOption.id}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl transition-all ${
                isActive 
                  ? `bg-${modeOption.color} text-white` 
                  : 'bg-surface-container-high text-on-surface-variant/60'
              }`}
            >
              <Icon size={16} />
              <span className="text-xs font-medium">{modeOption.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ModeToggle;
