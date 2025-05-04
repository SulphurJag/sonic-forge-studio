
import { ContentClassification } from './contentClassifierTypes';

/**
 * Utility class to extract content types from text analysis
 */
export class ContentTextAnalyzer {
  /**
   * Extract content categories from transcribed text
   */
  static extractContentFromText(text: string): ContentClassification {
    const classifications: string[] = [];
    const lowercaseText = text.toLowerCase();
    
    // Simple keyword matching for content types
    if (lowercaseText.includes('music') || lowercaseText.includes('song') || lowercaseText.includes('melody')) {
      classifications.push('music');
    }
    if (lowercaseText.includes('speech') || lowercaseText.includes('talk') || lowercaseText.includes('conversation')) {
      classifications.push('speech');
    }
    if (lowercaseText.includes('guitar') || lowercaseText.includes('strum')) {
      classifications.push('guitar');
    }
    if (lowercaseText.includes('vocal') || lowercaseText.includes('sing')) {
      classifications.push('vocals');
    }
    
    // If no keywords matched, add default classification
    if (classifications.length === 0) {
      classifications.push('audio');
    }
    
    return classifications;
  }
  
  /**
   * Add duration-based classification
   */
  static addDurationBasedClassification(classifications: ContentClassification, duration: number): ContentClassification {
    if (duration < 10) {
      classifications.push('short_clip');
    } else if (duration > 60) {
      classifications.push('long_content');
    }
    return classifications;
  }
}
