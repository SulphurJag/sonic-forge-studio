
import { AINoiseSuppressionProcessor } from '../noiseSuppressionProcessor';
import { AIContentClassifier } from '../content/contentClassifier';
import { AIArtifactEliminator } from '../artifactEliminator';
import { initializeAIEngine, getInitializationStatus } from './initializeEngine';
import { processAudioWithAI } from './processAudio';
import { AIAudioProcessingSettings, AIAudioProcessingResult, AIInitializationStatus } from './types';
import { ProcessingMode, modelManager } from '../models';

// Main AI Audio Processing Engine that combines all components
export class AIAudioMasteringEngine {
  private noiseProcessor: AINoiseSuppressionProcessor;
  private contentClassifier: AIContentClassifier;
  private artifactEliminator: AIArtifactEliminator;
  private isInitialized: boolean = false;
  private isInitializing: boolean = false;
  private hasGPUSupport: boolean = false;
  private processingMode: ProcessingMode = ProcessingMode.REMOTE_API;
  
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
    
    if (this.isInitializing) {
      // Wait for existing initialization to complete
      let attempts = 0;
      while (this.isInitializing && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      return this.isInitialized;
    }
    
    this.isInitializing = true;
    
    try {
      const result = await initializeAIEngine(
        this.noiseProcessor,
        this.contentClassifier,
        this.artifactEliminator,
        this.isInitializing
      );
      
      this.isInitialized = result.isInitialized;
      this.hasGPUSupport = result.hasGPUSupport;
      this.processingMode = result.processingMode;
      this.isInitializing = false;
      
      return this.isInitialized;
    } catch (error) {
      console.error('AI engine initialization failed:', error);
      this.isInitializing = false;
      // Always fall back to remote API mode
      this.processingMode = ProcessingMode.REMOTE_API;
      this.isInitialized = true; // Consider remote API as "initialized"
      return true;
    }
  }
  
  // Check if the engine is ready for processing
  isReady(): boolean {
    return this.isInitialized;
  }
  
  // Get the current processing mode
  getProcessingMode(): ProcessingMode {
    return this.processingMode;
  }
  
  // Set the processing mode explicitly
  setProcessingMode(mode: ProcessingMode): void {
    this.processingMode = mode;
    modelManager.setProcessingMode(mode);
  }
  
  // Check initialization status of each component
  getInitializationStatus(): AIInitializationStatus {
    return getInitializationStatus(
      this.noiseProcessor,
      this.contentClassifier,
      this.artifactEliminator,
      this.isInitialized,
      this.hasGPUSupport,
      this.processingMode
    );
  }
  
  // Process audio with all AI components
  async processAudio(
    audioBuffer: AudioBuffer,
    settings: AIAudioProcessingSettings
  ): Promise<AIAudioProcessingResult> {
    // Ensure initialization
    if (!this.isInitialized) {
      console.log('AI engine not initialized, attempting to initialize...');
      const initialized = await this.initialize();
      if (!initialized) {
        console.warn('AI engine initialization failed, returning original buffer');
        return {
          processedBuffer: audioBuffer,
          contentType: [],
          artifactsFound: false
        };
      }
    }
    
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
  
  // Dispose of resources
  dispose(): void {
    this.isInitialized = false;
    this.isInitializing = false;
    
    // Dispose model manager resources
    modelManager.dispose();
    
    console.log("AI Audio Mastering Engine disposed");
  }
}
