import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  Eye, 
  Brain, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  Zap,
  TrendingUp,
  BarChart3
} from 'lucide-react';

const RealTimeDashboard = ({ 
  prediction, 
  status, 
  error, 
  processingTime,
  features,
  isAnalyzing 
}) => {
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({
    totalAnalyses: 0,
    asdDetections: 0,
    avgConfidence: 0,
    avgProcessingTime: 0
  });

  // Update history and stats when new prediction arrives
  useEffect(() => {
    if (prediction) {
      const newEntry = {
        timestamp: new Date(),
        prediction: prediction.prediction,
        confidence: prediction.confidence_percentage,
        processingTime: prediction.processing_time_ms
      };

      setHistory(prev => {
        const updated = [newEntry, ...prev].slice(0, 10); // Keep last 10
        return updated;
      });

      // Update stats
      setStats(prev => {
        const newTotal = prev.totalAnalyses + 1;
        const newAsdDetections = prev.asdDetections + (prediction.prediction === 'ASD Detected' ? 1 : 0);
        const newAvgConfidence = ((prev.avgConfidence * prev.totalAnalyses) + prediction.confidence_percentage) / newTotal;
        const newAvgProcessingTime = ((prev.avgProcessingTime * prev.totalAnalyses) + prediction.processing_time_ms) / newTotal;

        return {
          totalAnalyses: newTotal,
          asdDetections: newAsdDetections,
          avgConfidence: newAvgConfidence,
          avgProcessingTime: newAvgProcessingTime
        };
      });
    }
  }, [prediction]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Analyzing...': return 'text-tertiary';
      case 'Monitoring...': return 'text-primary';
      case 'Initializing camera...': return 'text-secondary';
      default: return 'text-on-surface-variant';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Analyzing...': return <Brain className="animate-pulse" size={16} />;
      case 'Monitoring...': return <Eye className="animate-pulse" size={16} />;
      default: return <Activity size={16} />;
    }
  };

  const getPredictionColor = (prediction) => {
    if (!prediction) return 'text-on-surface-variant';
    return prediction.prediction === 'ASD Detected' ? 'text-error' : 'text-[#2e7d32]';
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return 'text-[#2e7d32]';
    if (confidence >= 60) return 'text-tertiary';
    return 'text-error';
  };

  return (
    <div className="space-y-6">
      {/* Status Bar */}
      <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 ${getStatusColor(status)}`}>
              {getStatusIcon(status)}
              <span className="font-medium">{status}</span>
            </div>
            {isAnalyzing && (
              <div className="flex items-center gap-2 text-tertiary">
                <div className="w-2 h-2 border-2 border-tertiary border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm">Processing...</span>
              </div>
            )}
          </div>
          {processingTime && (
            <div className="flex items-center gap-2 text-on-surface-variant text-sm">
              <Clock size={14} />
              <span>{processingTime}ms</span>
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-error-container text-error p-4 rounded-2xl flex items-center gap-3"
          >
            <AlertCircle size={20} />
            <span className="font-medium">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Current Prediction */}
      {prediction && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-surface-container-lowest p-6 rounded-3xl border-l-4 border-outline-variant"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Current Analysis</h3>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              prediction.prediction === 'ASD Detected' 
                ? 'bg-error-container text-error' 
                : 'bg-[#e8f5e9] text-[#2e7d32]'
            }`}>
              {prediction.prediction}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-on-surface-variant mb-1">Confidence</p>
              <p className={`text-2xl font-bold ${getConfidenceColor(prediction.confidence_percentage)}`}>
                {prediction.confidence_percentage}%
              </p>
            </div>
            <div>
              <p className="text-sm text-on-surface-variant mb-1">Processing Time</p>
              <p className="text-2xl font-bold text-on-surface">
                {prediction.processing_time_ms}ms
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Eye Tracking Features */}
      {features && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface-container-low p-6 rounded-3xl"
        >
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Eye size={20} className="text-primary" />
            Eye Tracking Features
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(features).map(([key, value]) => (
              <div key={key} className="text-center">
                <div className="relative w-16 h-16 mx-auto mb-2">
                  <svg className="w-16 h-16 transform -rotate-90">
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      className="text-outline-variant/20"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      strokeDasharray={`${value * 176} 176`}
                      className={value > 0.7 ? 'text-[#2e7d32]' : value > 0.4 ? 'text-tertiary' : 'text-error'}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold">
                      {Math.round(value * 100)}%
                    </span>
                  </div>
                </div>
                <p className="text-xs text-on-surface-variant capitalize">
                  {key.replace(/_/g, ' ')}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface-container-low p-4 rounded-2xl text-center">
          <BarChart3 size={24} className="mx-auto mb-2 text-primary" />
          <p className="text-2xl font-bold">{stats.totalAnalyses}</p>
          <p className="text-xs text-on-surface-variant">Total Analyses</p>
        </div>
        
        <div className="bg-surface-container-low p-4 rounded-2xl text-center">
          <AlertCircle size={24} className="mx-auto mb-2 text-error" />
          <p className="text-2xl font-bold">{stats.asdDetections}</p>
          <p className="text-xs text-on-surface-variant">ASD Detections</p>
        </div>
        
        <div className="bg-surface-container-low p-4 rounded-2xl text-center">
          <TrendingUp size={24} className="mx-auto mb-2 text-tertiary" />
          <p className="text-2xl font-bold">{Math.round(stats.avgConfidence)}%</p>
          <p className="text-xs text-on-surface-variant">Avg Confidence</p>
        </div>
        
        <div className="bg-surface-container-low p-4 rounded-2xl text-center">
          <Zap size={24} className="mx-auto mb-2 text-secondary" />
          <p className="text-2xl font-bold">{Math.round(stats.avgProcessingTime)}ms</p>
          <p className="text-xs text-on-surface-variant">Avg Processing</p>
        </div>
      </div>

      {/* Recent History */}
      {history.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface-container-low p-6 rounded-3xl"
        >
          <h3 className="text-xl font-bold mb-4">Recent Analyses</h3>
          <div className="space-y-2">
            {history.slice(0, 5).map((entry, index) => (
              <div
                key={entry.timestamp.getTime()}
                className="flex items-center justify-between p-3 bg-surface-container-lowest rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    entry.prediction === 'ASD Detected' ? 'bg-error' : 'bg-[#2e7d32]'
                  }`} />
                  <span className={`font-medium text-sm ${getPredictionColor(entry)}`}>
                    {entry.prediction}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-on-surface-variant">
                  <span>{entry.confidence}%</span>
                  <span>{entry.processingTime}ms</span>
                  <span>{entry.timestamp.toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default RealTimeDashboard;
