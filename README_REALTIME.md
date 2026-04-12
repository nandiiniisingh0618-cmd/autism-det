# Real-time Autism Detection Web Application

A complete real-time autism detection system using eye-tracking AI with webcam integration.

## 🏗️ Architecture

```
Frontend (React + Vite)
        │
Webcam (User Video) 
        │
Frame Capture (JS) - Every 2-3 seconds
        │
Send Frames → Backend (Flask API)
        │
Model Prediction (Eye tracking / ASD)
        │
Return Result → Frontend UI Dashboard
```

## 🚀 Features

### Frontend (React)
- ✅ Real-time webcam access using `navigator.mediaDevices.getUserMedia`
- ✅ Live video feed display with overlay UI
- ✅ Automatic frame capture every 2-3 seconds (configurable)
- ✅ Base64 image conversion and API communication
- ✅ Real-time prediction results dashboard
- ✅ Eye-tracking features visualization
- ✅ Status indicators (Detecting, Result, Error)
- ✅ WebSocket alternative for low-latency streaming
- ✅ Loading spinners and error handling
- ✅ Statistics and history tracking

### Backend (Flask)
- ✅ `/predict` POST API for base64 image input
- ✅ Eye-tracking model integration with preprocessing
- ✅ Real-time processing with OpenCV
- ✅ WebSocket server for streaming alternative
- ✅ Model loading (TensorFlow + Mock fallback)
- ✅ Configuration management
- ✅ Error handling and logging

### AI Model Integration
- ✅ Pre-trained eye-tracking model support
- ✅ Image preprocessing (224x224, normalization)
- ✅ Feature extraction (gaze, blink rate, saccadic movements)
- ✅ ASD prediction with confidence scores
- ✅ Mock mode for testing without TensorFlow

## 📁 Project Structure

```
Autism_Detection/
├── backend/
│   ├── app_realtime.py          # Main real-time API server
│   ├── app_websocket.py         # WebSocket alternative server
│   ├── app_simple.py           # Simple fallback server
│   ├── autism_eye_model.h5      # Trained model file
│   └── requirements.txt        # Python dependencies
├── autism-det/                # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   └── RealTimeDashboard.jsx    # Real-time UI dashboard
│   │   ├── services/
│   │   │   ├── frameCaptureService.js   # Frame capture & HTTP API
│   │   │   └── websocketService.js     # WebSocket client
│   │   ├── pages/
│   │   │   ├── Live.tsx               # Main live detection page
│   │   │   └── Results.tsx            # Results display page
│   │   └── ...
│   ├── package.json
│   └── vite.config.ts
└── README_REALTIME.md           # This file
```

## 🛠️ Setup Instructions

### Prerequisites
- Python 3.8+ (3.14 may have TensorFlow compatibility issues)
- Node.js 16+
- npm or yarn
- Webcam with browser permissions

### Backend Setup

1. **Install Python Dependencies**
```bash
cd backend
pip install flask flask-cors opencv-python numpy pillow flask-socketio
```

2. **Install TensorFlow (Optional)**
```bash
# For Python 3.8-3.11
pip install tensorflow==2.13.0

# If TensorFlow unavailable, app will use mock predictions
```

3. **Start Backend Server**
```bash
# Option 1: HTTP API server (Port 5000)
python app_realtime.py

# Option 2: WebSocket server (Port 5001)  
python app_websocket.py

# Option 3: Simple fallback server
python app_simple.py
```

### Frontend Setup

1. **Install Node Dependencies**
```bash
cd autism-det
npm install
```

2. **Start Development Server**
```bash
npm run dev
```

3. **Access Application**
```
Frontend: http://127.0.0.1:3000
Backend API: http://127.0.0.1:5000
WebSocket: ws://127.0.0.1:5001
```

## 🎯 Usage Guide

### Basic Usage (HTTP API)
1. Open http://127.0.0.1:3000
2. Navigate to "Live Detection"
3. Click "Enable Camera Access"
4. Allow browser camera permissions
5. Click "Start Real-time Analysis"
6. Frames captured every 2.5 seconds automatically
7. View real-time results in dashboard

### Advanced Usage (WebSocket)
1. Start WebSocket server: `python app_websocket.py`
2. Enable WebSocket mode in UI settings
3. Lower latency communication for better real-time performance

### Configuration Options
- **Capture Frequency**: 1-10 seconds (default: 2.5s)
- **Confidence Threshold**: 0.0-1.0 (default: 0.5)
- **Model Type**: TensorFlow or Mock mode

## 🧠 Model Integration

### Eye-Tracking Features
The system analyzes these behavioral markers:
- **Gaze Consistency**: Eye contact patterns
- **Blink Rate**: Blinking frequency analysis  
- **Saccadic Movements**: Rapid eye movement patterns
- **Pupil Dilation**: Response to stimuli
- **Attention Span**: Sustained focus measurement

### Prediction Pipeline
1. **Frame Capture**: Webcam → Base64 → Backend
2. **Preprocessing**: Resize (224x224) → Normalize → Batch
3. **Feature Extraction**: Eye detection → Gaze estimation
4. **Model Inference**: CNN/LSTM prediction
5. **Result**: ASD/Non-ASD + Confidence score

## 🚀 Deployment Options

### Local Development
```bash
# Terminal 1: Backend
cd backend && python app_realtime.py

# Terminal 2: Frontend  
cd autism-det && npm run dev
```

### NVIDIA Jetson Orin Nano
1. **Install Dependencies**
```bash
# Install TensorFlow for Jetson
sudo apt install python3-pip
pip3 install tensorflow==2.13.0+nv23.04

# Install other dependencies
pip3 install flask flask-cors opencv-python numpy pillow
```

2. **Configure for Hardware**
```bash
# Enable GPU acceleration
export CUDA_VISIBLE_DEVICES=0

# Start optimized server
python3 app_realtime.py
```

3. **Performance Tuning**
- Use TensorRT for model optimization
- Enable GPU memory growth
- Configure frame rate for hardware capabilities

### Docker Deployment
```dockerfile
# Dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY backend/ .
RUN pip install -r requirements.txt

EXPOSE 5000
CMD ["python", "app_realtime.py"]
```

```bash
# Build and run
docker build -t autism-detection .
docker run -p 5000:5000 autism-detection
```

## 📊 API Endpoints

### HTTP API (Port 5000)
- `GET /health` - Server health check
- `POST /predict` - Image prediction
- `GET /config` - Get configuration
- `POST /config` - Update configuration

### WebSocket Events (Port 5001)
- `connect` - Client connection
- `start_analysis` - Begin real-time analysis
- `frame_data` - Send frame for processing
- `prediction_result` - Receive analysis results
- `disconnect` - Client disconnection

## 🔧 Troubleshooting

### Common Issues

**Camera Access Denied**
- Ensure HTTPS in production (camera requires secure context)
- Check browser permissions
- Try different browser (Chrome recommended)

**TensorFlow Import Error**
- Use Python 3.8-3.11 for TensorFlow compatibility
- Install specific version: `pip install tensorflow==2.13.0`
- Fall back to mock mode for testing

**WebSocket Connection Failed**
- Check firewall settings
- Ensure port 5001 is available
- Verify Socket.IO client library loaded

**High Latency**
- Increase capture frequency in settings
- Use WebSocket server for lower latency
- Optimize image quality settings

### Performance Optimization
- **Frontend**: Use Web Workers for frame processing
- **Backend**: Enable GPU acceleration
- **Network**: Compress images before transmission
- **Model**: Use TensorRT for edge deployment

## 🧪 Testing

### Unit Tests
```bash
# Backend tests
cd backend && python -m pytest

# Frontend tests  
cd autism-det && npm test
```

### Integration Testing
1. Test camera access in different browsers
2. Verify API endpoints with Postman
3. Test WebSocket connection stability
4. Validate model prediction accuracy

## 📈 Performance Metrics

### Expected Performance
- **Frame Processing**: 100-500ms per frame
- **Memory Usage**: 500MB - 2GB (model dependent)
- **CPU Usage**: 20-60% (single core)
- **Network**: 50-200KB per frame (compressed)

### Optimization Targets
- **Latency**: <200ms end-to-end
- **Accuracy**: >90% (model dependent)
- **Throughput**: 2-5 FPS real-time
- **Reliability**: 99%+ uptime

## 🔒 Security Considerations

- **Privacy**: All processing performed locally
- **Data**: No images stored without consent
- **Encryption**: Use HTTPS in production
- **Access**: Implement authentication for deployment
- **CORS**: Configure allowed origins

## 📝 Development Notes

### Code Quality
- Modular service architecture
- TypeScript for frontend type safety
- Comprehensive error handling
- Real-time performance optimization
- Production-ready logging

### Extensibility
- Plugin architecture for new models
- Configurable feature extraction
- Multi-camera support ready
- Cloud deployment compatible

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Implement changes with tests
4. Submit pull request
5. Follow code review process

## 📄 License

This project is for educational and research purposes. Please ensure compliance with:
- Medical device regulations
- Data privacy laws (HIPAA, GDPR)
- Model licensing terms
- Ethical AI guidelines

---

**🚀 Ready for real-time autism detection with eye-tracking AI!**
