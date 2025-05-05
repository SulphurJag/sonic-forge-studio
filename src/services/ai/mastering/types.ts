
// Types for AI Audio Mastering

// Settings for audio processing
export interface AIAudioProcessingSettings {
  enableNoiseReduction: boolean;
  noiseReductionStrategy: 'auto' | 'dtln' | 'spectral' | 'nsnet' | 'hybrid';
  noiseReductionIntensity: number;
  enableContentClassification: boolean;
  enableAutoProcessing: boolean;
  enableArtifactElimination: boolean;
  preserveTone: boolean;
}

// Results from audio processing
export interface AIAudioProcessingResult {
  processedBuffer: AudioBuffer | null;
  contentType: string[];
  artifactsFound: boolean;
}

// Status of AI components
export interface AIInitializationStatus {
  noiseProcessor: boolean;
  contentClassifier: boolean;
  artifactEliminator: boolean;
  overall: boolean;
  hasWebGPU: boolean;
}
