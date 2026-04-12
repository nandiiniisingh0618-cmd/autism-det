"""
Video Processing Backend API
Handles batch video frame processing and aggregation
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import cv2
import os
import logging
import base64
import time
from io import BytesIO
from PIL import Image
import random
import threading
from concurrent.futures import ThreadPoolExecutor
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Import eye-tracking model from main app
try:
    from app_realtime import EyeTrackingModel, preprocessing_config
except ImportError:
    logger.warning("Could not import from app_realtime, using fallback")
    EyeTrackingModel = None
    preprocessing_config = {
        'target_size': (224, 224),
        'normalize': True,
        'color_mode': 'RGB'
    }

# Global variables
eye_tracking_model = None
model_loaded = False
processing_stats = {
    'total_frames_processed': 0,
    'total_batches_processed': 0,
    'average_processing_time': 0,
    'active_processes': 0
}

# Thread pool for concurrent processing
executor = ThreadPoolExecutor(max_workers=4)

def decode_base64_image(base64_string):
    """Decode base64 image string to numpy array"""
    try:
        if 'base64,' in base64_string:
            base64_string = base64_string.split('base64,')[1]
        
        image_data = base64.b64decode(base64_string)
        pil_image = Image.open(BytesIO(image_data))
        frame = np.array(pil_image)
        
        if len(frame.shape) == 3 and frame.shape[2] == 3:
            frame = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)
        
        return frame
        
    except Exception as e:
        logger.error(f"Error decoding base64 image: {e}")
        raise ValueError(f"Invalid image data: {e}")

def load_autism_model():
    """Load autism detection model"""
    global eye_tracking_model, model_loaded
    
    try:
        if EyeTrackingModel:
            eye_tracking_model = EyeTrackingModel()
            model_path = "autism_eye_model.h5"
            
            if eye_tracking_model.load_model(model_path):
                model_loaded = True
                logger.info("Eye-tracking model loaded successfully for video processing")
                return True
            else:
                logger.error("Failed to load eye-tracking model for video processing")
                return False
        else:
            logger.warning("EyeTrackingModel not available, using mock model")
            eye_tracking_model = EyeTrackingModel() if EyeTrackingModel else None
            model_loaded = True
            return True
            
    except Exception as e:
        logger.error(f"Error loading model: {e}")
        return False

def process_single_frame(frame_data, frame_index):
    """Process a single frame and return prediction"""
    try:
        start_time = time.time()
        
        # Decode image
        frame = decode_base64_image(frame_data['image'])
        timestamp = frame_data.get('timestamp', frame_index)
        
        # Run prediction
        if model_loaded and eye_tracking_model:
            result = eye_tracking_model.predict_autism(frame)
        else:
            # Mock prediction for testing
            result = {
                'prediction': random.choice(['ASD Detected', 'No ASD Traits']),
                'confidence': random.uniform(0.3, 0.95),
                'confidence_percentage': random.uniform(30, 95),
                'features': {
                    'gaze_consistency': random.uniform(0.3, 0.9),
                    'blink_rate': random.uniform(0.1, 0.8),
                    'saccadic_movements': random.uniform(0.2, 0.7),
                    'pupil_dilation': random.uniform(0.4, 0.8),
                    'attention_span': random.uniform(0.3, 0.9)
                },
                'model_type': 'mock',
                'status': 'success'
            }
        
        # Add frame metadata
        result['frame_index'] = frame_index
        result['timestamp'] = timestamp
        result['processing_time_ms'] = round((time.time() - start_time) * 1000, 2)
        
        return result
        
    except Exception as e:
        logger.error(f"Error processing frame {frame_index}: {e}")
        return {
            'frame_index': frame_index,
            'timestamp': frame_data.get('timestamp', frame_index),
            'error': str(e),
            'status': 'error'
        }

def aggregate_batch_predictions(predictions, aggregation_method='majority'):
    """Aggregate predictions from a batch"""
    valid_predictions = [p for p in predictions if p.get('status') == 'success']
    
    if not valid_predictions:
        return {
            'prediction': 'No ASD Traits',
            'confidence': 0.0,
            'confidence_percentage': 0.0,
            'method': aggregation_method,
            'frames_processed': len(predictions),
            'valid_frames': 0
        }
    
    # Count predictions
    asd_count = sum(1 for p in valid_predictions if p['prediction'] == 'ASD Detected')
    no_asd_count = len(valid_predictions) - asd_count
    
    # Calculate aggregated result based on method
    if aggregation_method == 'majority':
        # Majority voting
        if asd_count > no_asd_count:
            final_prediction = 'ASD Detected'
            confidence = asd_count / len(valid_predictions)
        else:
            final_prediction = 'No ASD Traits'
            confidence = no_asd_count / len(valid_predictions)
    
    elif aggregation_method == 'average':
        # Weighted average of confidences
        asd_confidences = [p['confidence'] for p in valid_predictions if p['prediction'] == 'ASD Detected']
        no_asd_confidences = [(1 - p['confidence']) for p in valid_predictions if p['prediction'] == 'No ASD Traits']
        
        avg_asd_confidence = sum(asd_confidences) / len(asd_confidences) if asd_confidences else 0
        avg_no_asd_confidence = sum(no_asd_confidences) / len(no_asd_confidences) if no_asd_confidences else 0
        
        if avg_asd_confidence > avg_no_asd_confidence:
            final_prediction = 'ASD Detected'
            confidence = avg_asd_confidence
        else:
            final_prediction = 'No ASD Traits'
            confidence = avg_no_asd_confidence
    
    else:  # 'weighted'
        # Weight by confidence and count
        asd_weight = sum(p['confidence'] for p in valid_predictions if p['prediction'] == 'ASD Detected')
        no_asd_weight = sum((1 - p['confidence']) for p in valid_predictions if p['prediction'] == 'No ASD Traits')
        
        total_weight = asd_weight + no_asd_weight
        if asd_weight > no_asd_weight:
            final_prediction = 'ASD Detected'
            confidence = asd_weight / total_weight
        else:
            final_prediction = 'No ASD Traits'
            confidence = no_asd_weight / total_weight
    
    return {
        'prediction': final_prediction,
        'confidence': confidence,
        'confidence_percentage': round(confidence * 100, 2),
        'method': aggregation_method,
        'frames_processed': len(predictions),
        'valid_frames': len(valid_predictions),
        'asd_detected': asd_count,
        'no_asd_traits': no_asd_count,
        'avg_processing_time': round(sum(p.get('processing_time_ms', 0) for p in valid_predictions) / len(valid_predictions), 2)
    }

@app.route('/predict-video', methods=['POST'])
def predict_video():
    """
    Process video frames and return aggregated results
    Accepts: JSON with 'frames' array
    Returns: Aggregated prediction with detailed breakdown
    """
    try:
        if not model_loaded:
            return jsonify({
                "error": "Model not loaded. Please check server logs.",
                "status": "error"
            }), 500
        
        data = request.get_json()
        if not data or 'frames' not in data:
            return jsonify({
                "error": "No frames provided. Please send JSON with 'frames' array.",
                "status": "error"
            }), 400
        
        frames = data['frames']
        video_info = data.get('videoInfo', {})
        aggregation_method = data.get('aggregation_method', 'majority')
        
        logger.info(f"Processing video: {len(frames)} frames, method: {aggregation_method}")
        
        start_time = time.time()
        processing_stats['active_processes'] += 1
        
        # Process all frames
        predictions = []
        
        # Process frames in parallel batches
        batch_size = 5
        for i in range(0, len(frames), batch_size):
            batch = frames[i:i + batch_size]
            batch_indices = list(range(i, min(i + batch_size, len(frames))))
            
            # Submit batch to thread pool
            future_results = []
            for j, frame_data in enumerate(batch):
                future = executor.submit(process_single_frame, frame_data, i + j)
                future_results.append(future)
            
            # Collect results
            for future in future_results:
                try:
                    result = future.result(timeout=30)  # 30 second timeout per frame
                    predictions.append(result)
                except Exception as e:
                    logger.error(f"Frame processing timeout or error: {e}")
                    predictions.append({
                        'error': str(e),
                        'status': 'error'
                    })
        
        # Aggregate all predictions
        final_result = aggregate_batch_predictions(predictions, aggregation_method)
        
        # Add video metadata
        final_result.update({
            'video_info': video_info,
            'total_processing_time_ms': round((time.time() - start_time) * 1000, 2),
            'processing_stats': {
                'total_frames': len(frames),
                'successful_frames': len([p for p in predictions if p.get('status') == 'success']),
                'failed_frames': len([p for p in predictions if p.get('status') == 'error']),
                'average_frame_time': round(sum(p.get('processing_time_ms', 0) for p in predictions if p.get('status') == 'success') / len([p for p in predictions if p.get('status') == 'success']), 2)
            },
            'individual_predictions': predictions,
            'status': 'success'
        })
        
        # Update global stats
        processing_stats['total_frames_processed'] += len(frames)
        processing_stats['total_batches_processed'] += 1
        processing_stats['average_processing_time'] = (processing_stats['average_processing_time'] + final_result['total_processing_time_ms']) / 2
        
        logger.info(f"Video processing completed: {final_result['prediction']} with {final_result['confidence_percentage']:.2f}% confidence")
        
        return jsonify(final_result)
        
    except Exception as e:
        logger.error(f"Video processing error: {e}")
        return jsonify({
            "error": "An error occurred during video processing. Please try again.",
            "details": str(e),
            "status": "error"
        }), 500
    
    finally:
        processing_stats['active_processes'] -= 1

@app.route('/predict-batch', methods=['POST'])
def predict_batch():
    """
    Process a batch of frames (for concurrent processing)
    Accepts: JSON with 'frames' array and batch metadata
    Returns: Batch predictions
    """
    try:
        if not model_loaded:
            return jsonify({
                "error": "Model not loaded",
                "status": "error"
            }), 500
        
        data = request.get_json()
        frames = data['frames']
        batch_index = data.get('batchIndex', 0)
        
        logger.info(f"Processing batch {batchIndex}: {len(frames)} frames")
        
        start_time = time.time()
        
        # Process frames in parallel
        predictions = []
        for i, frame_data in enumerate(frames):
            frame_index = batch_index * 10 + i  # Assuming batch size of 10
            prediction = process_single_frame(frame_data, frame_index)
            predictions.append(prediction)
        
        # Aggregate batch results
        batch_result = aggregate_batch_predictions(predictions)
        batch_result['batch_index'] = batch_index
        batch_result['predictions'] = predictions
        batch_result['batch_processing_time_ms'] = round((time.time() - start_time) * 1000, 2)
        
        return jsonify(batch_result)
        
    except Exception as e:
        logger.error(f"Batch processing error: {e}")
        return jsonify({
            "error": str(e),
            "status": "error"
        }), 500

@app.route('/video-stats', methods=['GET'])
def get_video_stats():
    """Get video processing statistics"""
    return jsonify({
        'processing_stats': processing_stats,
        'model_loaded': model_loaded,
        'model_type': eye_tracking_model.model_type if model_loaded else 'none',
        'thread_pool_size': executor._max_workers,
        'active_threads': executor._threads.__len__() if hasattr(executor, '_threads') else 0
    })

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "video_processing_enabled": True,
        "model_loaded": model_loaded,
        "processing_stats": processing_stats,
        "message": "Video Processing API is running",
        "timestamp": time.time()
    })

@app.route('/config', methods=['GET'])
def get_config():
    """Get current configuration"""
    return jsonify({
        "model": {
            "loaded": model_loaded,
            "type": eye_tracking_model.model_type if model_loaded else "none",
            "threshold": eye_tracking_model.confidence_threshold if model_loaded else 0.5
        },
        "processing": {
            "batch_size": 10,
            "max_workers": 4,
            "timeout_per_frame": 30,
            "aggregation_methods": ["majority", "average", "weighted"]
        },
        "preprocessing": preprocessing_config
    })

@app.errorhandler(413)
def too_large(e):
    """Handle file too large error"""
    return jsonify({
        "error": "Request too large. Please send smaller batches.",
        "status": "error"
    }), 413

@app.errorhandler(404)
def not_found(e):
    """Handle 404 errors"""
    return jsonify({
        "error": "Endpoint not found. Available endpoints: /health, /predict-video, /predict-batch, /video-stats, /config",
        "status": "error"
    }), 404

@app.errorhandler(500)
def internal_error(e):
    """Handle 500 errors"""
    return jsonify({
        "error": "Internal server error. Please try again later.",
        "status": "error"
    }), 500

if __name__ == '__main__':
    logger.info("Starting Video Processing Backend API...")
    
    # Load model at startup
    if load_autism_model():
        logger.info("Video processing backend ready!")
        app.run(host='0.0.0.0', port=5002, debug=True, threaded=True)
    else:
        logger.error("Failed to load model. Exiting...")
        print("ERROR: Could not initialize eye-tracking model for video processing.")
