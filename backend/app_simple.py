from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import cv2
import os
import logging
import random

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Global model variable
model = None

def load_autism_model():
    """Load the autism detection model"""
    global model
    try:
        model_path = "autism_eye_model.h5"
        if not os.path.exists(model_path):
            logger.warning(f"Model file not found: {model_path}. Using mock predictions.")
            model = "mock"  # Mock model indicator
            return True
        
        # Try to import tensorflow - if not available, use mock
        try:
            from tensorflow.keras.models import load_model
            logger.info("Loading autism detection model...")
            model = load_model(model_path)
            logger.info("Model loaded successfully!")
            return True
        except ImportError:
            logger.warning("TensorFlow not available. Using mock predictions.")
            model = "mock"
            return True
        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
            model = "mock"
            return True
    except Exception as e:
        logger.error(f"Error in load_autism_model: {str(e)}")
        return False

def preprocess_image(image_bytes):
    """
    Preprocess image for model prediction
    Args:
        image_bytes: Raw image bytes from uploaded file
    Returns:
        Preprocessed image array ready for model prediction
    """
    try:
        # Convert bytes to numpy array
        nparr = np.frombuffer(image_bytes, np.uint8)
        
        # Decode image
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise ValueError("Could not decode image. Please ensure it's a valid image file.")
        
        # Resize to model input size (224x224)
        img = cv2.resize(img, (224, 224))
        
        # Normalize pixel values to [0, 1]
        img = img / 255.0
        
        # Reshape for model input: (1, 224, 224, 3)
        img = np.reshape(img, (1, 224, 224, 3))
        
        return img
    except Exception as e:
        logger.error(f"Error preprocessing image: {str(e)}")
        raise

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint to verify backend is running"""
    return jsonify({
        "status": "healthy",
        "model_loaded": model is not None,
        "model_type": "mock" if model == "mock" else "tensorflow" if model else "none",
        "message": "Autism Detection API is running"
    })

@app.route('/predict', methods=['POST'])
def predict_autism():
    """
    Predict autism from uploaded image
    Expected: FormData with 'image' file field
    Returns: JSON with prediction and confidence
    """
    try:
        # Check if model is loaded
        if model is None:
            return jsonify({
                "error": "Model not loaded. Please check server logs.",
                "status": "error"
            }), 500
        
        # Check if image file is in request
        if 'image' not in request.files:
            return jsonify({
                "error": "No image file provided. Please upload an image.",
                "status": "error"
            }), 400
        
        file = request.files['image']
        
        # Check if file is empty
        if file.filename == '':
            return jsonify({
                "error": "No file selected. Please choose an image file.",
                "status": "error"
            }), 400
        
        # Check file extension (optional validation)
        allowed_extensions = {'jpg', 'jpeg', 'png', 'bmp', 'tiff', 'webp'}
        if not ('.' in file.filename and 
                file.filename.rsplit('.', 1)[1].lower() in allowed_extensions):
            return jsonify({
                "error": "Invalid file type. Please upload an image file (jpg, png, bmp, etc.).",
                "status": "error"
            }), 400
        
        # Read image bytes
        image_bytes = file.read()
        
        # Preprocess image
        processed_image = preprocess_image(image_bytes)
        
        # Make prediction
        logger.info("Making prediction...")
        
        if model == "mock":
            # Generate mock prediction for testing
            prediction = random.random()  # Random value between 0 and 1
            logger.info("Using mock prediction")
        else:
            # Real model prediction
            prediction = model.predict(processed_image)[0][0]
        
        # Convert prediction to percentage confidence
        confidence = float(prediction)
        
        # Determine result based on threshold (0.5)
        result = "Autism" if confidence > 0.5 else "Non-Autism"
        
        # Calculate confidence percentage for display
        confidence_percentage = confidence * 100 if result == "Autism" else (1 - confidence) * 100
        
        logger.info(f"Prediction complete: {result} with {confidence_percentage:.2f}% confidence")
        
        return jsonify({
            "prediction": result,
            "confidence": confidence,
            "confidence_percentage": round(confidence_percentage, 2),
            "threshold_used": 0.5,
            "status": "success",
            "mock_mode": model == "mock"
        })
        
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        return jsonify({
            "error": "An error occurred during prediction. Please try again.",
            "details": str(e),
            "status": "error"
        }), 500

@app.errorhandler(413)
def too_large(e):
    """Handle file too large error"""
    return jsonify({
        "error": "File too large. Please upload a smaller image.",
        "status": "error"
    }), 413

@app.errorhandler(404)
def not_found(e):
    """Handle 404 errors"""
    return jsonify({
        "error": "Endpoint not found. Available endpoints: /health, /predict",
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
    logger.info("Starting Autism Detection Backend API...")
    
    # Load model at startup
    if load_autism_model():
        logger.info("Backend ready to accept requests!")
        app.run(host='0.0.0.0', port=5000, debug=True)
    else:
        logger.error("Failed to load model. Exiting...")
        print("ERROR: Could not initialize backend. Please check the configuration.")
