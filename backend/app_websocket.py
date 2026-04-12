"""
WebSocket-based Real-time Autism Detection Backend
Provides WebSocket alternative for real-time streaming
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit, disconnect
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
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config['SECRET_KEY'] = 'autism_detection_secret_key'
CORS(app, cors_allowed_origins="*")
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# Import eye-tracking model from main app
from app_realtime import EyeTrackingModel, preprocessing_config

# Global variables
eye_tracking_model = None
model_loaded = False
connected_clients = {}
client_stats = {}

def load_autism_model():
    """Load autism detection model"""
    global eye_tracking_model, model_loaded
    
    try:
        eye_tracking_model = EyeTrackingModel()
        model_path = "autism_eye_model.h5"
        
        if eye_tracking_model.load_model(model_path):
            model_loaded = True
            logger.info("Eye-tracking model loaded successfully for WebSocket server")
            return True
        else:
            logger.error("Failed to load eye-tracking model for WebSocket server")
            return False
            
    except Exception as e:
        logger.error(f"Error loading model: {e}")
        return False

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

def process_frame_for_client(client_id, base64_image, timestamp):
    """Process frame for specific client"""
    try:
        if not model_loaded:
            emit('error', {'message': 'Model not loaded'}, room=client_id)
            return
        
        # Update client stats
        if client_id not in client_stats:
            client_stats[client_id] = {
                'frames_processed': 0,
                'total_processing_time': 0,
                'last_prediction': None,
                'connection_time': time.time()
            }
        
        start_time = time.time()
        
        # Decode image
        frame = decode_base64_image(base64_image)
        
        # Run prediction
        result = eye_tracking_model.predict_autism(frame)
        
        processing_time = time.time() - start_time
        
        # Update stats
        client_stats[client_id]['frames_processed'] += 1
        client_stats[client_id]['total_processing_time'] += processing_time
        client_stats[client_id]['last_prediction'] = result
        
        # Add metadata
        result['client_id'] = client_id
        result['timestamp'] = timestamp
        result['processing_time_ms'] = round(processing_time * 1000, 2)
        result['frames_processed'] = client_stats[client_id]['frames_processed']
        result['avg_processing_time'] = round(
            (client_stats[client_id]['total_processing_time'] / client_stats[client_id]['frames_processed']) * 1000, 2
        )
        
        # Send result back to client
        emit('prediction_result', result, room=client_id)
        
        logger.info(f"Processed frame for client {client_id}: {result['prediction']} with {result['confidence_percentage']:.2f}% confidence")
        
    except Exception as e:
        logger.error(f"Error processing frame for client {client_id}: {e}")
        emit('error', {'message': f'Processing error: {str(e)}'}, room=client_id)

# WebSocket event handlers
@socketio.on('connect')
def handle_connect():
    """Handle new client connection"""
    client_id = request.sid
    connected_clients[client_id] = {
        'connected_at': time.time(),
        'status': 'connected'
    }
    
    logger.info(f"Client {client_id} connected")
    
    # Send welcome message
    emit('connected', {
        'client_id': client_id,
        'message': 'Connected to Autism Detection WebSocket',
        'model_loaded': model_loaded,
        'server_time': time.time()
    }, room=client_id)

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    client_id = request.sid
    
    if client_id in connected_clients:
        del connected_clients[client_id]
    
    if client_id in client_stats:
        del client_stats[client_id]
    
    logger.info(f"Client {client_id} disconnected")

@socketio.on('start_analysis')
def handle_start_analysis(data):
    """Handle start analysis request"""
    client_id = request.sid
    
    if not model_loaded:
        emit('error', {'message': 'Model not loaded'}, room=client_id)
        return
    
    connected_clients[client_id]['status'] = 'analyzing'
    connected_clients[client_id]['analysis_started'] = time.time()
    
    emit('analysis_started', {
        'message': 'Real-time analysis started',
        'client_id': client_id
    }, room=client_id)
    
    logger.info(f"Started analysis for client {client_id}")

@socketio.on('stop_analysis')
def handle_stop_analysis():
    """Handle stop analysis request"""
    client_id = request.sid
    
    connected_clients[client_id]['status'] = 'connected'
    
    emit('analysis_stopped', {
        'message': 'Real-time analysis stopped',
        'client_id': client_id
    }, room=client_id)
    
    logger.info(f"Stopped analysis for client {client_id}")

@socketio.on('frame_data')
def handle_frame_data(data):
    """Handle incoming frame data"""
    client_id = request.sid
    
    try:
        base64_image = data.get('image')
        timestamp = data.get('timestamp', time.time())
        
        if not base64_image:
            emit('error', {'message': 'No image data received'}, room=client_id)
            return
        
        # Process frame in separate thread to avoid blocking
        thread = threading.Thread(
            target=process_frame_for_client,
            args=(client_id, base64_image, timestamp)
        )
        thread.daemon = True
        thread.start()
        
    except Exception as e:
        logger.error(f"Error handling frame data for client {client_id}: {e}")
        emit('error', {'message': f'Frame processing error: {str(e)}'}, room=client_id)

@socketio.on('get_config')
def handle_get_config():
    """Handle configuration request"""
    client_id = request.sid
    
    config = {
        'model': {
            'loaded': model_loaded,
            'type': eye_tracking_model.model_type if model_loaded else 'none',
            'threshold': eye_tracking_model.confidence_threshold if model_loaded else 0.5,
            'features': eye_tracking_model.eye_tracking_features if model_loaded else []
        },
        'preprocessing': preprocessing_config,
        'client_stats': client_stats.get(client_id, {}),
        'connected_clients': len(connected_clients)
    }
    
    emit('config', config, room=client_id)

@socketio.on('update_config')
def handle_update_config(data):
    """Handle configuration update"""
    client_id = request.sid
    
    try:
        if 'threshold' in data and eye_tracking_model:
            threshold = float(data['threshold'])
            if 0 <= threshold <= 1:
                eye_tracking_model.confidence_threshold = threshold
                logger.info(f"Updated confidence threshold to {threshold} for client {client_id}")
                
                emit('config_updated', {
                    'threshold': threshold,
                    'message': 'Configuration updated successfully'
                }, room=client_id)
            else:
                emit('error', {'message': 'Threshold must be between 0 and 1'}, room=client_id)
        
    except Exception as e:
        logger.error(f"Error updating config for client {client_id}: {e}")
        emit('error', {'message': f'Config update error: {str(e)}'}, room=client_id)

# HTTP endpoints for WebSocket info
@app.route('/ws_info', methods=['GET'])
def websocket_info():
    """Get WebSocket server information"""
    return jsonify({
        'websocket_url': 'ws://127.0.0.1:5000',
        'endpoints': {
            'connect': 'Automatic on connection',
            'disconnect': 'Automatic on disconnection',
            'start_analysis': 'Start real-time analysis',
            'stop_analysis': 'Stop real-time analysis',
            'frame_data': 'Send frame for analysis',
            'get_config': 'Get current configuration',
            'update_config': 'Update configuration'
        },
        'connected_clients': len(connected_clients),
        'model_loaded': model_loaded
    })

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "websocket_enabled": True,
        "model_loaded": model_loaded,
        "connected_clients": len(connected_clients),
        "message": "WebSocket Autism Detection API is running",
        "timestamp": time.time()
    })

@app.route('/client_stats', methods=['GET'])
def get_client_stats():
    """Get statistics for all connected clients"""
    return jsonify({
        'connected_clients': len(connected_clients),
        'client_details': connected_clients,
        'client_stats': client_stats,
        'server_uptime': time.time() - getattr(app, 'start_time', time.time())
    })

if __name__ == '__main__':
    logger.info("Starting WebSocket-based Autism Detection Backend...")
    
    # Record start time
    app.start_time = time.time()
    
    # Load model at startup
    if load_autism_model():
        logger.info("WebSocket backend ready to accept connections!")
        socketio.run(
            app, 
            host='0.0.0.0', 
            port=5001,  # Different port to avoid conflict
            debug=False,
            allow_unsafe_werkzeug=True
        )
    else:
        logger.error("Failed to load model. Exiting...")
        print("ERROR: Could not initialize eye-tracking model for WebSocket server.")
