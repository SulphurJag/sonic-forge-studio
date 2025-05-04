
import { modelManager, HF_MODELS } from '../modelManager';
import { toast } from "@/hooks/use-toast";
import { ContentAnalytics } from './contentAnalytics';
import { ContentTextAnalyzer } from './contentTextAnalyzer';
import { ContentClassification, ProcessingRecommendations, ClassificationOptions } from './contentClassifierTypes';

// Main Content Classification Service
export class AIContentClassifier {
  private isInitialized: boolean = false;
  private lastClassification: ContentClassification = [];
  private contentClassifierPipeline: any = null;
  private hasGPUSupport: boolean = false;
  
  // Initialize the content classification model
  async initialize(): Promise<boolean> {
    try {
      // Check if WebGPU is supported
      this.hasGPUSupport = await modelManager.checkWebGPUSupport();
      
      if (this.hasGPUSupport) {
        // Load the transformers.js model for audio classification
        this.contentClassifierPipeline = await modelManager.loadTransformersModel(
          'automatic-speech-recognition', // Using a compatible type
          HF_MODELS.CONTENT_CLASSIFIER,
          'CONTENT_CLASSIFIER'
        );
        
        if (this.contentClassifierPipeline) {
          this.isInitialized = true;
          console.log("Content classifier model loaded successfully");
        }
      } else {
        // Use simulated model if WebGPU is not supported
        console.log("WebGPU not supported, using simulated content classification");
        this.isInitialized = true;
      }
      
      return this.isInitialized;
    } catch (error) {
      console.error("Failed to initialize content classifier:", error);
      toast({
        title: "Initialization Error",
        description: "Failed to initialize audio content classifier model",
        variant: "destructive"
      });
      
      // Fallback to simulated mode
      this.isInitialized = true;
      console.log("Falling back to simulated content classification");
      
      return this.isInitialized;
    }
  }
  
  // Check if model is ready
  isReady(): boolean {
    return this.isInitialized;
  }
  
  // Get the last classification result
  getLastClassification(): ContentClassification {
    return this.lastClassification;
  }
  
  // Classify audio content
  async classifyContent(audioBuffer: AudioBuffer, options?: ClassificationOptions): Promise<ContentClassification> {
    if (!this.isInitialized) {
      console.warn("Content classifier not initialized");
      return [];
    }
    
    try {
      let classifications: ContentClassification = [];
      
      // Use the transformers pipeline if available and WebGPU is supported
      if (this.contentClassifierPipeline && this.hasGPUSupport && !options?.useSimulated) {
        // Convert AudioBuffer to Float32Array for processing
        const inputArray = new Float32Array(audioBuffer.getChannelData(0));
        
        // Process with transformers model
        const result = await this.contentClassifierPipeline({
          audio: inputArray,
          sampling_rate: audioBuffer.sampleRate,
        });
        
        if (result && result.text) {
          // Extract content categories based on the transcription
          classifications = ContentTextAnalyzer.extractContentFromText(result.text);
          
          // Add duration-based classification if needed
          if (classifications.length === 1 && classifications[0] === 'audio') {
            classifications = ContentTextAnalyzer.addDurationBasedClassification(
              classifications, 
              audioBuffer.duration
            );
          }
        }
      } else {
        // Use simulated classification based on audio characteristics
        classifications = ContentAnalytics.analyzeAudioCharacteristics(audioBuffer);
      }
      
      this.lastClassification = classifications;
      return classifications;
    } catch (error) {
      console.error("Error during content classification:", error);
      return [];
    }
  }
  
  // Get processing recommendations based on content type
  getProcessingRecommendations(): ProcessingRecommendations {
    return ContentAnalytics.getProcessingRecommendations(this.lastClassification);
  }
}
