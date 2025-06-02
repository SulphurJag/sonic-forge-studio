
// Types for model management
export interface ModelStatus {
  initialized: boolean;
  loading: boolean;
  error: string | null;
}

// Paths for local models (using relative paths to public directory)
export const MODEL_PATHS = {
  NOISE_REDUCTION_ONNX: "/models/noise-reduction/rnnoise_model.onnx",
  ARTIFACT_DETECTOR_ONNX: "/models/artifact-detection/artifact_detector.onnx",
  CONTENT_CLASSIFIER_TF: "/models/content-classification/yamnet_model.json",
};

// Hugging Face model IDs for transformers.js - Updated with better open-source models
export const HF_MODELS = {
  // Noise suppression - Facebook's Denoiser model (open-source, MIT license)
  NOISE_SUPPRESSOR: "facebook/denoiser-dns64",
  
  // Content classification - OpenAI Whisper Tiny (Apache 2.0 license)
  CONTENT_CLASSIFIER: "openai/whisper-tiny.en",
  
  // Artifact detector - Microsoft's UniSpeech model (MIT license)
  ARTIFACT_DETECTOR: "microsoft/unispeech-sat-base-plus",
};

// TensorFlow.js model URLs for direct loading - Updated with open-source models
export const TF_MODEL_URLS = {
  // Google's RNNoise for noise reduction (BSD license)
  NOISE_REDUCTION: "https://tfhub.dev/google/tfjs-model/rnnoise/1",
  
  // YAMNet for audio event detection (Apache 2.0 license)
  ARTIFACT_DETECTOR: "https://tfhub.dev/google/tfjs-model/yamnet/tfjs/1",
};

// Lightweight alternatives that can run efficiently in browser
export const LIGHTWEIGHT_MODELS = {
  // RNNoise - proven open-source noise reduction (BSD license)
  NOISE_REDUCTION: "https://tfhub.dev/google/tfjs-model/rnnoise/1",
  
  // YAMNet - Google's audio event detection model (Apache 2.0 license)
  CONTENT_CLASSIFIER: "https://tfhub.dev/google/tfjs-model/yamnet/tfjs/1",
  
  // Simple spectral analyzer for artifact detection
  ARTIFACT_DETECTOR: "https://tfhub.dev/google/tfjs-model/spice/2"
};

// Hugging Face Spaces endpoints - Updated to use open-source model endpoints
export const HF_SPACES_ENDPOINTS = {
  NOISE_SUPPRESSION: "https://huggingface.co/spaces/facebook/denoiser",
  CONTENT_CLASSIFICATION: "https://huggingface.co/spaces/openai/whisper-jax", 
  ARTIFACT_DETECTION: "https://huggingface.co/spaces/speechbrain/audio-classification"
};

// Processing mode options
export enum ProcessingMode {
  LOCAL_WEBGPU = "local_webgpu",
  LOCAL_LIGHTWEIGHT = "local_lightweight",
  REMOTE_API = "remote_api"
}
