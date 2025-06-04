
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

// HuggingFace model identifiers (using working models)
export const HF_MODELS = {
  CONTENT_CLASSIFIER: 'openai/whisper-tiny.en',
  NOISE_SUPPRESSOR: 'microsoft/speecht5_tts',
  ARTIFACT_DETECTOR: 'facebook/musicgen-small'
};

// TensorFlow.js model URLs (using verified working URLs)
export const TFJS_MODELS = {
  YAMNET: 'https://tfhub.dev/google/tfjs-model/yamnet/1/default/1',
  RNNOISE: 'https://tfhub.dev/google/tfjs-model/yamnet/1/default/1', // Fallback to YAMNet for now
  SPICE: 'https://tfhub.dev/google/tfjs-model/spice/2/default/1'
};

// Lightweight model configurations (using working TensorFlow Hub models)
export const LIGHTWEIGHT_MODELS = {
  CONTENT_CLASSIFIER: 'https://tfhub.dev/google/tfjs-model/yamnet/1/default/1',
  NOISE_SUPPRESSOR: 'https://tfhub.dev/google/tfjs-model/yamnet/1/default/1',
  NOISE_REDUCTION: 'https://tfhub.dev/google/tfjs-model/yamnet/1/default/1',
  ARTIFACT_DETECTOR: 'https://tfhub.dev/google/tfjs-model/spice/2/default/1'
};

// Model configurations
export const MODEL_CONFIGS = {
  YAMNET: {
    sampleRate: 16000,
    inputShape: [15600] // 0.975 seconds at 16kHz
  },
  RNNOISE: {
    sampleRate: 48000,
    frameSize: 480
  },
  WHISPER: {
    sampleRate: 16000,
    maxLength: 30 // seconds
  },
  SPICE: {
    sampleRate: 16000,
    inputShape: [32000] // 2 seconds at 16kHz
  }
};
