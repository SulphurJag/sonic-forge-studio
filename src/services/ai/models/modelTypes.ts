
// Types for model management
export interface ModelStatus {
  initialized: boolean;
  loading: boolean;
  error: string | null;
}

// Paths for local models (using relative paths to public directory)
export const MODEL_PATHS = {
  NOISE_REDUCTION_ONNX: "/models/noise-reduction/noise_suppression_model.onnx",
  ARTIFACT_DETECTOR_ONNX: "/models/artifact-detection/artifact_detector.onnx",
  CONTENT_CLASSIFIER_TF: "/models/content-classification/model.json",
};

// Hugging Face model IDs for transformers.js
export const HF_MODELS = {
  // Noise suppression - smaller alternative to SepFormer
  NOISE_SUPPRESSOR: "speechbrain/mtl-mimic-voicebank",
  
  // Content classification - tiny whisper model for audio understanding
  CONTENT_CLASSIFIER: "openai/whisper-tiny",
  
  // Artifact detector - small model for audio quality analysis
  ARTIFACT_DETECTOR: "microsoft/unispeech-sat-base",
};

// TensorFlow.js model URLs for direct loading
export const TF_MODEL_URLS = {
  NOISE_REDUCTION: "https://tfhub.dev/google/tfjs-model/speech-commands/18w/tfjs/2",
  ARTIFACT_DETECTOR: "https://tfhub.dev/google/tfjs-model/yamnet/tfjs/1",
};

// Lightweight alternatives that can run efficiently in browser
export const LIGHTWEIGHT_MODELS = {
  // For noise reduction - RNNoise-based model
  NOISE_REDUCTION: "https://cdn.jsdelivr.net/npm/@tensorfow/tfjs-models@3.0.0/dist/denoiser/model.json",
  
  // For content classification - Yamnet (audio event detection)
  CONTENT_CLASSIFIER: "https://tfhub.dev/google/tfjs-model/yamnet/tfjs/1",
  
  // For artifact detection - simple spectrogram analyzer
  ARTIFACT_DETECTOR: "https://cdn.jsdelivr.net/npm/audio-fft@1.0.3/dist/model.json"
};
