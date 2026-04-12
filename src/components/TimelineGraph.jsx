/**
 * TimelineGraph Component - Visualizes prediction timeline for video analysis
 * Shows confidence scores and ASD detection patterns over time
 */

import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { BarChart3, TrendingUp, Clock, AlertCircle } from 'lucide-react';

const TimelineGraph = ({ 
  timeline, 
  videoDuration, 
  highlightedFrames = [],
  showDetails = true 
}) => {
  // Process timeline data for visualization
  const processedData = useMemo(() => {
    if (!timeline || !timeline.length) return null;

    return {
      labels: timeline.map((point, index) => `${Math.round(point.timestamp)}s`),
      datasets: [
        {
          label: 'Confidence Score',
          data: timeline.map(point => point.confidence_percentage),
          borderColor: point.isAsdDetected ? '#ef4444' : '#22c55e',
          backgroundColor: timeline.map(point => 
            point.isAsdDetected ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)'
          ),
          tension: 0.4
        }
      ],
      stats: {
        totalFrames: timeline.length,
        asdFrames: timeline.filter(point => point.isAsdDetected).length,
        avgConfidence: timeline.reduce((sum, point) => sum + point.confidence_percentage, 0) / timeline.length,
        maxConfidence: Math.max(...timeline.map(point => point.confidence_percentage)),
        minConfidence: Math.min(...timeline.map(point => point.confidence_percentage))
      }
    };
  }, [timeline]);

  if (!processedData) {
    return (
      <div className="bg-surface-container-low p-6 rounded-3xl border border-outline-variant/10">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <BarChart3 size={20} className="text-secondary" />
          Prediction Timeline
        </h3>
        <div className="text-center py-8 text-on-surface-variant/60">
          <BarChart3 size={48} className="mx-auto mb-4" />
          <p>No timeline data available</p>
        </div>
      </div>
    );
  }

  const { stats } = processedData;

  // Create simple SVG visualization
  const createTimelineVisualization = () => {
    const width = 600;
    const height = 200;
    const padding = 40;
    const graphWidth = width - 2 * padding;
    const graphHeight = height - 2 * padding;

    // Calculate points
    const points = timeline.map((point, index) => {
      const x = padding + (index / (timeline.length - 1)) * graphWidth;
      const y = padding + graphHeight - (point.confidence_percentage / 100) * graphHeight;
      return { x, y, ...point };
    });

    // Create path
    const pathData = points.map((point, index) => 
      `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
    ).join(' ');

    return (
      <svg width={width} height={height} className="w-full h-auto">
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((value) => (
          <g key={value}>
            <line
              x1={padding}
              y1={padding + graphHeight - (value / 100) * graphHeight}
              x2={width - padding}
              y2={padding + graphHeight - (value / 100) * graphHeight}
              stroke="currentColor"
              strokeOpacity="0.1"
            />
            <text
              x={padding - 10}
              y={padding + graphHeight - (value / 100) * graphHeight + 4}
              textAnchor="end"
              fontSize="10"
              fill="currentColor"
              fillOpacity="0.6"
            >
              {value}%
            </text>
          </g>
        ))}

        {/* Confidence line */}
        <path
          d={pathData}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-primary"
        />

        {/* Area fill */}
        <path
          d={`${pathData} L ${width - padding} ${padding + graphHeight} L ${padding} ${padding + graphHeight} Z`}
          fill="currentColor"
          fillOpacity="0.1"
          className="text-primary"
        />

        {/* Data points */}
        {points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="4"
            fill={point.isAsdDetected ? '#ef4444' : '#22c55e'}
            stroke="white"
            strokeWidth="2"
            className="cursor-pointer hover:r-6 transition-all"
          />
        ))}

        {/* Highlighted frames */}
        {highlightedFrames.slice(0, 5).map((frame, index) => {
          const pointIndex = timeline.findIndex(p => p.timestamp === frame.timestamp);
          if (pointIndex === -1) return null;
          
          const point = points[pointIndex];
          return (
            <circle
              key={`highlight-${index}`}
              cx={point.x}
              cy={point.y}
              r="8"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2"
              strokeDasharray="4 2"
              className="animate-pulse"
            />
          );
        })}

        {/* X-axis labels */}
        {timeline.filter((_, index) => index % Math.ceil(timeline.length / 8) === 0).map((point, index) => {
          const pointIndex = timeline.indexOf(point);
          const x = padding + (pointIndex / (timeline.length - 1)) * graphWidth;
          return (
            <text
              key={index}
              x={x}
              y={height - 10}
              textAnchor="middle"
              fontSize="10"
              fill="currentColor"
              fillOpacity="0.6"
            >
              {Math.round(point.timestamp)}s
            </text>
          );
        })}
      </svg>
    );
  };

  return (
    <div className="bg-surface-container-low p-6 rounded-3xl border border-outline-variant/10">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <BarChart3 size={20} className="text-secondary" />
          Prediction Timeline
        </h3>
        
        {videoDuration && (
          <div className="flex items-center gap-2 text-sm text-on-surface-variant">
            <Clock size={16} />
            <span>{Math.round(videoDuration)}s total</span>
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-surface-container rounded-xl">
          <div className="text-2xl font-bold text-primary">{stats.totalFrames}</div>
          <div className="text-xs text-on-surface-variant">Total Frames</div>
        </div>
        
        <div className="text-center p-3 bg-surface-container rounded-xl">
          <div className="text-2xl font-bold text-error">{stats.asdFrames}</div>
          <div className="text-xs text-on-surface-variant">ASD Detected</div>
        </div>
        
        <div className="text-center p-3 bg-surface-container rounded-xl">
          <div className="text-2xl font-bold text-tertiary">{Math.round(stats.avgConfidence)}%</div>
          <div className="text-xs text-on-surface-variant">Avg Confidence</div>
        </div>
        
        <div className="text-center p-3 bg-surface-container rounded-xl">
          <div className="text-2xl font-bold text-secondary">{Math.round(stats.maxConfidence)}%</div>
          <div className="text-xs text-on-surface-variant">Max Confidence</div>
        </div>
      </div>

      {/* Timeline Visualization */}
      <div className="mb-6">
        <div className="bg-surface-container-highest rounded-xl p-4 overflow-x-auto">
          {createTimelineVisualization()}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#22c55e]"></div>
          <span className="text-on-surface-variant">No ASD Traits</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#ef4444]"></div>
          <span className="text-on-surface-variant">ASD Detected</span>
        </div>
        {highlightedFrames.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full border-2 border-[#f59e0b] border-dashed"></div>
            <span className="text-on-surface-variant">Highlighted</span>
          </div>
        )}
      </div>

      {/* Detailed Analysis */}
      {showDetails && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-6 pt-6 border-t border-outline-variant/20"
        >
          <h4 className="font-bold mb-4 flex items-center gap-2">
            <TrendingUp size={16} />
            Analysis Summary
          </h4>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Detection Rate:</span>
              <span className="font-medium">
                {Math.round((stats.asdFrames / stats.totalFrames) * 100)}%
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Confidence Range:</span>
              <span className="font-medium">
                {Math.round(stats.minConfidence)}% - {Math.round(stats.maxConfidence)}%
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Frame Interval:</span>
              <span className="font-medium">
                ~{Math.round((videoDuration || 0) / stats.totalFrames)}s
              </span>
            </div>
          </div>

          {/* ASD Detection Pattern */}
          {stats.asdFrames > 0 && (
            <div className="mt-4 p-3 bg-error-container/10 rounded-xl">
              <div className="flex items-center gap-2 text-error mb-2">
                <AlertCircle size={16} />
                <span className="font-medium">ASD Detection Pattern</span>
              </div>
              
              <div className="text-xs text-on-surface-variant">
                {stats.asdFrames > stats.totalFrames * 0.5 
                  ? 'High frequency of ASD detections detected. Further clinical evaluation recommended.'
                  : stats.asdFrames > stats.totalFrames * 0.2
                  ? 'Moderate ASD detection pattern. Consider additional assessment.'
                  : 'Low frequency of ASD detections. Results suggest typical development patterns.'
                }
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default TimelineGraph;
