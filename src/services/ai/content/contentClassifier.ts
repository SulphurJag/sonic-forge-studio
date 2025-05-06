
import { modelManager, HF_MODELS, LIGHTWEIGHT_MODELS } from '../models';
import { toast } from "@/hooks/use-toast";
import { ContentAnalytics } from './contentAnalytics';
import { ContentTextAnalyzer } from './contentTextAnalyzer';
import { ContentClassification, ProcessingRecommendations, ClassificationOptions } from './contentClassifierTypes';
import * as tf from '@tensorflow/tfjs';

// Main Content Classification Service
export class AIContentClassifier {
  private isInitialized: boolean = false;
  private contentClassifierPipeline: any = null;
  private lightweightModel: any = null;
  private lastClassification: ContentClassification = [];
  private hasGPUSupport: boolean = false;
  private usingSimulation: boolean = false;
  
  // Initialize the content classification model
  async initialize(): Promise<boolean> {
    try {
      // Check if WebGPU is supported
      this.hasGPUSupport = await modelManager.checkWebGPUSupport();
      let modelLoaded = false;
      
      // First try to load the lightweight model (works in most browsers)
      try {
        console.log("Loading lightweight content classification model...");
        this.lightweightModel = await tf.loadGraphModel(LIGHTWEIGHT_MODELS.CONTENT_CLASSIFIER, {
          onProgress: (fraction) => {
            console.log(`Loading YAMNet model: ${Math.round(fraction * 100)}%`);
          }
        });
        
        if (this.lightweightModel) {
          console.log("Lightweight content classification model loaded");
          modelLoaded = true;
        }
      } catch (error) {
        console.warn("Failed to load lightweight content classification model:", error);
      }
      
      // If WebGPU is supported, try loading the HF transformers model as well
      if (this.hasGPUSupport) {
        try {
          console.log("Loading WebGPU-accelerated content classification model...");
          this.contentClassifierPipeline = await modelManager.loadTransformersModel(
            'automatic-speech-recognition', // Using a compatible task
            HF_MODELS.CONTENT_CLASSIFIER,
            'CONTENT_CLASSIFIER'
          );
          
          if (this.contentClassifierPipeline) {
            console.log("WebGPU content classification model loaded successfully");
            modelLoaded = true;
          }
        } catch (transformersError) {
          console.warn("Failed to load WebGPU content classification model:", transformersError);
        }
      }
      
      if (!modelLoaded) {
        console.warn("No content classification models loaded, falling back to simulation mode");
        this.usingSimulation = true;
        toast({
          title: "Limited Functionality",
          description: "Using simulated content classification (no models could be loaded)",
          variant: "default"
        });
      }
      
      // Mark as initialized even if using simulation
      this.isInitialized = true;
      return this.isInitialized;
    } catch (error) {
      console.error("Failed to initialize content classifier:", error);
      toast({
        title: "Initialization Error",
        description: "Failed to initialize audio content classifier model",
        variant: "destructive"
      });
      
      // Fallback to simulated mode
      this.usingSimulation = true;
      this.isInitialized = true;
      console.log("Falling back to simulated content classification");
      
      return this.isInitialized;
    }
  }
  
  // Check if model is ready
  isReady(): boolean {
    return this.isInitialized;
  }
  
  // Check if using simulated processing
  isUsingSimulation(): boolean {
    return this.usingSimulation;
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
      
      // Use the WebGPU transformers pipeline if available
      if (this.contentClassifierPipeline && this.hasGPUSupport && !this.usingSimulation && !options?.useSimulated) {
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
      }
      // Use the lightweight model if available
      else if (this.lightweightModel && !this.usingSimulation && !options?.useSimulated) {
        // YAMNet expects audio at 16kHz
        const targetSampleRate = 16000;
        
        // Resample if needed
        let audioData;
        if (audioBuffer.sampleRate !== targetSampleRate) {
          // Simple resampling - this could be improved
          audioData = this.resampleAudio(audioBuffer, targetSampleRate);
        } else {
          audioData = audioBuffer.getChannelData(0);
        }
        
        // YAMNet analyzes in 0.975s frames, so let's process a few frames
        const frameSize = Math.floor(targetSampleRate * 0.975);
        const framesToProcess = Math.min(10, Math.floor(audioData.length / frameSize));
        
        const classScores = new Map<string, number>();
        
        for (let i = 0; i < framesToProcess; i++) {
          const startIndex = i * frameSize;
          const audioFrame = audioData.slice(startIndex, startIndex + frameSize);
          
          // Prepare input tensor
          const input = tf.tensor(audioFrame).expandDims(0);
          
          // Run model
          const output = this.lightweightModel.predict(input);
          const scores = await output.data();
          
          // Get the top classes
          const yamnetClasses = await this.fetchYamnetClasses();
          const topK = this.getTopKClasses(scores, yamnetClasses, 3);
          
          // Accumulate scores
          topK.forEach(({className, score}) => {
            const currentScore = classScores.get(className) || 0;
            classScores.set(className, currentScore + score);
          });
          
          // Clean up tensors
          tf.dispose([input, output]);
        }
        
        // Convert aggregated scores to classifications
        classifications = Array.from(classScores.entries())
          .map(([className, score]) => this.mapYamnetToContentClass(className))
          .filter((className, index, self) => 
            className !== null && self.indexOf(className) === index
          ) as string[];
        
        if (classifications.length === 0) {
          classifications = ['audio']; // Default classification
        }
      }
      // Use simulated classification based on audio characteristics
      else {
        classifications = ContentAnalytics.analyzeAudioCharacteristics(audioBuffer);
      }
      
      this.lastClassification = classifications;
      return classifications;
    } catch (error) {
      console.error("Error during content classification:", error);
      return ContentAnalytics.analyzeAudioCharacteristics(audioBuffer); // Fallback
    }
  }
  
  // Get processing recommendations based on content type
  getProcessingRecommendations(): ProcessingRecommendations {
    return ContentAnalytics.getProcessingRecommendations(this.lastClassification);
  }
  
  // Helper: Basic audio resampling
  private resampleAudio(audioBuffer: AudioBuffer, targetSampleRate: number): Float32Array {
    const originalSampleRate = audioBuffer.sampleRate;
    const originalData = audioBuffer.getChannelData(0);
    
    // Simplistic resampling approach
    const ratio = originalSampleRate / targetSampleRate;
    const newLength = Math.round(originalData.length / ratio);
    const result = new Float32Array(newLength);
    
    for (let i = 0; i < newLength; i++) {
      const originalIndex = Math.min(Math.round(i * ratio), originalData.length - 1);
      result[i] = originalData[originalIndex];
    }
    
    return result;
  }
  
  // Helper: Get top k classes from YAMNet output
  private getTopKClasses(scores: Float32Array, classes: string[], k: number): Array<{className: string, score: number}> {
    const result = [];
    
    for (let i = 0; i < scores.length; i++) {
      result.push({className: classes[i], score: scores[i]});
    }
    
    return result
      .sort((a, b) => b.score - a.score)
      .slice(0, k);
  }
  
  // Helper: Map YAMNet class to our content classification
  private mapYamnetToContentClass(yamnetClass: string): string | null {
    // Map YAMNet classes to our content types
    const mapping: Record<string, string> = {
      'Music': 'music',
      'Speech': 'speech',
      'Singing': 'music',
      'Guitar': 'music',
      'Drum': 'music',
      'Piano': 'music',
      'Human voice': 'vocals',
      'Keyboard (musical)': 'music',
      'Synthesizer': 'electronic',
      'Male speech': 'speech',
      'Female speech': 'speech',
      'Conversation': 'speech',
      'Hip hop music': 'music',
      'Rock music': 'music',
      'Pop music': 'music',
      'Electronic music': 'electronic',
      'Techno': 'electronic',
      'Drum and bass': 'electronic',
      'House music': 'electronic'
    };
    
    return mapping[yamnetClass] || null;
  }
  
  // Helper: Fetch YAMNet class names (could be cached)
  private async fetchYamnetClasses(): Promise<string[]> {
    // This would normally fetch the class list from a URL or local file
    // For simplicity, returning a small subset of common YAMNet classes
    return [
      'Music', 'Speech', 'Singing', 'Guitar', 'Drum', 'Piano', 
      'Human voice', 'Keyboard (musical)', 'Synthesizer', 
      'Male speech', 'Female speech', 'Conversation',
      'Hip hop music', 'Rock music', 'Pop music', 'Electronic music',
      'Techno', 'Drum and bass', 'House music'
    ];
  }
}
