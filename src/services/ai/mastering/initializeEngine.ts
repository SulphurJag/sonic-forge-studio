
import { AINoiseSuppressionProcessor } from '../noiseSuppressionProcessor';
import { AIContentClassifier } from '../content/contentClassifier';
import { AIArtifactEliminator } from '../artifactEliminator';
import { modelManager } from '../models';
import { 
  showInitSuccessNotification, 
  showPartialInitNotification, 
  showInitErrorNotification,
  showWebGPUNotSupportedNotification
} from './notifications';
import { AIInitializationStatus } from './types';

// Initialize all AI components
export async function initializeAIEngine(
  noiseProcessor: AINoiseSuppressionProcessor,
  contentClassifier: AIContentClassifier,
  artifactEliminator: AIArtifactEliminator,
  isInitializing: boolean
): Promise<{ 
  isInitialized: boolean; 
  hasGPUSupport: boolean; 
  isInitializing: boolean;
  usingSimulation: boolean;
}> {
  if (isInitializing) {
    console.log("AI engine is already initializing");
    return { isInitialized: false, hasGPUSupport: false, isInitializing: true, usingSimulation: true };
  }
  
  isInitializing = true;
  
  try {
    // Check for WebGPU support first
    const hasGPUSupport = await modelManager.checkWebGPUSupport();
    
    if (!hasGPUSupport) {
      showWebGPUNotSupportedNotification();
      console.log("WebGPU not supported - using lightweight or simulated AI processing");
    }
    
    // Initialize all components in parallel
    const results = await Promise.all([
      noiseProcessor.initialize(),
      contentClassifier.initialize(),
      artifactEliminator.initialize()
    ]);
    
    const isInitialized = results.every(result => result);
    
    // Check if any component is using simulation
    const usingSimulation = (
      (noiseProcessor.isUsingSimulation && noiseProcessor.isUsingSimulation()) || 
      (contentClassifier.isUsingSimulation && contentClassifier.isUsingSimulation()) || 
      (artifactEliminator.isUsingSimulation && artifactEliminator.isUsingSimulation())
    );
    
    console.log(`AI audio mastering engine initialized: ${isInitialized}`);
    console.log(`Using simulation: ${usingSimulation}`);
    
    if (isInitialized) {
      if (usingSimulation) {
        showPartialInitNotification();
      } else {
        showInitSuccessNotification(hasGPUSupport);
      }
    } else {
      showPartialInitNotification();
    }
    
    return { isInitialized, hasGPUSupport, isInitializing: false, usingSimulation };
  } catch (error) {
    console.error("Failed to initialize AI audio engine:", error);
    showInitErrorNotification();
    return { isInitialized: false, hasGPUSupport: false, isInitializing: false, usingSimulation: true };
  }
}

// Check initialization status of each component
export function getInitializationStatus(
  noiseProcessor: AINoiseSuppressionProcessor,
  contentClassifier: AIContentClassifier,
  artifactEliminator: AIArtifactEliminator,
  isInitialized: boolean,
  hasGPUSupport: boolean,
  usingSimulation: boolean = true
): AIInitializationStatus {
  return {
    noiseProcessor: noiseProcessor.isReady(),
    contentClassifier: contentClassifier.isReady(),
    artifactEliminator: artifactEliminator.isReady(),
    overall: isInitialized,
    hasWebGPU: hasGPUSupport,
    usingSimulation: usingSimulation
  };
}
