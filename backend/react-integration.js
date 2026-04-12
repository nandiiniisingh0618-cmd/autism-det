// React Frontend Integration Code for Autism Detection
// Copy this code into your React components

import React, { useState } from 'react';

// API Configuration
const API_BASE_URL = 'http://127.0.0.1:5000';

/**
 * Autism Detection Service
 * Handles all API calls to the backend
 */
class AutismDetectionService {
  /**
   * Send image to backend for prediction
   * @param {File} imageFile - The image file to analyze
   * @returns {Promise<Object>} - Prediction result
   */
  static async predictAutism(imageFile) {
    const formData = new FormData();
    formData.append('image', imageFile);

    try {
      const response = await fetch(`${API_BASE_URL}/predict`, {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header - let browser set it with boundary
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Prediction error:', error);
      throw error;
    }
  }

  /**
   * Check if backend is healthy
   * @returns {Promise<Object>} - Health status
   */
  static async checkHealth() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Health check error:', error);
      throw error;
    }
  }
}

/**
 * React Hook for Autism Detection
 * Custom hook to manage prediction state and logic
 */
export const useAutismDetection = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const resetState = () => {
    setResult(null);
    setError(null);
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
      resetState();
    }
  };

  const predict = async () => {
    if (!selectedImage) {
      setError('Please select an image first');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const predictionResult = await AutismDetectionService.predictAutism(selectedImage);
      setResult(predictionResult);
    } catch (err) {
      setError(err.message || 'Failed to analyze image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    result,
    error,
    selectedImage,
    imagePreview,
    handleImageSelect,
    predict,
    resetState
  };
};

/**
 * Example React Component using the hook
 */
export const AutismDetectionComponent = () => {
  const {
    isLoading,
    result,
    error,
    imagePreview,
    handleImageSelect,
    predict,
    resetState
  } = useAutismDetection();

  return (
    <div className="autism-detection-container">
      <h2>Autism Detection System</h2>
      
      {/* Image Upload Section */}
      <div className="upload-section">
        <input
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          disabled={isLoading}
          className="file-input"
        />
        
        {imagePreview && (
          <div className="image-preview">
            <img src={imagePreview} alt="Selected for analysis" style={{ maxWidth: '300px' }} />
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        <button
          onClick={predict}
          disabled={!imagePreview || isLoading}
          className="predict-button"
        >
          {isLoading ? 'Analyzing...' : 'Analyze Image'}
        </button>
        
        <button
          onClick={resetState}
          className="reset-button"
        >
          Reset
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="loading">
          <p>Analyzing image... This may take a few seconds.</p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="error-message">
          <p>Error: {error}</p>
        </div>
      )}

      {/* Results Display */}
      {result && (
        <div className="results">
          <h3>Analysis Results</h3>
          <div className="result-item">
            <strong>Prediction:</strong> {result.prediction}
          </div>
          <div className="result-item">
            <strong>Confidence:</strong> {result.confidence_percentage}%
          </div>
          <div className="result-item">
            <strong>Status:</strong> {result.status}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Alternative Simple Component (if you don't want to use hooks)
 */
export const SimpleAutismDetector = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setResult(null);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('http://127.0.0.1:5000/predict', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Prediction failed');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Autism Detection</h2>
      <form onSubmit={handleSubmit}>
        <input type="file" accept="image/*" onChange={handleFileChange} required />
        <button type="submit" disabled={loading || !file}>
          {loading ? 'Analyzing...' : 'Predict'}
        </button>
      </form>

      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {result && (
        <div>
          <h3>Result:</h3>
          <p><strong>Prediction:</strong> {result.prediction}</p>
          <p><strong>Confidence:</strong> {result.confidence_percentage}%</p>
        </div>
      )}
    </div>
  );
};

// Export the service for use in other components
export default AutismDetectionService;
