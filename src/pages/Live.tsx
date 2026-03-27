import React from 'react';
import { motion } from 'motion/react';
import { Video, Shield, Activity, Zap } from 'lucide-react';

export default function Live() {
  return (
    <div className="max-w-screen-xl mx-auto px-6 py-12 md:py-20">
      <header className="mb-12 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-container text-primary text-[10px] font-bold uppercase tracking-widest mb-4"
        >
          <Activity size={14} /> Real-time Analysis
        </motion.div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-on-surface tracking-tight leading-tight">
          Live Detection Interface
        </h1>
        <p className="text-on-surface-variant mt-4 max-w-2xl mx-auto text-lg leading-relaxed">
          Our advanced neural network analyzes behavioral markers in real-time. Please ensure the subject is well-lit and centered in the frame.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Camera Feed Area */}
        <div className="lg:col-span-8">
          <div className="aspect-video bg-surface-container-highest rounded-3xl overflow-hidden relative shadow-2xl border border-outline-variant/20">
            <div className="absolute inset-0 flex items-center justify-center text-on-surface-variant/40 flex-col gap-4">
              <Video size={64} strokeWidth={1} />
              <p className="font-medium">Camera Feed Initializing...</p>
            </div>
            
            {/* Overlay UI */}
            <div className="absolute top-6 left-6 flex gap-3">
              <div className="px-3 py-1.5 bg-black/50 backdrop-blur-md rounded-full text-white text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-error animate-pulse"></span> Live
              </div>
              <div className="px-3 py-1.5 bg-black/50 backdrop-blur-md rounded-full text-white text-[10px] font-bold uppercase tracking-widest">
                FPS: 60
              </div>
            </div>

            <div className="absolute bottom-6 left-6 right-6 grid grid-cols-3 gap-4">
              {[
                { label: 'Gaze', val: '82%' },
                { label: 'Attention', val: '94%' },
                { label: 'Affect', val: 'Typical' }
              ].map((m, i) => (
                <div key={i} className="bg-black/50 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                  <p className="text-[9px] font-bold text-white/60 uppercase tracking-widest mb-1">{m.label}</p>
                  <p className="text-xl font-bold text-white">{m.val}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Controls & Info */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-surface-container-low p-8 rounded-3xl border border-outline-variant/10">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Shield size={20} className="text-primary" /> Privacy Guard
            </h3>
            <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
              All analysis is performed locally on your device. No video data is transmitted to our servers or stored without your explicit permission.
            </p>
            <button className="w-full bg-primary text-white py-4 rounded-2xl font-bold hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-primary/20">
              Enable Camera Access
            </button>
          </div>

          <div className="bg-surface-container-low p-8 rounded-3xl border border-outline-variant/10">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Zap size={20} className="text-tertiary" /> Quick Tips
            </h3>
            <ul className="space-y-4 text-sm text-on-surface-variant">
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
                Minimize background noise
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
