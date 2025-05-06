
import { AINoiseSuppressionProcessor } from '../noiseSuppressionProcessor';
import { AIContentClassifier } from '../content/contentClassifier';
import { AIArtifactEliminator } from '../artifactEliminator';
import { modelManager, ProcessingMode } from '../models';
import { 
  showInitSuccessNotification, 
  showPartialInitNotification, 
  showInitErrorNotification,
  showWebGPUNotSupportedNotification,
  showRemoteAPIActiveNotification
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
  processingMode: ProcessingMode;
}> {
  if (isInitializing) {
    console.log("AI engine is already initializing");
    return { 
      isInitialized: false, 
      hasGPUSupport: false, 
      isInitializing: true,
      processingMode: ProcessingMode.REMOTE_API 
    };
  }
  
  let localIsInitializing = true;
  
  try {
    // Check for WebGPU support first
    const hasGPUSupport = await modelManager.checkWebGPUSupport();
    
    if (!hasGPUSupport) {
      showWebGPUNotSupportedNotification();
      console.log("WebGPU not supported - using remote API processing");
      modelManager.setProcessingMode(ProcessingMode.REMOTE_API);
    }
    
    // Get preferred processing mode
    const processingMode = modelManager.getPreferredProcessingMode();
    
    if (processingMode === ProcessingMode.REMOTE_API) {
      showRemoteAPIActiveNotification();
    }
    
    // Initialize all components in parallel with improved error handling
    const results = await Promise.allSettled([
      noiseProcessor.initialize(),
      contentClassifier.initialize(),
      artifactEliminator.initialize()
    ]);
    
    // Check if any components failed to initialize
    const initStatus = results.map(result => result.status === 'fulfilled' && result.value);
    const isInitialized = initStatus.some(status => status === true);
    
    console.log(`AI audio mastering engine initialization results:`, initStatus);
    console.log(`Using processing mode: ${processingMode}`);
    
    if (isInitialized) {
      if (processingMode === ProcessingMode.LOCAL_WEBGPU) {
        showInitSuccessNotification(hasGPUSupport);
      } else {
        showRemoteAPIActiveNotification();
      }
    } else {
      showPartialInitNotification();
    }
    
    return { 
      isInitialized, 
      hasGPUSupport, 
      isInitializing: false, 
      processingMode 
    };
  } catch (error) {
    console.error("Failed to initialize AI audio engine:", error);
    showInitErrorNotification();
    return { 
      isInitialized: false, 
      hasGPUSupport: false, 
      isInitializing: false, 
      processingMode: ProcessingMode.REMOTE_API 
    };
  } finally {
    localIsInitializing = false;
  }
}

// Check initialization status of each component
export function getInitializationStatus(
  noiseProcessor: AINoiseSuppressionProcessor,
  contentClassifier: AIContentClassifier,
  artifactEliminator: AIArtifactEliminator,
  isInitialized: boolean,
  hasGPUSupport: boolean,
  processingMode: ProcessingMode = ProcessingMode.REMOTE_API
): AIInitializationStatus {
  return {
    noiseProcessor: noiseProcessor.isReady(),
    contentClassifier: contentClassifier.isReady(),
    artifactEliminator: artifactEliminator.isReady(),
    overall: isInitialized,
    hasWebGPU: hasGPUSupport,
    processingMode: processingMode
  };
}
