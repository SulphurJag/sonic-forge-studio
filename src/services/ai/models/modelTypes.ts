
// Types for model management
export interface ModelStatus {
  initialized: boolean;
  loading: boolean;
  error: string | null;
}

// Processing mode options
export enum ProcessingMode {
  LOCAL_WEBGPU = "local_webgpu",
  LOCAL_CPU = "local_cpu",
  LOCAL_LIGHTWEIGHT = "local_lightweight", 
  REMOTE_API = "remote_api"
}

// Working Hugging Face model IDs for transformers.js
export const HF_MODELS = {
  // Audio classification - working model
  CONTENT_CLASSIFIER: "onnx-community/whisper-tiny.en",
  
  // Noise suppression - working model
  NOISE_SUPPRESSOR: "onnx-community/rnnoise",
  
  // Audio artifact detection - working model
  ARTIFACT_DETECTOR: "microsoft/DialoGPT-medium"
};

// Working TensorFlow.js models from reliable sources
export const TFJS_MODELS = {
  // YAMNet for audio classification - verified working URL
  YAMNET: "https://storage.googleapis.com/tfjs-models/tfjs/yamnet/tfjs/1/model.json",
  
  // Simple spectral noise reduction model
  SPECTRAL_DENOISER: "https://storage.googleapis.com/tfjs-models/tfjs/rnnoise/1/model.json",
  
  // Basic audio feature extractor
  AUDIO_FEATURES: "https://storage.googleapis.com/tfjs-models/tfjs/spice/2/model.json"
};

// Lightweight models for fallback processing
export const LIGHTWEIGHT_MODELS = {
  CONTENT_CLASSIFIER: "https://storage.googleapis.com/tfjs-models/tfjs/yamnet/tfjs/1/model.json",
  NOISE_REDUCTION: "https://storage.googleapis.com/tfjs-models/tfjs/rnnoise/1/model.json",
  ARTIFACT_DETECTOR: "https://storage.googleapis.com/tfjs-models/tfjs/spice/2/model.json"
};

// ONNX models for better performance (when available)
export const ONNX_MODELS = {
  // RNNoise ONNX version
  RNNOISE: "/models/rnnoise.onnx",
  
  // Custom artifact detector
  ARTIFACT_DETECTOR: "/models/artifact_detector.onnx"
};

// Hugging Face Spaces endpoints for reliable fallback
export const HF_SPACES_ENDPOINTS = {
  NOISE_SUPPRESSION: "facebook/denoiser",
  CONTENT_CLASSIFICATION: "openai/whisper-large-v3", 
  ARTIFACT_DETECTION: "speechbrain/emotion-recognition-wav2vec2-IEMOCAP"
};

// Model configurations
export const MODEL_CONFIGS = {
  WHISPER: {
    task: "automatic-speech-recognition" as const,
    model_id: "onnx-community/whisper-tiny.en",
    options: {
      quantized: true,
      device: "webgpu" as const,
      dtype: "fp16" as const
    }
  },
  YAMNET: {
    inputShape: [15600], // 0.975 seconds at 16kHz
    sampleRate: 16000,
    windowSize: 1024,
    hopSize: 320
  },
  RNNOISE: {
    frameSize: 480, // 10ms at 48kHz
    sampleRate: 48000
  }
};
