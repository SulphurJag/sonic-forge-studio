
import { ContentClassification, ProcessingRecommendations } from './contentClassifierTypes';

/**
 * Utility class to analyze content and provide processing recommendations
 */
export class ContentAnalytics {
  // Get processing recommendations based on content type
  static getProcessingRecommendations(classifications: ContentClassification): ProcessingRecommendations {
    // Simple logic based on classification
    const isSpeech = classifications.includes("speech");
    const isMusic = classifications.includes("music");
    const isGuitar = classifications.includes("guitar");
    
    if (isSpeech) {
      return {
        targetLufs: -16,
        dynamicsSettings: {
          threshold: -20,
          ratio: 3,
          attack: 0.01,
          release: 0.2
        },
        eqSettings: {
          lowBoost: 0,
          midScoop: 2,
          highEnhance: 1.5
        }
      };
    } else if (isMusic && isGuitar) {
      return {
        targetLufs: -14,
        dynamicsSettings: {
          threshold: -24,
          ratio: 2,
          attack: 0.003,
          release: 0.25
        },
        eqSettings: {
          lowBoost: 1.5,
          midScoop: -1,
          highEnhance: 2
        }
      };
    } else {
      return {
        targetLufs: -14,
        dynamicsSettings: {
          threshold: -24,
          ratio: 2,
          attack: 0.003,
          release: 0.25
        },
        eqSettings: {
          lowBoost: 1,
          midScoop: 0,
          highEnhance: 1
        }
      };
    }
  }

  // Simplified detection based on audio properties
  static analyzeAudioCharacteristics(audioBuffer: AudioBuffer): ContentClassification {
    const classifications: string[] = [];
    
    // Simple detection based on content duration
    if (audioBuffer.duration < 10) {
      classifications.push("short_clip");
    } else if (audioBuffer.duration > 60) {
      classifications.push("long_content");
    }
    
    // Detect if likely speech or music based on simple heuristics
    const channel = audioBuffer.getChannelData(0);
    let sum = 0;
    let squareSum = 0;
    
    // Sample the first 10000 samples
    const sampleSize = Math.min(10000, channel.length);
    for (let i = 0; i < sampleSize; i++) {
      sum += channel[i];
      squareSum += channel[i] * channel[i];
    }
    
    const mean = sum / sampleSize;
    const variance = squareSum / sampleSize - mean * mean;
    
    if (variance > 0.01) {
      classifications.push("music");
    } else {
      classifications.push("speech");
    }
    
    // Add some variety for the demo
    if (Math.random() > 0.5) {
      classifications.push("guitar");
    } else {
      classifications.push("vocals");
    }
    
    return classifications;
  }
}
