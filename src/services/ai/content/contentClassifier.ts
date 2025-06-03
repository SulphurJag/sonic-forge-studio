
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
  private yamnetModel: any = null;
  private lastClassification: ContentClassification = [];
  private hasGPUSupport: boolean = false;
  private usingSimulation: boolean = false;
  
  // Initialize the content classification model
  async initialize(): Promise<boolean> {
    try {
      // Check if WebGPU is supported
      this.hasGPUSupport = await modelManager.checkWebGPUSupport();
      let modelLoaded = false;
      
      // Try loading HF transformers model first (Whisper for audio analysis)
      try {
        console.log("Loading Whisper model for content classification...");
        this.contentClassifierPipeline = await modelManager.loadTransformersModel(
          'automatic-speech-recognition',
          HF_MODELS.CONTENT_CLASSIFIER,
          'CONTENT_CLASSIFIER'
        );
        
        if (this.contentClassifierPipeline) {
          console.log("Whisper content classification model loaded successfully");
          modelLoaded = true;
        }
      } catch (transformersError) {
        console.warn("Failed to load Whisper model:", transformersError);
      }
      
      // Try loading YAMNet as fallback
      if (!modelLoaded) {
        try {
          console.log("Loading YAMNet model for content classification...");
          this.yamnetModel = await tf.loadGraphModel(LIGHTWEIGHT_MODELS.CONTENT_CLASSIFIER);
          
          if (this.yamnetModel) {
            console.log("YAMNet content classification model loaded successfully");
            modelLoaded = true;
          }
        } catch (yamnetError) {
          console.warn("Failed to load YAMNet model:", yamnetError);
        }
      }
      
      if (!modelLoaded) {
        console.warn("No content classification models loaded, using analysis-based classification");
        this.usingSimulation = false; // We'll use audio analysis instead
        toast({
          title: "Limited Model Loading",
          description: "Using audio analysis for content classification",
          variant: "default"
        });
      }
      
      this.isInitialized = true;
      return this.isInitialized;
    } catch (error) {
      console.error("Failed to initialize content classifier:", error);
      this.usingSimulation = false;
      this.isInitialized = true;
      console.log("Using audio analysis for content classification");
      return this.isInitialized;
    }
  }
  
  // Check if model is ready
  isReady(): boolean {
    return this.isInitialized;
  }
  
  // Check if using simulation
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
      
      // Use Whisper pipeline if available
      if (this.contentClassifierPipeline && !options?.useSimulated) {
        console.log("Using Whisper for content classification");
        
        // Convert AudioBuffer to Float32Array
        const audioData = audioBuffer.getChannelData(0);
        
        // Process with Whisper
        const result = await this.contentClassifierPipeline(audioData, {
          sampling_rate: audioBuffer.sampleRate,
          return_timestamps: false,
          chunk_length_s: 30,
          stride_length_s: 5
        });
        
        if (result && result.text) {
          console.log("Whisper transcription:", result.text);
          
          // Analyze transcription to determine content type
          classifications = ContentTextAnalyzer.extractContentFromText(result.text);
          
          // Add audio characteristics analysis
          const audioCharacteristics = ContentAnalytics.analyzeAudioCharacteristics(audioBuffer);
          classifications = [...new Set([...classifications, ...audioCharacteristics])];
        }
      }
      // Use YAMNet if available
      else if (this.yamnetModel && !options?.useSimulated) {
        console.log("Using YAMNet for content classification");
        
        // YAMNet expects 16kHz audio
        const targetSampleRate = 16000;
        let audioData = audioBuffer.getChannelData(0);
        
        // Resample if needed
        if (audioBuffer.sampleRate !== targetSampleRate) {
          audioData = this.resampleAudio(audioData, audioBuffer.sampleRate, targetSampleRate);
        }
        
        // Process with YAMNet
        const waveformTensor = tf.tensor1d(audioData).expandDims(0);
        const predictions = this.yamnetModel.predict(waveformTensor) as tf.Tensor;
        const scores = await predictions.data();
        
        // Get YAMNet class labels and find top predictions
        const yamnetClasses = await this.getYamnetClasses();
        // Convert scores to Float32Array to match expected type
        const scoresArray = scores instanceof Float32Array ? scores : new Float32Array(scores);
        const topPredictions = this.getTopKClasses(scoresArray, yamnetClasses, 5);
        
        // Map YAMNet classes to our content types
        classifications = topPredictions
          .map(pred => this.mapYamnetToContentClass(pred.className))
          .filter((className): className is string => className !== null);
        
        // Clean up tensors
        tf.dispose([waveformTensor, predictions]);
      }
      
      // Use audio analysis as fallback or if no models loaded
      if (classifications.length === 0) {
        console.log("Using audio characteristics analysis");
        classifications = ContentAnalytics.analyzeAudioCharacteristics(audioBuffer);
      }
      
      // Ensure we have at least one classification
      if (classifications.length === 0) {
        classifications = ['audio'];
      }
      
      this.lastClassification = classifications;
      console.log("Final content classification:", classifications);
      return classifications;
    } catch (error) {
      console.error("Error during content classification:", error);
      const fallback = ContentAnalytics.analyzeAudioCharacteristics(audioBuffer);
      this.lastClassification = fallback;
      return fallback;
    }
  }
  
  // Get processing recommendations based on content type
  getProcessingRecommendations(): ProcessingRecommendations {
    return ContentAnalytics.getProcessingRecommendations(this.lastClassification);
  }
  
  // Helper: Resample audio data
  private resampleAudio(audioData: Float32Array, originalSampleRate: number, targetSampleRate: number): Float32Array {
    const ratio = originalSampleRate / targetSampleRate;
    const newLength = Math.round(audioData.length / ratio);
    const result = new Float32Array(newLength);
    
    for (let i = 0; i < newLength; i++) {
      const originalIndex = Math.min(Math.round(i * ratio), audioData.length - 1);
      result[i] = audioData[originalIndex];
    }
    
    return result;
  }
  
  // Helper: Get top k predictions
  private getTopKClasses(scores: Float32Array, classes: string[], k: number): Array<{className: string, score: number}> {
    const result = [];
    
    for (let i = 0; i < Math.min(scores.length, classes.length); i++) {
      result.push({className: classes[i], score: scores[i]});
    }
    
    return result
      .sort((a, b) => b.score - a.score)
      .slice(0, k);
  }
  
  // Helper: Map YAMNet class to content type
  private mapYamnetToContentClass(yamnetClass: string): string | null {
    const mapping: Record<string, string> = {
      'Music': 'music',
      'Speech': 'speech',
      'Singing': 'vocals',
      'Guitar': 'music',
      'Drum': 'music',
      'Piano': 'music',
      'Human voice': 'vocals',
      'Male speech, man speaking': 'speech',
      'Female speech, woman speaking': 'speech',
      'Musical instrument': 'music',
      'Electronic music': 'electronic',
      'Rock music': 'music',
      'Pop music': 'music',
      'Hip hop music': 'music'
    };
    
    return mapping[yamnetClass] || null;
  }
  
  // Helper: Get YAMNet class names
  private async getYamnetClasses(): Promise<string[]> {
    // YAMNet has 521 classes - returning a subset of the most relevant ones
    return [
      'Speech', 'Music', 'Singing', 'Guitar', 'Musical instrument',
      'Drum', 'Piano', 'Human voice', 'Male speech, man speaking', 
      'Female speech, woman speaking', 'Electronic music', 'Rock music',
      'Pop music', 'Hip hop music', 'Classical music', 'Country music',
      'Jazz', 'Blues', 'Reggae', 'Electronic dance music'
    ];
  }
}
