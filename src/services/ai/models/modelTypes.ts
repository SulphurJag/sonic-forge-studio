
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

// Hugging Face model IDs for transformers.js - Working lightweight models
export const HF_MODELS = {
  // Whisper tiny for audio transcription and analysis
  CONTENT_CLASSIFIER: "onnx-community/whisper-tiny.en",
  
  // SpeechT5 for audio processing
  NOISE_SUPPRESSOR: "microsoft/speecht5_tts",
  
  // Audio classification model
  ARTIFACT_DETECTOR: "MIT/ast-finetuned-audioset-10-10-0.4593",
};

// TensorFlow.js model URLs for direct loading
export const TF_MODEL_URLS = {
  // YAMNet for audio classification
  CONTENT_CLASSIFIER: "https://tfhub.dev/google/tfjs-model/yamnet/tfjs/1",
  
  // Simple noise reduction model
  NOISE_REDUCTION: "https://tfhub.dev/google/tfjs-model/rnnoise/1",
};

// Lightweight alternatives that work well in browsers
export const LIGHTWEIGHT_MODELS = {
  // YAMNet for audio event detection
  CONTENT_CLASSIFIER: "https://tfhub.dev/google/tfjs-model/yamnet/tfjs/1",
  
  // Browser-compatible noise reduction
  NOISE_REDUCTION: "https://tfhub.dev/google/tfjs-model/rnnoise/1",
  
  // Simple spectral analyzer for artifacts
  ARTIFACT_DETECTOR: "https://tfhub.dev/google/tfjs-model/spice/2"
};

// Hugging Face Spaces endpoints for fallback processing
export const HF_SPACES_ENDPOINTS = {
  NOISE_SUPPRESSION: "https://huggingface.co/spaces/speechbrain/noise-suppression",
  CONTENT_CLASSIFICATION: "https://huggingface.co/spaces/openai/whisper-jax", 
  ARTIFACT_DETECTION: "https://huggingface.co/spaces/speechbrain/audio-classification"
};

// Processing mode options
export enum ProcessingMode {
  LOCAL_WEBGPU = "local_webgpu",
  LOCAL_LIGHTWEIGHT = "local_lightweight",
  REMOTE_API = "remote_api"
}
