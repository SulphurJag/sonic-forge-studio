
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
    
    // Check if we should use remote API processing
    if (processingMode === ProcessingMode.REMOTE_API || !hasGPUSupport) {
      showRemoteAPIActiveNotification();
      // For remote API mode, we consider initialization successful
      return { 
        isInitialized: true, 
        hasGPUSupport, 
        isInitializing: false, 
        processingMode: ProcessingMode.REMOTE_API 
      };
    }
    
    // Initialize all components in parallel with improved error handling
    const results = await Promise.allSettled([
      noiseProcessor.initialize().catch(() => false),
      contentClassifier.initialize().catch(() => false),
      artifactEliminator.initialize().catch(() => false)
    ]);
    
    // Check if any components succeeded
    const initStatus = results.map(result => result.status === 'fulfilled' && result.value);
    const anyInitialized = initStatus.some(status => status === true);
    
    console.log(`AI audio mastering engine initialization results:`, initStatus);
    console.log(`Using processing mode: ${processingMode}`);
    
    if (anyInitialized) {
      showInitSuccessNotification(hasGPUSupport);
      return { 
        isInitialized: true, 
        hasGPUSupport, 
        isInitializing: false, 
        processingMode 
      };
    } else {
      showPartialInitNotification();
      // Fall back to remote API if local initialization failed
      modelManager.setProcessingMode(ProcessingMode.REMOTE_API);
      return { 
        isInitialized: true, 
        hasGPUSupport, 
        isInitializing: false, 
        processingMode: ProcessingMode.REMOTE_API 
      };
    }
  } catch (error) {
    console.error("Failed to initialize AI audio engine:", error);
    showInitErrorNotification();
    // Fall back to remote API on error
    modelManager.setProcessingMode(ProcessingMode.REMOTE_API);
    return { 
      isInitialized: true, 
      hasGPUSupport: false, 
      isInitializing: false, 
      processingMode: ProcessingMode.REMOTE_API 
    };
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
