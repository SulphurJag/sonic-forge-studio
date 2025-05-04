
import { AIAudioMasteringEngine } from './aiAudioMasteringEngine';

// Export the main processor instance as a singleton
export const aiAudioProcessor = new AIAudioMasteringEngine();

// Export all classes for individual use if needed
export * from './modelManager';
export * from './noiseSuppressionProcessor';
export * from './content';
export * from './artifactEliminator';
export * from './aiAudioMasteringEngine';
