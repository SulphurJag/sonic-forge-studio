
import { AIAudioMasteringEngine } from './mastering/engine';

// Create the AI audio processor singleton
export const aiAudioProcessor = new AIAudioMasteringEngine();

// Re-export other components
export * from './models/modelTypes';
export * from './mastering/types';
