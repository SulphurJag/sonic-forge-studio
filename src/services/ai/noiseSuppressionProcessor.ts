
import { modelManager, ProcessingMode } from './models';
import { RealNoiseReductionModel } from './models/realNoiseReductionModel';
import { toast } from "@/hooks/use-toast";
import * as tf from '@tensorflow/tfjs';

// Class for AI-Powered Noise Suppression
export class AINoiseSuppressionProcessor {
  private noiseReductionModel: RealNoiseReductionModel;
  private isInitialized: boolean = false;
  private hasGPUSupport: boolean = false;
  
  constructor() {
    this.noiseReductionModel = new RealNoiseReductionModel();
  }
  
  // Initialize the noise suppression models
  async initialize(): Promise<boolean> {
    try {
      this.hasGPUSupport = await modelManager.checkWebGPUSupport();
      
      const processingMode = modelManager.getPreferredProcessingMode();
      console.log("Initializing noise suppression with mode:", processingMode);
      
      // Initialize the real noise reduction model
      const modelLoaded = await this.noiseReductionModel.loadModel();
      
      this.isInitialized = modelLoaded;
      
      if (this.isInitialized) {
        console.log("Noise suppression processor initialized successfully");
        toast({
          title: "Noise Suppression Ready",
          description: "AI noise reduction is now available",
          variant: "default"
        });
      } else {
        console.warn("Noise suppression processor failed to initialize");
      }
      
      return this.isInitialized;
    } catch (error) {
      console.error("Failed to initialize noise suppression:", error);
      // Still mark as initialized to allow algorithmic processing
      this.isInitialized = true;
      return true;
    }
  }
  
  // Check if models are ready
  isReady(): boolean {
    return this.isInitialized && this.noiseReductionModel.isReady();
  }
  
  // Process audio buffer with noise suppression
  async processBuffer(audioBuffer: AudioBuffer, settings: {
    strategy: 'auto' | 'dtln' | 'spectral' | 'nsnet' | 'hybrid',
    intensity: number,
    preserveTone: boolean
  }): Promise<AudioBuffer | null> {
    if (!this.isInitialized) {
      console.warn("Noise suppression not initialized");
      return null;
    }
    
    try {
      console.log(`Applying noise suppression: ${settings.strategy}, intensity: ${settings.intensity}%`);
      
      // Use the real noise reduction model
      const processedBuffer = await this.noiseReductionModel.processAudio(audioBuffer, {
        strategy: settings.strategy === 'dtln' ? 'rnnoise' : 
                 settings.strategy === 'hybrid' ? 'auto' : settings.strategy,
        intensity: settings.intensity,
        preserveTone: settings.preserveTone
      });
      
      return processedBuffer;
    } catch (error) {
      console.error("Error during noise suppression:", error);
      toast({
        title: "Processing Error",
        description: "Failed to apply noise suppression",
        variant: "destructive"
      });
      return null;
    }
  }
  
  dispose(): void {
    if (this.noiseReductionModel) {
      this.noiseReductionModel.dispose();
    }
    this.isInitialized = false;
  }
}
