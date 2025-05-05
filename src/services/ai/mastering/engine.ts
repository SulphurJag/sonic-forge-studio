
import { AINoiseSuppressionProcessor } from '../noiseSuppressionProcessor';
import { AIContentClassifier } from '../content/contentClassifier';
import { AIArtifactEliminator } from '../artifactEliminator';
import { initializeAIEngine, getInitializationStatus } from './initializeEngine';
import { processAudioWithAI } from './processAudio';
import { AIAudioProcessingSettings, AIAudioProcessingResult, AIInitializationStatus } from './types';

// Main AI Audio Processing Engine that combines all components
export class AIAudioMasteringEngine {
  private noiseProcessor: AINoiseSuppressionProcessor;
  private contentClassifier: AIContentClassifier;
  private artifactEliminator: AIArtifactEliminator;
  private isInitialized: boolean = false;
  private isInitializing: boolean = false;
  private hasGPUSupport: boolean = false;
  
  constructor() {
    this.noiseProcessor = new AINoiseSuppressionProcessor();
    this.contentClassifier = new AIContentClassifier();
    this.artifactEliminator = new AIArtifactEliminator();
  }
  
  // Initialize all AI components
  async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }
    
    const result = await initializeAIEngine(
      this.noiseProcessor,
      this.contentClassifier,
      this.artifactEliminator,
      this.isInitializing
    );
    
    this.isInitialized = result.isInitialized;
    this.hasGPUSupport = result.hasGPUSupport;
    this.isInitializing = result.isInitializing;
    
    return this.isInitialized;
  }
  
  // Check if the engine is ready for processing
  isReady(): boolean {
    return this.isInitialized;
  }
  
  // Check initialization status of each component
  getInitializationStatus(): AIInitializationStatus {
    return getInitializationStatus(
      this.noiseProcessor,
      this.contentClassifier,
      this.artifactEliminator,
      this.isInitialized,
      this.hasGPUSupport
    );
  }
  
  // Process audio with all AI components
  async processAudio(
    audioBuffer: AudioBuffer,
    settings: AIAudioProcessingSettings
  ): Promise<AIAudioProcessingResult> {
    return processAudioWithAI(
      audioBuffer,
      settings,
      this.noiseProcessor,
      this.contentClassifier,
      this.artifactEliminator,
      this.isInitialized,
      () => this.initialize()
    );
  }
}
