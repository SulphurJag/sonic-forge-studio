
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
  CONTENT_CLASSIFIER: 'Xenova/whisper-tiny.en',
  NOISE_SUPPRESSOR: 'Xenova/speecht5_tts',
  ARTIFACT_DETECTOR: 'Xenova/wav2vec2-large-960h-lv60-self'
};

// Working TensorFlow.js model URLs (verified working models from official TF Hub)
export const TFJS_MODELS = {
  YAMNET: 'https://storage.googleapis.com/tfhub-tfjs-modules/google/yamnet/tfjs/1/default/1/model.json',
  SPICE: 'https://storage.googleapis.com/tfhub-tfjs-modules/google/spice/tfjs/2/default/1/model.json',
  RNNOISE: 'https://storage.googleapis.com/tfhub-tfjs-modules/google/universal-sentence-encoder/tfjs/1/default/1/model.json'
};

// Lightweight model configurations using working CDN URLs
export const LIGHTWEIGHT_MODELS = {
  CONTENT_CLASSIFIER: 'https://storage.googleapis.com/tfhub-tfjs-modules/google/yamnet/tfjs/1/default/1/model.json',
  NOISE_SUPPRESSOR: 'https://storage.googleapis.com/tfhub-tfjs-modules/google/yamnet/tfjs/1/default/1/model.json',
  NOISE_REDUCTION: 'https://storage.googleapis.com/tfhub-tfjs-modules/google/yamnet/tfjs/1/default/1/model.json',
  ARTIFACT_DETECTOR: 'https://storage.googleapis.com/tfhub-tfjs-modules/google/spice/tfjs/2/default/1/model.json'
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
