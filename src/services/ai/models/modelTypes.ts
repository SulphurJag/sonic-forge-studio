// Model configuration types and constants
export enum ProcessingMode {
  LOCAL_WEBGPU = 'local_webgpu',
  LOCAL_LIGHTWEIGHT = 'local_lightweight', 
  LOCAL_CPU = 'local_cpu',
  REMOTE_API = 'remote_api'
}

// Model status interface
export interface ModelStatus {
  initialized: boolean;
  loading: boolean;
  error: string | null;
}

// Hugging Face model identifiers for transformers.js
export const HF_MODELS = {
  CONTENT_CLASSIFIER: 'Xenova/whisper-tiny.en',
  NOISE_REDUCER: 'Xenova/wav2vec2-base-960h', 
  ARTIFACT_DETECTOR: 'Xenova/wav2vec2-base-960h',
  SPEECH_ENHANCEMENT: 'Xenova/wav2vec2-base-960h'
};

// TensorFlow.js model URLs - Updated to use accessible models
export const TFJS_MODELS = {
  YAMNET: 'https://cdn.jsdelivr.net/npm/@tensorflow-models/audio-recognition@1.0.3/dist/model.json',
  SPICE: 'https://cdn.jsdelivr.net/npm/@tensorflow-models/pitch-detection@1.0.1/dist/model.json',
  RNNOISE: 'https://cdn.jsdelivr.net/npm/@tensorflow-models/noise-suppression@1.0.0/dist/model.json',
  NSNET: 'https://cdn.jsdelivr.net/npm/@tensorflow-models/speech-enhancement@1.0.0/dist/model.json'
};

// Lightweight model alternatives
export const LIGHTWEIGHT_MODELS = {
  CONTENT_CLASSIFIER: 'https://cdn.jsdelivr.net/npm/@tensorflow-models/audio-recognition@1.0.3/dist/model.json',
  NOISE_REDUCER: 'https://cdn.jsdelivr.net/npm/@tensorflow-models/noise-suppression@1.0.0/dist/model.json',
  ARTIFACT_DETECTOR: 'https://cdn.jsdelivr.net/npm/@tensorflow-models/audio-recognition@1.0.3/dist/model.json'
};

// Model configuration parameters
export const MODEL_CONFIGS = {
  YAMNET: {
    sampleRate: 16000,
    inputShape: [15600], // ~1 second at 16kHz
    outputClasses: 521
  },
  SPICE: {
    sampleRate: 16000,
    inputShape: [16000], // 1 second
    outputShape: [88] // Piano keys
  },
  WHISPER: {
    sampleRate: 16000,
    chunkLengthS: 30,
    strideLength: 5
  }
};

// Noise reduction strategies
export const NOISE_REDUCTION_STRATEGIES = {
  AUTO: 'auto',
  RNNOISE: 'rnnoise', 
  SPECTRAL: 'spectral',
  NSNET: 'nsnet',
  WIENER: 'wiener',
  HYBRID: 'hybrid'
} as const;

export type NoiseReductionStrategy = typeof NOISE_REDUCTION_STRATEGIES[keyof typeof NOISE_REDUCTION_STRATEGIES];
