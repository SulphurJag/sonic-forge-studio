
// Type definitions for content classification

// Content classification result type
export type ContentClassification = string[];

// Processing recommendations based on content type
export interface ProcessingRecommendations {
  targetLufs: number;
  dynamicsSettings: {
    threshold: number;
    ratio: number;
    attack: number;
    release: number;
  };
  eqSettings: {
    lowBoost: number;
    midScoop: number;
    highEnhance: number;
  };
}

// Simplified options for content classification
export interface ClassificationOptions {
  useSimulated?: boolean;
}
