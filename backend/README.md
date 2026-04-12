# Autism Detection Backend API

Complete Flask backend system for connecting the trained autism detection model with a React frontend.

## Project Structure

```
backend/
|-- app.py                 # Main Flask application
|-- requirements.txt       # Python dependencies
|-- react-integration.js   # React frontend integration code
|-- autism_eye_model.h5    # Your trained model (place this here)
|-- README.md             # This file
```

## Setup Instructions

### 1. Place Model File
Make sure your `autism_eye_model.h5` file is in the backend folder:
```
backend/autism_eye_model.h5
```

### 2. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 3. Run the Backend Server
```bash
python app.py
```

The server will start on: `http://127.0.0.1:5000`

## API Endpoints

### Health Check
- **GET** `/health`
- Returns server status and model loading status

### Prediction
- **POST** `/predict`
- Accepts image file via form-data
- Returns prediction and confidence

## API Response Format

### Success Response
```json
{
  "prediction": "Autism" | "Non-Autism",
  "confidence": 0.8473,
  "confidence_percentage": 84.73,
  "threshold_used": 0.5,
  "status": "success"
}
```

### Error Response
```json
{
  "error": "Error message",
  "status": "error"
}
```

## Frontend Integration

### Quick Setup (Copy-Paste)

1. **Copy the React integration code** from `react-integration.js` into your React project
2. **Choose one of the components**:
   - `AutismDetectionComponent` - Full-featured with hooks
   - `SimpleAutismDetector` - Basic implementation

### Basic Usage Example

```javascript
import { AutismDetectionComponent } from './react-integration';

function App() {
  return (
    <div>
      <h1>Autism Detection System</h1>
      <AutismDetectionComponent />
    </div>
  );
}
```

### Manual API Call

```javascript
const sendImage = async (file) => {
  const formData = new FormData();
  formData.append('image', file);

  try {
    const response = await fetch('http://127.0.0.1:5000/predict', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    console.log('Prediction:', data.prediction);
    console.log('Confidence:', data.confidence_percentage + '%');
  } catch (error) {
    console.error('Error:', error);
  }
};
```

## Features

### Backend Features
- **Model Loading**: Loads model once at startup for efficiency
- **Image Preprocessing**: Automatic resizing (224x224) and normalization
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **CORS Support**: Enabled for frontend communication
- **File Validation**: Supports common image formats (jpg, png, bmp, etc.)
- **Logging**: Detailed logging for debugging
- **Health Check**: Endpoint to verify server status

### Frontend Features
- **Custom Hook**: `useAutismDetection` for state management
- **Loading States**: Visual feedback during processing
- **Error Handling**: User-friendly error messages
- **Image Preview**: Shows selected image before analysis
- **Multiple Components**: Choose between simple or advanced implementation

## Testing the System

### 1. Test Backend Health
```bash
curl http://127.0.0.1:5000/health
```

### 2. Test Prediction (with curl)
```bash
curl -X POST -F "image=@test_image.jpg" http://127.0.0.1:5000/predict
```

### 3. Test with React Frontend
1. Start the backend: `python app.py`
2. Start your React frontend
3. Upload an image and click "Analyze"

## Common Issues & Solutions

### Model Not Found
**Error**: `Model file not found: autism_eye_model.h5`
**Solution**: Place your `autism_eye_model.h5` file in the backend folder

### CORS Errors
**Error**: `CORS policy: No 'Access-Control-Allow-Origin' header`
**Solution**: The backend already includes CORS support. Make sure the backend is running.

### Invalid Image
**Error**: `Could not decode image`
**Solution**: Ensure you're uploading a valid image file (jpg, png, bmp, etc.)

### Connection Refused
**Error**: `Cannot connect to server`
**Solution**: Make sure the backend is running on `http://127.0.0.1:5000`

## Performance Tips

1. **Model Loading**: Model is loaded once at startup for efficiency
2. **Image Size**: Large images may take longer to process
3. **Memory Usage**: The backend processes one image at a time
4. **Concurrent Requests**: Flask handles multiple requests but processes them sequentially

## Security Considerations

- **File Upload**: Only image files are accepted
- **File Size**: Consider adding file size limits in production
- **Input Validation**: All inputs are validated before processing
- **Error Messages**: Error messages don't expose sensitive system information

## Production Deployment

For production deployment, consider:

1. **WSGI Server**: Use Gunicorn instead of Flask development server
2. **Environment Variables**: Store configuration in environment variables
3. **Logging**: Configure proper logging levels
4. **Rate Limiting**: Add rate limiting to prevent abuse
5. **HTTPS**: Use HTTPS in production

### Production Server Example
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

## How to Explain to Judges

> **"We integrated the trained TensorFlow model with a Flask backend API, enabling real-time autism detection predictions from the frontend. The system processes uploaded images through our deep learning model and returns confidence scores, creating an end-to-end pipeline from image capture to AI-driven diagnosis."**

## Next Level Enhancements

- **Real-time Webcam Integration**: Live video analysis
- **Batch Processing**: Analyze multiple images
- **Model Versioning**: Support multiple model versions
- **Cloud Deployment**: Deploy to AWS/Azure/GCP
- **Edge Computing**: Deploy on Jetson Orin Nano
- **Database Integration**: Store prediction history
- **User Authentication**: Add user accounts and privacy

## Support

If you encounter any issues:
1. Check the backend console logs for error messages
2. Verify the model file is in the correct location
3. Ensure all dependencies are installed correctly
4. Test the health endpoint first: `http://127.0.0.1:5000/health`
