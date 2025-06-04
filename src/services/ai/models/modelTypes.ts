
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

// HuggingFace model identifiers
export const HF_MODELS = {
  CONTENT_CLASSIFIER: 'openai/whisper-tiny.en',
  NOISE_SUPPRESSOR: 'speechbrain/sepformer-wham',
  ARTIFACT_DETECTOR: 'facebook/demucs-v4'
};

// TensorFlow.js model URLs (using working URLs)
export const TFJS_MODELS = {
  YAMNET: 'https://tfhub.dev/google/tfjs-model/yamnet/1/default/1',
  RNNOISE: 'https://huggingface.co/ricky0123/rnnoise-onnx/resolve/main/model.onnx',
  SPICE: 'https://huggingface.co/google/spice/resolve/main/model.onnx'
};

// Lightweight model configurations
export const LIGHTWEIGHT_MODELS = {
  CONTENT_CLASSIFIER: 'https://tfhub.dev/google/tfjs-model/yamnet/1/default/1',
  NOISE_SUPPRESSOR: 'https://huggingface.co/ricky0123/rnnoise-onnx/resolve/main/model.onnx',
  NOISE_REDUCTION: 'https://huggingface.co/ricky0123/rnnoise-onnx/resolve/main/model.onnx',
  ARTIFACT_DETECTOR: 'https://huggingface.co/google/spice/resolve/main/model.onnx'
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
  }
};
