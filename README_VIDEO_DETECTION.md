# Enhanced Autism Detection Web Application - Video Upload Feature

## Overview

Extended the existing real-time autism detection application to support **both** webcam live detection **and** video upload analysis. The system now provides comprehensive autism detection capabilities with multiple input methods and advanced visualization features.

## Architecture

```
Frontend (React + Vite)
        |
    Mode Toggle (Webcam | Video)
        |
    [Webcam] FrameCaptureService | [Video] VideoProcessor
        |
    Send Frames to Backend API
        |
Backend (Flask)
    /predict (single frame) | /predict-video (batch frames)
        |
Eye-Tracking Model (TensorFlow/Mock)
        |
Aggregated Results + Timeline Visualization
```

## New Features

### 1. **Dual Mode Interface**
- **Webcam Mode**: Real-time detection every 2-3 seconds
- **Video Mode**: Upload and analyze video files
- **Seamless Toggle**: Switch between modes without page reload

### 2. **Video Upload System**
- **File Support**: MP4, WebM, MOV, AVI (max 100MB)
- **Preview Player**: Full video controls with seeking
- **Frame Extraction**: Automatic extraction every 1 second
- **Batch Processing**: Concurrent API calls for performance

### 3. **Advanced Processing**
- **Multiple Aggregation Methods**:
  - Majority Voting (default)
  - Average Confidence
  - Weighted Scoring
- **Concurrent Processing**: Up to 4 parallel API calls
- **Progress Tracking**: Real-time progress updates

### 4. **Enhanced Visualization**
- **Timeline Graph**: Confidence scores over time
- **Frame Highlighting**: ASD-detected frames marked
- **Statistics Dashboard**: Comprehensive analysis metrics
- **Processing Status**: Visual feedback during analysis

## Technical Implementation

### Frontend Components

#### `VideoUpload.jsx`
```jsx
// Video file upload and preview
- File validation (type, size)
- Video player with controls
- Frame extraction using canvas
- Progress tracking UI
```

#### `VideoProcessor.js`
```javascript
// Batch processing service
- Concurrent API calls
- Progress callbacks
- Result aggregation
- Error handling
```

#### `TimelineGraph.jsx`
```jsx
// Timeline visualization
- SVG-based graph rendering
- Confidence score plotting
- ASD detection highlighting
- Statistical summaries
```

#### `ModeToggle.jsx`
```jsx
// Mode switching component
- Visual mode indicators
- Disabled state during processing
- Smooth transitions
```

### Backend Endpoints

#### `/predict-video` (Port 5002)
```python
# Batch video processing
- Accepts multiple frames
- Concurrent frame analysis
- Aggregation logic
- Detailed result breakdown
```

#### `/predict-batch`
```python
# Individual batch processing
- Smaller frame batches
- Parallel processing
- Timeout handling
- Error recovery
```

### Processing Pipeline

1. **Video Upload**:
   - File validation and upload
   - Video preview with controls
   - Frame extraction (1-second intervals)

2. **Frame Processing**:
   - Base64 conversion
   - Batch API calls (10 frames/batch)
   - Concurrent processing (max 4 workers)

3. **Result Aggregation**:
   - Majority voting on predictions
   - Confidence score calculation
   - Timeline data generation

4. **Visualization**:
   - Timeline graph with confidence scores
   - Highlighted ASD detection frames
   - Statistical breakdown

## File Structure

```
Autism_Detection/
|
|-- backend/
|   |-- app_realtime.py          # Webcam API (Port 5000)
|   |-- app_video.py             # Video API (Port 5002)
|   |-- app_websocket.py         # WebSocket API (Port 5001)
|   |-- autism_eye_model.h5      # Trained model
|   |-- requirements.txt
|
|-- autism-det/src/
|   |-- components/
|   |   |-- VideoUpload.jsx      # Video upload component
|   |   |-- VideoProcessor.js    # Processing service
|   |   |-- TimelineGraph.jsx    # Timeline visualization
|   |   |-- ModeToggle.jsx       # Mode switching
|   |   |-- RealTimeDashboard.jsx # Results dashboard
|   |
|   |-- services/
|   |   |-- frameCaptureService.js   # Webcam service
|   |   |-- VideoProcessor.js         # Video processing
|   |   |-- websocketService.js       # WebSocket client
|   |   |-- cameraDebugService.js     # Camera debugging
|   |
|   |-- pages/
|   |   |-- Live.tsx              # Main interface (dual mode)
|   |   |-- LiveDebug.jsx         # Camera debugging
|   |   |-- CameraTest.jsx        # Simple camera test
|   |   |-- Results.tsx           # Results display
|
|-- README_VIDEO_DETECTION.md    # This documentation
```

## Usage Guide

### 1. **Webcam Mode**
1. Visit http://localhost:3001/live
2. Ensure mode toggle shows "Live Detection"
3. Click "Enable Camera Access"
4. Allow browser camera permissions
5. Click "Start Real-time Analysis"
6. View real-time predictions

### 2. **Video Mode**
1. Visit http://localhost:3001/live
2. Switch to "Upload Video" mode
3. Click upload area or drag video file
4. Preview video with controls
5. Click "Extract Frames"
6. Click "Analyze Video"
7. View timeline and results

### 3. **Advanced Features**
- **Timeline Graph**: Shows confidence scores over video duration
- **Frame Highlighting**: ASD-detected frames marked in timeline
- **Statistics**: Detailed breakdown of analysis results
- **Processing Status**: Real-time progress updates

## API Endpoints

### Video Processing API (Port 5002)

#### `POST /predict-video`
```json
Request:
{
  "frames": [
    {
      "timestamp": 0.0,
      "base64": "data:image/jpeg;base64,...",
      "width": 640,
      "height": 480
    }
  ],
  "videoInfo": {
    "fileName": "sample.mp4",
    "duration": 30.0,
    "frameCount": 30
  },
  "aggregation_method": "majority"
}

Response:
{
  "final_prediction": "ASD Detected",
  "confidence": 0.87,
  "confidence_percentage": 87.0,
  "frames_analyzed": 30,
  "breakdown": {
    "asd_detected": 22,
    "no_asd_traits": 8,
    "asd_percentage": 73.3
  },
  "timeline": [...],
  "processing_info": {...}
}
```

#### `POST /predict-batch`
```json
Request:
{
  "frames": [...],
  "batchIndex": 0,
  "totalBatches": 3
}
```

#### `GET /video-stats`
```json
Response:
{
  "processing_stats": {
    "total_frames_processed": 150,
    "total_batches_processed": 15,
    "average_processing_time": 1250.5,
    "active_processes": 0
  },
  "model_loaded": true,
  "thread_pool_size": 4
}
```

## Performance Optimization

### Frontend
- **Concurrent Processing**: Multiple API calls in parallel
- **Frame Sampling**: 1-second intervals to reduce load
- **Progressive Loading**: Show results as they arrive
- **Memory Management**: Canvas cleanup and URL revocation

### Backend
- **Thread Pool**: 4 concurrent workers
- **Batch Processing**: 10 frames per API call
- **Timeout Handling**: 30-second timeout per frame
- **Error Recovery**: Continue processing on individual frame failures

### Model Integration
- **Mock Mode**: Fallback when TensorFlow unavailable
- **Caching**: Model loaded once at startup
- **Preprocessing**: Optimized image resizing
- **Feature Extraction**: Efficient eye-tracking analysis

## Deployment

### Local Development
```bash
# Terminal 1: Webcam API
cd backend && python app_realtime.py

# Terminal 2: Video API  
cd backend && python app_video.py

# Terminal 3: Frontend
cd autism-det && npm run dev
```

### Production Deployment
```bash
# Docker Compose
version: '3.8'
services:
  webcam-api:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - FLASK_ENV=production
      
  video-api:
    build: ./backend
    ports:
      - "5002:5002"
    environment:
      - FLASK_ENV=production
      
  frontend:
    build: ./autism-det
    ports:
      - "3000:3000"
    depends_on:
      - webcam-api
      - video-api
```

### NVIDIA Jetson Orin Nano
```bash
# Install TensorFlow for Jetson
pip3 install tensorflow==2.13.0+nv23.04

# Enable GPU acceleration
export CUDA_VISIBLE_DEVICES=0

# Start optimized servers
python3 app_video.py --gpu-enabled --workers=2
```

## Testing

### Unit Tests
```bash
# Frontend
cd autism-det && npm test

# Backend
cd backend && python -m pytest
```

### Integration Testing
1. Test webcam access across browsers
2. Verify video upload with different formats
3. Test concurrent processing limits
4. Validate aggregation accuracy
5. Check timeline visualization

### Performance Testing
- **Video Processing**: 30 frames in <10 seconds
- **Memory Usage**: <500MB for 2-minute video
- **API Response**: <200ms per frame batch
- **UI Responsiveness**: No blocking during processing

## Troubleshooting

### Common Issues

**Camera Access Denied**
- Check browser permissions
- Use HTTPS in production
- Try different browser

**Video Upload Fails**
- Verify file format (MP4, WebM, MOV, AVI)
- Check file size (<100MB)
- Ensure video is not corrupted

**Processing Slow**
- Reduce video length
- Check backend server status
- Verify network connection

**Timeline Not Showing**
- Ensure video processing completed
- Check for JavaScript errors
- Verify timeline data in response

### Debug Tools
- **Browser Console**: F12 for JavaScript errors
- **Network Tab**: Monitor API calls
- **Backend Logs**: Check Flask server output
- **Camera Debug**: Visit /debug for camera testing

## Future Enhancements

### Planned Features
- **Real-time WebSocket Streaming**: Live video analysis
- **Multi-language Support**: Internationalization
- **Advanced Heatmaps**: Attention visualization
- **Cloud Storage**: Video file management
- **User Accounts**: Analysis history
- **Mobile App**: React Native implementation

### Performance Improvements
- **WebAssembly**: Client-side preprocessing
- **Service Workers**: Background processing
- **CDN Integration**: Faster asset delivery
- **Database**: Results persistence

## Security Considerations

- **Data Privacy**: No video storage without consent
- **HTTPS Required**: Production deployment
- **File Validation**: Type and size checking
- **Rate Limiting**: API abuse prevention
- **CORS Configuration**: Secure cross-origin requests

## License and Compliance

- **Educational Use**: Research and demonstration purposes
- **Medical Device**: Compliance with regulations required
- **Data Protection**: GDPR/HIPAA considerations
- **Model Licensing**: Verify model usage rights

---

## Quick Start

```bash
# Clone and setup
git clone <repository>
cd Autism_Detection

# Setup backend
cd backend
pip install -r requirements.txt
python app_video.py &

# Setup frontend  
cd ../autism-det
npm install
npm run dev

# Access application
open http://localhost:3001/live
```

**Enhanced autism detection now supports both real-time webcam analysis and comprehensive video upload processing!**
