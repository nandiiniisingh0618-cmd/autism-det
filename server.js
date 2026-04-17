import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import { config } from 'dotenv';

config();

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * POST /predict
 * Accepts a base64-encoded image and returns an autism behavioral analysis.
 */
app.post('/predict', async (req, res) => {
  console.log(`[${new Date().toLocaleTimeString()}] Incoming analysis request...`);
  try {
    const { image, timestamp } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    // Strip the data URL prefix if present (e.g., "data:image/jpeg;base64,")
    const base64Data = image.includes(',') ? image.split(',')[1] : image;

    const prompt = `You are an autism behavioral analysis AI. Analyze this webcam frame for behavioral markers associated with autism spectrum disorder (ASD).

Analyze the following visual cues if visible:
- Eye contact and gaze direction
- Facial expressions and emotional responsiveness
- Body posture and motor patterns
- Repetitive behaviors or movements
- Social engagement indicators

Respond ONLY with a valid JSON object in this exact format (no markdown, no code blocks):
{
  "prediction": "ASD Detected" or "No ASD Traits",
  "confidence": 0.0 to 1.0,
  "confidence_percentage": 0 to 100,
  "processing_time_ms": response time in ms,
  "features": {
    "eye_contact": "description of eye contact observed",
    "facial_expression": "description of facial expression",
    "body_posture": "description of posture",
    "behavioral_notes": "any notable behavioral observations"
  },
  "analysis_summary": "brief 1-2 sentence summary of findings"
}

Be conservative and note that this is a screening tool only, not a clinical diagnosis. If the image is blurry, dark, or the face is not clearly visible, set confidence below 0.5 and note that in behavioral_notes.`;

    const startTime = Date.now();

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: base64Data,
              },
            },
            { text: prompt },
          ],
        },
      ],
    });

    const processingTime = Date.now() - startTime;
    const rawText = response.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Clean up any potential markdown wrapping
    const cleanedText = rawText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    let result;
    try {
      result = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Failed to parse Gemini response as JSON:', rawText);
      // Fallback: return a safe default with the raw text for debugging
      result = {
        prediction: 'No ASD Traits',
        confidence: 0.5,
        confidence_percentage: 50,
        features: {
          eye_contact: 'Unable to analyze',
          facial_expression: 'Unable to analyze',
          body_posture: 'Unable to analyze',
          behavioral_notes: 'Analysis parsing failed — please ensure face is clearly visible',
        },
        analysis_summary: 'Could not parse AI response. Please ensure good lighting and face visibility.',
      };
    }

    result.processing_time_ms = processingTime;
    result.timestamp = timestamp || Date.now();

    console.log(`[${new Date().toLocaleTimeString()}] Analysis result: ${result.prediction} (${result.confidence_percentage}%) - ${processingTime}ms`);

    return res.json(result);

  } catch (error) {
    console.error('Prediction error:', error);
    
    // Specifically handle rate limit errors
    if (error.status === 429 || error.message?.includes('429')) {
      return res.status(429).json({
        error: 'System Busy',
        details: 'API Rate limit hit. Slowing down analysis frequency...',
      });
    }

    return res.status(500).json({
      error: 'Prediction failed',
      details: error.message,
    });
  }
});

/**
 * GET /health
 * Health check endpoint.
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', model: 'gemini-2.0-flash', port: PORT });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🧠 Autism Detection API running at http://0.0.0.0:${PORT}`);
  console.log(`📊 GET  /health  — server status`);
  console.log(`🎥 POST /predict — analyze a webcam frame\n`);
});
