
import { AINoiseSuppressionProcessor } from '../noiseSuppressionProcessor';
import { AIContentClassifier } from '../content/contentClassifier';
import { AIArtifactEliminator } from '../artifactEliminator';
import { AIAudioProcessingSettings, AIAudioProcessingResult } from './types';
import { 
  showContentClassificationNotification,
  showNoiseReductionNotification,
  showNoiseReductionCompleteNotification,
  showArtifactDetectedNotification,
  showArtifactFixedNotification,
  showProcessingErrorNotification
} from './notifications';

// Process audio with AI components
export async function processAudioWithAI(
  audioBuffer: AudioBuffer,
  settings: AIAudioProcessingSettings,
  noiseProcessor: AINoiseSuppressionProcessor,
  contentClassifier: AIContentClassifier,
  artifactEliminator: AIArtifactEliminator,
  isInitialized: boolean,
  initialize: () => Promise<boolean>
): Promise<AIAudioProcessingResult> {
  if (!isInitialized) {
    await initialize();
    if (!isInitialized) {
      throw new Error("AI audio engine not initialized");
    }
  }
  
  // Default result
  let result: AIAudioProcessingResult = {
    processedBuffer: audioBuffer,
    contentType: [],
    artifactsFound: false
  };
  
  try {
    // Step 1: Content classification (if enabled)
    if (settings.enableContentClassification) {
      result.contentType = await contentClassifier.classifyContent(audioBuffer);
      console.log("Content classified as:", result.contentType);
      
      showContentClassificationNotification(result.contentType);
    }
    
    // Step 2: Apply content-aware processing (if enabled)
    let currentBuffer = audioBuffer;
    if (settings.enableAutoProcessing && result.contentType.length > 0) {
      // Get recommendations based on content type
      const recommendations = contentClassifier.getProcessingRecommendations();
      console.log("Processing recommendations:", recommendations);
    }
    
    // Step 3: Noise reduction (if enabled)
    if (settings.enableNoiseReduction) {
      showNoiseReductionNotification(settings.noiseReductionStrategy);
      
      const denoisedBuffer = await noiseProcessor.processBuffer(
        currentBuffer,
        {
          strategy: settings.noiseReductionStrategy,
          intensity: settings.noiseReductionIntensity,
          preserveTone: settings.preserveTone
        }
      );
      
      if (denoisedBuffer) {
        currentBuffer = denoisedBuffer;
        showNoiseReductionCompleteNotification(settings.noiseReductionIntensity);
      }
    }
    
    // Step 4: Artifact elimination (if enabled)
    if (settings.enableArtifactElimination) {
      // Detect artifacts
      const artifactAnalysis = artifactEliminator.detectArtifacts(currentBuffer);
      result.artifactsFound = artifactAnalysis.hasClipping || 
        artifactAnalysis.hasCrackles || 
        artifactAnalysis.hasClicksAndPops;
      
      if (result.artifactsFound) {
        console.log("Artifacts detected:", artifactAnalysis);
        
        showArtifactDetectedNotification();
        
        // Fix artifacts
        const cleanedBuffer = await artifactEliminator.eliminateArtifacts(
          currentBuffer,
          {
            fixClipping: artifactAnalysis.hasClipping,
            fixCrackles: artifactAnalysis.hasCrackles,
            fixClicksAndPops: artifactAnalysis.hasClicksAndPops
          }
        );
        
        if (cleanedBuffer) {
          currentBuffer = cleanedBuffer;
          showArtifactFixedNotification();
        }
      }
    }
    
    // Return the final processed buffer
    result.processedBuffer = currentBuffer;
    return result;
  } catch (error) {
    console.error("Error during AI audio processing:", error);
    showProcessingErrorNotification();
    return result;
  }
}
