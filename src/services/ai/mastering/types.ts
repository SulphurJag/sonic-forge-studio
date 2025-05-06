
import { ProcessingMode } from "../models/modelTypes";

// Types for AI audio processing

// Settings for AI audio processing
export interface AIAudioProcessingSettings {
  enableNoiseReduction: boolean;
  noiseReductionStrategy: 'auto' | 'dtln' | 'spectral' | 'nsnet' | 'hybrid';
  noiseReductionIntensity: number;
  preserveTone: boolean;
  enableContentClassification: boolean;
  enableAutoProcessing: boolean;
  enableArtifactElimination: boolean;
  processingMode?: ProcessingMode;
}

// Result of AI audio processing
export interface AIAudioProcessingResult {
  processedBuffer: AudioBuffer;
  contentType: string[];
  artifactsFound: boolean;
}

// Status of AI component initialization
export interface AIInitializationStatus {
  noiseProcessor: boolean;
  contentClassifier: boolean;
  artifactEliminator: boolean;
  overall: boolean;
  hasWebGPU: boolean;
  processingMode?: ProcessingMode;
}
