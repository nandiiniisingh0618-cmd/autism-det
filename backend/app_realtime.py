"""
Real-time Autism Detection Backend API
Handles base64 image input from webcam frames
Integrates with eye-tracking model for ASD detection
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

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Global variables
model = None
model_loaded = False
preprocessing_config = {
    'target_size': (224, 224),
    'normalize': True,
    'color_mode': 'RGB'
}

class EyeTrackingModel:
    """
    Eye Tracking Model for Autism Detection
    Placeholder for actual eye-tracking model integration
    """
    
    def __init__(self):
        self.model_type = "mock"
        self.confidence_threshold = 0.5
        self.eye_tracking_features = [
            'gaze_consistency',
            'blink_rate', 
            'saccadic_movements',
            'pupil_dilation',
            'attention_span'
        ]
        
    def load_model(self, model_path):
        """Load the trained eye-tracking model"""
        try:
            # Try to load actual model if available
            if os.path.exists(model_path):
                try:
                    from tensorflow.keras.models import load_model
                    self.model = load_model(model_path)
                    self.model_type = "tensorflow"
                    logger.info(f"Loaded TensorFlow model from {model_path}")
                    return True
                except ImportError:
                    logger.warning("TensorFlow not available, using mock model")
                except Exception as e:
                    logger.error(f"Error loading TensorFlow model: {e}")
            
            # Fallback to mock model
            self.model_type = "mock"
            logger.info("Using mock eye-tracking model")
            return True
            
        except Exception as e:
            logger.error(f"Error in load_model: {e}")
            return False
    
    def preprocess_frame(self, frame):
        """
        Preprocess frame for eye-tracking analysis
        Args:
            frame: numpy array (H, W, C)
        Returns:
            preprocessed frame ready for model
        """
        try:
            # Convert BGR to RGB if needed
            if len(frame.shape) == 3 and frame.shape[2] == 3:
                frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            
            # Resize to target size
            frame = cv2.resize(frame, preprocessing_config['target_size'])
            
            # Normalize pixel values
            if preprocessing_config['normalize']:
                frame = frame.astype(np.float32) / 255.0
            
            # Add batch dimension
            frame = np.expand_dims(frame, axis=0)
            
            return frame
            
        except Exception as e:
            logger.error(f"Error preprocessing frame: {e}")
            raise
    
    def extract_eye_tracking_features(self, frame):
        """
        Extract eye-tracking features from frame
        This is a placeholder - real implementation would use:
        - Eye detection (Haar cascades or dlib)
        - Gaze estimation
        - Blink detection
        - Pupil tracking
        """
        try:
            # Mock feature extraction
            features = {
                'gaze_consistency': random.uniform(0.3, 0.9),
                'blink_rate': random.uniform(0.1, 0.8),
                'saccadic_movements': random.uniform(0.2, 0.7),
                'pupil_dilation': random.uniform(0.4, 0.8),
                'attention_span': random.uniform(0.3, 0.9)
            }
            
            # Add some temporal consistency for realistic results
            if hasattr(self, '_last_features'):
                for key in features:
                    # Smooth the features with previous values
                    features[key] = 0.7 * features[key] + 0.3 * self._last_features.get(key, features[key])
            
            self._last_features = features
            return features
            
        except Exception as e:
            logger.error(f"Error extracting features: {e}")
            return None
    
    def predict_autism(self, frame):
        """
        Predict autism from eye-tracking features
        Args:
            frame: preprocessed frame
        Returns:
            prediction dict with confidence and features
        """
        try:
            # Extract eye-tracking features
            features = self.extract_eye_tracking_features(frame)
            if features is None:
                raise ValueError("Failed to extract eye-tracking features")
            
            if self.model_type == "tensorflow" and hasattr(self, 'model'):
                # Real model prediction
                preprocessed = self.preprocess_frame(frame)
                prediction = self.model.predict(preprocessed)[0][0]
            else:
                # Mock prediction based on features
                # Combine features with weights for more realistic prediction
                weighted_score = (
                    0.3 * features['gaze_consistency'] +
                    0.2 * (1 - features['blink_rate']) +  # Lower blink rate is often associated with ASD
                    0.2 * features['saccadic_movements'] +
                    0.15 * features['pupil_dilation'] +
                    0.15 * features['attention_span']
                )
                
                # Add some randomness and bias
                prediction = weighted_score + random.uniform(-0.1, 0.1)
                prediction = np.clip(prediction, 0, 1)
            
            # Determine result
            result = "ASD Detected" if prediction > self.confidence_threshold else "No ASD Traits"
            confidence = float(prediction)
            confidence_percentage = confidence * 100 if result == "ASD Detected" else (1 - confidence) * 100
            
            return {
                'prediction': result,
                'confidence': confidence,
                'confidence_percentage': round(confidence_percentage, 2),
                'threshold_used': self.confidence_threshold,
                'features': features,
                'model_type': self.model_type,
                'status': 'success'
            }
            
        except Exception as e:
            logger.error(f"Error in prediction: {e}")
            raise

# Initialize model
eye_tracking_model = EyeTrackingModel()

def load_autism_model():
    """Load the autism detection model"""
    global model, model_loaded
    
    try:
        model_path = "autism_eye_model.h5"
        
        if eye_tracking_model.load_model(model_path):
            model = eye_tracking_model
            model_loaded = True
            logger.info("Eye-tracking model loaded successfully")
            return True
        else:
            logger.error("Failed to load eye-tracking model")
            return False
            
    except Exception as e:
        logger.error(f"Error loading model: {e}")
        return False

def decode_base64_image(base64_string):
    """
    Decode base64 image string to numpy array
    Args:
        base64_string: base64 encoded image with data URL prefix
    Returns:
        numpy array (H, W, C)
    """
    try:
        # Remove data URL prefix if present
        if 'base64,' in base64_string:
            base64_string = base64_string.split('base64,')[1]
        
        # Decode base64
        image_data = base64.b64decode(base64_string)
        
        # Convert to PIL Image
        pil_image = Image.open(BytesIO(image_data))
        
        # Convert to numpy array (RGB)
        frame = np.array(pil_image)
        
        # Convert RGB to BGR for OpenCV processing
        if len(frame.shape) == 3 and frame.shape[2] == 3:
            frame = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)
        
        return frame
        
    except Exception as e:
        logger.error(f"Error decoding base64 image: {e}")
        raise ValueError(f"Invalid image data: {e}")

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "model_loaded": model_loaded,
        "model_type": eye_tracking_model.model_type if model_loaded else "none",
        "features_available": eye_tracking_model.eye_tracking_features,
        "preprocessing_config": preprocessing_config,
        "message": "Real-time Autism Detection API is running",
        "timestamp": time.time()
    })

@app.route('/predict', methods=['POST'])
def predict_autism():
    """
    Predict autism from base64 image
    Expected: JSON with 'image' field containing base64 data
    Returns: JSON with prediction and eye-tracking features
    """
    try:
        # Check if model is loaded
        if not model_loaded:
            return jsonify({
                "error": "Model not loaded. Please check server logs.",
                "status": "error"
            }), 500
        
        # Get JSON data
        data = request.get_json()
        if not data or 'image' not in data:
            return jsonify({
                "error": "No image data provided. Please send JSON with 'image' field.",
                "status": "error"
            }), 400
        
        base64_image = data['image']
        timestamp = data.get('timestamp', time.time())
        
        # Decode base64 image
        frame = decode_base64_image(base64_image)
        
        # Run prediction
        logger.info(f"Processing frame at timestamp {timestamp}")
        start_time = time.time()
        
        result = eye_tracking_model.predict_autism(frame)
        
        processing_time = time.time() - start_time
        result['processing_time_ms'] = round(processing_time * 1000, 2)
        result['timestamp'] = timestamp
        
        logger.info(f"Prediction complete: {result['prediction']} with {result['confidence_percentage']:.2f}% confidence in {processing_time:.3f}s")
        
        return jsonify(result)
        
    except ValueError as e:
        logger.error(f"Validation error: {e}")
        return jsonify({
            "error": str(e),
            "status": "error"
        }), 400
        
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        return jsonify({
            "error": "An error occurred during prediction. Please try again.",
            "details": str(e),
            "status": "error"
        }), 500

@app.route('/config', methods=['GET'])
def get_config():
    """Get current configuration"""
    return jsonify({
        "model": {
            "loaded": model_loaded,
            "type": eye_tracking_model.model_type,
            "threshold": eye_tracking_model.confidence_threshold,
            "features": eye_tracking_model.eye_tracking_features
        },
        "preprocessing": preprocessing_config,
        "api": {
            "version": "1.0.0",
            "endpoints": ["/health", "/predict", "/config"]
        }
    })

@app.route('/config', methods=['POST'])
def update_config():
    """Update configuration (threshold, etc.)"""
    try:
        data = request.get_json()
        
        if 'threshold' in data:
            threshold = float(data['threshold'])
            if 0 <= threshold <= 1:
                eye_tracking_model.confidence_threshold = threshold
                logger.info(f"Updated confidence threshold to {threshold}")
            else:
                return jsonify({"error": "Threshold must be between 0 and 1"}), 400
        
        return jsonify({
            "message": "Configuration updated successfully",
            "threshold": eye_tracking_model.confidence_threshold
        })
        
    except Exception as e:
        logger.error(f"Config update error: {e}")
        return jsonify({"error": str(e)}), 500

@app.errorhandler(413)
def too_large(e):
    """Handle file too large error"""
    return jsonify({
        "error": "Request too large. Please send smaller images.",
        "status": "error"
    }), 413

@app.errorhandler(404)
def not_found(e):
    """Handle 404 errors"""
    return jsonify({
        "error": "Endpoint not found. Available endpoints: /health, /predict, /config",
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
    logger.info("Starting Real-time Autism Detection Backend API...")
    
    # Load model at startup
    if load_autism_model():
        logger.info("Backend ready to accept real-time requests!")
        app.run(host='0.0.0.0', port=5000, debug=True, threaded=True)
    else:
        logger.error("Failed to load model. Exiting...")
        print("ERROR: Could not initialize eye-tracking model. Please check configuration.")
