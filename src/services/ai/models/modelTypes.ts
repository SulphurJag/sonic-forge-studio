
// Types for model management

// Status tracking for models
export interface ModelStatus {
  initialized: boolean;
  loading: boolean;
  error: string | null;
}

// Configuration for model paths and Hugging Face model IDs
export const MODEL_PATHS = {
  // Noise Suppression Models
  DTLN_MODEL_1: '/models/noise_suppression/dtln_model_1.onnx',
  DTLN_MODEL_2: '/models/noise_suppression/dtln_model_2.onnx',
  NSNET_MODEL: '/models/noise_suppression/nsnet_48khz.onnx',
  // Content Classification Models
  YAMNET_MODEL: '/models/classification/yamnet.onnx',
  // Artifact Elimination Models
  ARTIFACT_GAN: '/models/artifact_elimination/gan_reconstructor.onnx',
};

// Hugging Face model IDs for using transformers.js
export const HF_MODELS = {
  NOISE_SUPPRESSOR: 'speechbrain/sepformer-whamr-enhancement',
  CONTENT_CLASSIFIER: 'openai/whisper-base',
  ARTIFACT_DETECTOR: 'microsoft/wavlm-base-plus'
};
