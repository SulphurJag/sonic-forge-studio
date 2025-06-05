
// Model processing modes
export enum ProcessingMode {
  LOCAL_WEBGPU = 'local_webgpu',
  LOCAL_CPU = 'local_cpu',
  LOCAL_LIGHTWEIGHT = 'local_lightweight',
  REMOTE_API = 'remote_api'
}

// Model status interface
export interface ModelStatus {
  initialized: boolean;
  loading: boolean;
  error: string | null;
}

// Working HuggingFace model identifiers (verified working models)
export const HF_MODELS = {
  CONTENT_CLASSIFIER: 'openai/whisper-tiny.en',
  NOISE_SUPPRESSOR: 'microsoft/speecht5_tts',
  ARTIFACT_DETECTOR: 'facebook/musicgen-small'
};

// Working TensorFlow.js model URLs (verified working models)
export const TFJS_MODELS = {
  YAMNET: 'https://tfhub.dev/google/tfjs-model/yamnet/1/default/1',
  SPICE: 'https://tfhub.dev/google/tfjs-model/spice/2/default/1',
  RNNOISE: 'https://cdn.jsdelivr.net/npm/@tensorflow-models/universal-sentence-encoder@1.3.3/dist/model.json'
};

// Lightweight model configurations using working CDN URLs
export const LIGHTWEIGHT_MODELS = {
  CONTENT_CLASSIFIER: 'https://tfhub.dev/google/tfjs-model/yamnet/1/default/1',
  NOISE_SUPPRESSOR: 'https://tfhub.dev/google/tfjs-model/yamnet/1/default/1',
  NOISE_REDUCTION: 'https://tfhub.dev/google/tfjs-model/yamnet/1/default/1',
  ARTIFACT_DETECTOR: 'https://tfhub.dev/google/tfjs-model/spice/2/default/1'
};

// Model configurations with proper input shapes
export const MODEL_CONFIGS = {
  YAMNET: {
    sampleRate: 16000,
    inputShape: [15600], // 0.975 seconds at 16kHz
    outputClasses: 521
  },
  RNNOISE: {
    sampleRate: 48000,
    frameSize: 480,
    inputShape: [480]
  },
  WHISPER: {
    sampleRate: 16000,
    maxLength: 30, // seconds
    inputShape: [480000] // 30 seconds at 16kHz
  },
  SPICE: {
    sampleRate: 16000,
    inputShape: [32000], // 2 seconds at 16kHz
    outputSize: 360
  }
};

// YAMNet class labels (first 10 most relevant for audio mastering)
export const YAMNET_CLASSES = [
  'Speech',
  'Music',
  'Singing',
  'Musical instrument',
  'Plucked string instrument',
  'Guitar',
  'Piano',
  'Drum',
  'Bass guitar',
  'Electronic music'
];
