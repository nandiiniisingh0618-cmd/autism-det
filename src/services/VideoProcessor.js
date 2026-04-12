/**
 * VideoProcessor Service - Handles video frame processing and batch analysis
 * Manages frame extraction, processing, and result aggregation
 */

class VideoProcessor {
  constructor() {
    this.apiBaseUrl = 'http://127.0.0.1:5000';
    this.processingQueue = [];
    this.isProcessing = false;
    this.currentBatch = null;
    this.results = [];
    this.onProgressCallback = null;
    this.onCompleteCallback = null;
    this.onErrorCallback = null;
    this.onFrameProcessedCallback = null;
    
    // Processing configuration
    this.config = {
      batchSize: 10,           // Number of frames to send in each batch
      frameInterval: 1.0,      // Seconds between frames
      maxConcurrentRequests: 3, // Max parallel API calls
      aggregationMethod: 'majority', // 'majority', 'average', 'weighted'
      confidenceThreshold: 0.5
    };
  }

  /**
   * Process video frames with batch API calls
   * @param {Array} frames - Array of frame objects with base64 data
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} - Aggregated results
   */
  async processVideoFrames(frames, options = {}) {
    try {
      this.isProcessing = true;
      this.results = [];
      
      // Update config with options
      this.config = { ...this.config, ...options };
      
      console.log(`Starting video processing: ${frames.length} frames`);
      
      // Split frames into batches
      const batches = this.createBatches(frames, this.config.batchSize);
      console.log(`Created ${batches.length} batches of ${this.config.batchSize} frames each`);
      
      // Process batches with concurrency control
      const batchResults = await this.processBatchesConcurrently(batches);
      
      // Aggregate results
      const finalResult = this.aggregateResults(batchResults);
      
      console.log('Video processing completed successfully');
      
      if (this.onCompleteCallback) {
        this.onCompleteCallback(finalResult);
      }
      
      return finalResult;
      
    } catch (error) {
      console.error('Video processing failed:', error);
      
      if (this.onErrorCallback) {
        this.onErrorCallback(error.message || 'Video processing failed');
      }
      
      throw error;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Create batches from frames array
   * @param {Array} frames - Frames to batch
   * @param {number} batchSize - Size of each batch
   * @returns {Array} - Array of batches
   */
  createBatches(frames, batchSize) {
    const batches = [];
    
    for (let i = 0; i < frames.length; i += batchSize) {
      const batch = frames.slice(i, i + batchSize);
      batches.push({
        batchIndex: Math.floor(i / batchSize),
        frames: batch,
        frameRange: `${i + 1}-${Math.min(i + batchSize, frames.length)}`
      });
    }
    
    return batches;
  }

  /**
   * Process batches with concurrency control
   * @param {Array} batches - Batches to process
   * @returns {Promise<Array>} - Array of batch results
   */
  async processBatchesConcurrently(batches) {
    const results = [];
    const semaphore = new Array(this.config.maxConcurrentRequests).fill(null);
    
    for (let i = 0; i < batches.length; i++) {
      // Wait for available slot
      await this.waitForSlot(semaphore);
      
      // Process batch in background
      const slotIndex = semaphore.findIndex(slot => slot === null);
      semaphore[slotIndex] = i;
      
      this.processBatch(batches[i], i, batches.length)
        .then(result => {
          results[i] = result;
          semaphore[slotIndex] = null;
        })
        .catch(error => {
          console.error(`Batch ${i} failed:`, error);
          results[i] = { error: error.message, batchIndex: i };
          semaphore[slotIndex] = null;
        });
      
      // Update progress
      const progress = ((i + 1) / batches.length) * 100;
      if (this.onProgressCallback) {
        this.onProgressCallback(progress, i + 1, batches.length);
      }
    }
    
    // Wait for all batches to complete
    await this.waitForAllSlots(semaphore);
    
    return results;
  }

  /**
   * Process single batch
   * @param {Object} batch - Batch to process
   * @param {number} batchIndex - Batch index
   * @param {number} totalBatches - Total number of batches
   * @returns {Promise<Object>} - Batch result
   */
  async processBatch(batch, batchIndex, totalBatches) {
    try {
      console.log(`Processing batch ${batchIndex + 1}/${totalBatches} (${batch.frameRange})`);
      
      const response = await fetch(`${this.apiBaseUrl}/predict-batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          frames: batch.frames.map(frame => ({
            timestamp: frame.timestamp,
            image: frame.base64
          })),
          batchIndex: batchIndex,
          totalBatches: totalBatches
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Batch ${batchIndex} processing failed`);
      }

      const result = await response.json();
      
      // Add batch metadata
      result.batchIndex = batchIndex;
      result.frameRange = batch.frameRange;
      result.processedAt = Date.now();
      
      // Notify about each frame processed
      if (this.onFrameProcessedCallback) {
        result.predictions.forEach((prediction, index) => {
          this.onFrameProcessedCallback(prediction, batch.batchIndex * this.config.batchSize + index);
        });
      }
      
      return result;
      
    } catch (error) {
      console.error(`Batch ${batchIndex} processing failed:`, error);
      throw error;
    }
  }

  /**
   * Aggregate results from multiple batches
   * @param {Array} batchResults - Results from all batches
   * @returns {Object} - Final aggregated result
   */
  aggregateResults(batchResults) {
    // Collect all predictions
    const allPredictions = [];
    const frameResults = [];
    
    batchResults.forEach(batchResult => {
      if (batchResult.predictions) {
        batchResult.predictions.forEach(prediction => {
          allPredictions.push(prediction);
          frameResults.push({
            timestamp: prediction.timestamp,
            prediction: prediction.prediction,
            confidence: prediction.confidence,
            confidence_percentage: prediction.confidence_percentage,
            features: prediction.features,
            batchIndex: batchResult.batchIndex
          });
        });
      }
    });

    if (allPredictions.length === 0) {
      throw new Error('No valid predictions found');
    }

    // Calculate aggregated results based on method
    const aggregated = this.calculateAggregatedResults(allPredictions);
    
    // Create timeline data
    const timeline = this.createTimeline(frameResults);
    
    // Find ASD-detected frames for highlighting
    const asdFrames = frameResults.filter(frame => frame.prediction === 'ASD Detected');
    
    return {
      final_prediction: aggregated.prediction,
      confidence: aggregated.confidence,
      confidence_percentage: aggregated.confidence_percentage,
      frames_analyzed: allPredictions.length,
      aggregation_method: this.config.aggregationMethod,
      
      // Detailed breakdown
      breakdown: {
        asd_detected: asdFrames.length,
        no_asd_traits: allPredictions.length - asdFrames.length,
        asd_percentage: (asdFrames.length / allPredictions.length) * 100,
        avg_confidence: aggregated.avgConfidence,
        confidence_distribution: this.getConfidenceDistribution(allPredictions)
      },
      
      // Timeline and visualization data
      timeline: timeline,
      frame_results: frameResults,
      highlighted_frames: asdFrames.slice(0, 10), // Top 10 ASD frames for highlighting
      
      // Processing metadata
      processing_info: {
        total_batches: batchResults.length,
        successful_batches: batchResults.filter(br => !br.error).length,
        failed_batches: batchResults.filter(br => br.error).length,
        processing_time: Date.now() - (batchResults[0]?.processedAt || Date.now()),
        config: this.config
      }
    };
  }

  /**
   * Calculate aggregated results using specified method
   * @param {Array} predictions - All predictions
   * @returns {Object} - Aggregated result
   */
  calculateAggregatedResults(predictions) {
    const asdPredictions = predictions.filter(p => p.prediction === 'ASD Detected');
    const noAsdPredictions = predictions.filter(p => p.prediction === 'No ASD Traits');
    
    let prediction, confidence, confidence_percentage;
    
    switch (this.config.aggregationMethod) {
      case 'majority':
        // Majority voting
        if (asdPredictions.length > noAsdPredictions.length) {
          prediction = 'ASD Detected';
          confidence = asdPredictions.reduce((sum, p) => sum + p.confidence, 0) / asdPredictions.length;
        } else {
          prediction = 'No ASD Traits';
          confidence = noAsdPredictions.reduce((sum, p) => sum + p.confidence, 0) / noAsdPredictions.length;
        }
        confidence_percentage = confidence * 100;
        break;
        
      case 'average':
        // Weighted average of confidences
        const avgAsdConfidence = asdPredictions.length > 0 
          ? asdPredictions.reduce((sum, p) => sum + p.confidence, 0) / asdPredictions.length 
          : 0;
        const avgNoAsdConfidence = noAsdPredictions.length > 0 
          ? noAsdPredictions.reduce((sum, p) => sum + p.confidence, 0) / noAsdPredictions.length 
          : 0;
        
        if (avgAsdConfidence > avgNoAsdConfidence) {
          prediction = 'ASD Detected';
          confidence = avgAsdConfidence;
        } else {
          prediction = 'No ASD Traits';
          confidence = avgNoAsdConfidence;
        }
        confidence_percentage = confidence * 100;
        break;
        
      case 'weighted':
        // Weight by confidence and count
        const asdWeight = asdPredictions.reduce((sum, p) => sum + p.confidence, 0);
        const noAsdWeight = noAsdPredictions.reduce((sum, p) => sum + (1 - p.confidence), 0);
        
        if (asdWeight > noAsdWeight) {
          prediction = 'ASD Detected';
          confidence = asdWeight / predictions.length;
        } else {
          prediction = 'No ASD Traits';
          confidence = noAsdWeight / predictions.length;
        }
        confidence_percentage = confidence * 100;
        break;
        
      default:
        // Default to majority voting
        return this.calculateAggregatedResults(predictions, 'majority');
    }
    
    return {
      prediction,
      confidence,
      confidence_percentage,
      avgConfidence: predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length
    };
  }

  /**
   * Create timeline data for visualization
   * @param {Array} frameResults - Frame results with timestamps
   * @returns {Array} - Timeline data points
   */
  createTimeline(frameResults) {
    return frameResults.map((frame, index) => ({
      index: index,
      timestamp: frame.timestamp,
      prediction: frame.prediction,
      confidence: frame.confidence,
      confidence_percentage: frame.confidence_percentage,
      isAsdDetected: frame.prediction === 'ASD Detected',
      features: frame.features
    })).sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Get confidence distribution statistics
   * @param {Array} predictions - All predictions
   * @returns {Object} - Distribution stats
   */
  getConfidenceDistribution(predictions) {
    const confidences = predictions.map(p => p.confidence);
    
    return {
      min: Math.min(...confidences),
      max: Math.max(...confidences),
      mean: confidences.reduce((sum, c) => sum + c, 0) / confidences.length,
      median: this.calculateMedian(confidences),
      std_dev: this.calculateStandardDeviation(confidences),
      quartiles: this.calculateQuartiles(confidences)
    };
  }

  /**
   * Calculate median value
   * @param {Array} values - Array of numbers
   * @returns {number} - Median
   */
  calculateMedian(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 
      ? (sorted[mid - 1] + sorted[mid]) / 2 
      : sorted[mid];
  }

  /**
   * Calculate standard deviation
   * @param {Array} values - Array of numbers
   * @returns {number} - Standard deviation
   */
  calculateStandardDeviation(values) {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    return Math.sqrt(avgSquaredDiff);
  }

  /**
   * Calculate quartiles
   * @param {Array} values - Array of numbers
   * @returns {Object} - Quartile values
   */
  calculateQuartiles(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const q1Index = Math.floor(sorted.length * 0.25);
    const q2Index = Math.floor(sorted.length * 0.5);
    const q3Index = Math.floor(sorted.length * 0.75);
    
    return {
      q1: sorted[q1Index],
      q2: sorted[q2Index],
      q3: sorted[q3Index]
    };
  }

  /**
   * Wait for available semaphore slot
   * @param {Array} semaphore - Semaphore array
   * @returns {Promise} - Promise that resolves when slot is available
   */
  async waitForSlot(semaphore) {
    return new Promise(resolve => {
      const checkSlot = () => {
        if (semaphore.includes(null)) {
          resolve();
        } else {
          setTimeout(checkSlot, 100);
        }
      };
      checkSlot();
    });
  }

  /**
   * Wait for all semaphore slots to be null
   * @param {Array} semaphore - Semaphore array
   * @returns {Promise} - Promise that resolves when all slots are free
   */
  async waitForAllSlots(semaphore) {
    return new Promise(resolve => {
      const checkAllSlots = () => {
        if (semaphore.every(slot => slot === null)) {
          resolve();
        } else {
          setTimeout(checkAllSlots, 100);
        }
      };
      checkAllSlots();
    });
  }

  /**
   * Set callback functions
   * @param {Object} callbacks - Callback functions
   */
  setCallbacks(callbacks) {
    this.onProgressCallback = callbacks.onProgress;
    this.onCompleteCallback = callbacks.onComplete;
    this.onErrorCallback = callbacks.onError;
    this.onFrameProcessedCallback = callbacks.onFrameProcessed;
  }

  /**
   * Update processing configuration
   * @param {Object} newConfig - New configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current processing status
   * @returns {Object} - Current status
   */
  getStatus() {
    return {
      isProcessing: this.isProcessing,
      currentBatch: this.currentBatch,
      resultsCount: this.results.length,
      config: this.config
    };
  }

  /**
   * Cancel processing
   */
  cancelProcessing() {
    this.isProcessing = false;
    this.processingQueue = [];
    this.currentBatch = null;
  }
}

export default VideoProcessor;
