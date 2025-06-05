
import { ContentClassifierModel } from './contentClassifierModel';
import { NoiseSuppressionModel } from './noiseSuppressionModel';
import { ArtifactDetectionModel } from './artifactDetectionModel';
import { RealNoiseReductionModel } from './realNoiseReductionModel';
import { RealArtifactDetectionModel } from './realArtifactDetectionModel';
import { WebGpuDetector } from './webGpuDetector';
import { ProcessingMode, HF_MODELS, TFJS_MODELS, LIGHTWEIGHT_MODELS } from './modelTypes';
import { pipeline, PipelineType } from '@huggingface/transformers';
import { toast } from "@/hooks/use-toast";

// Main model manager that orchestrates all AI models
class ModelManager {
  private contentClassifier: ContentClassifierModel;
  private noiseSuppressor: NoiseSuppressionModel;
  private artifactDetector: ArtifactDetectionModel;
  private realNoiseReducer: RealNoiseReductionModel;
  private realArtifactDetector: RealArtifactDetectionModel;
  private preferredProcessingMode: ProcessingMode = ProcessingMode.REMOTE_API;
  private isInitialized: boolean = false;
  
  constructor() {
    this.contentClassifier = new ContentClassifierModel();
    this.noiseSuppressor = new NoiseSuppressionModel();
    this.artifactDetector = new ArtifactDetectionModel();
    this.realNoiseReducer = new RealNoiseReductionModel();
    this.realArtifactDetector = new RealArtifactDetectionModel();
    
    // Initialize processing mode detection
    this.detectOptimalProcessingMode();
  }
  
  // Load transformers model method with proper typing
  async loadTransformersModel(task: string, modelId: string, modelKey: string): Promise<any> {
    try {
      console.log(`Loading transformers model: ${modelId} for task: ${task}`);
      
      // Cast task to PipelineType to fix the type error
      const pipelineTask = task as PipelineType;
      
      const pipeline_instance = await pipeline(pipelineTask, modelId, {
        device: this.preferredProcessingMode === ProcessingMode.LOCAL_WEBGPU ? 'webgpu' : 'cpu',
        dtype: this.preferredProcessingMode === ProcessingMode.LOCAL_WEBGPU ? 'fp16' : 'fp32'
      });
      
      console.log(`Successfully loaded transformers model: ${modelKey}`);
      return pipeline_instance;
    } catch (error) {
      console.error(`Failed to load transformers model ${modelKey}:`, error);
      throw error;
    }
  }
  
  // Detect the optimal processing mode based on device capabilities
  private async detectOptimalProcessingMode(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      const hasWebGPU = await WebGpuDetector.isWebGpuSupported();
      
      if (hasWebGPU) {
        this.preferredProcessingMode = ProcessingMode.LOCAL_WEBGPU;
        console.log("Using WebGPU for local model processing");
      } else {
        this.preferredProcessingMode = ProcessingMode.LOCAL_CPU;
        console.log("Using CPU for local model processing");
      }
      
      this.isInitialized = true;
    } catch (error) {
      console.error("Error detecting processing mode:", error);
      this.preferredProcessingMode = ProcessingMode.REMOTE_API;
      this.isInitialized = true;
    }
  }
  
  // Initialize all models (using real AI models)
  async initializeAllModels(): Promise<{ success: boolean; loadedModels: string[] }> {
    const loadedModels: string[] = [];
    
    try {
      // Initialize models in parallel (prioritize real AI models)
      const [contentResult, realNoiseResult, realArtifactResult] = await Promise.allSettled([
        this.contentClassifier.loadModel(),
        this.realNoiseReducer.loadModel(),
        this.realArtifactDetector.loadModel()
      ]);
      
      if (contentResult.status === 'fulfilled' && contentResult.value) {
        loadedModels.push('ContentClassifier');
      }
      
      if (realNoiseResult.status === 'fulfilled' && realNoiseResult.value) {
        loadedModels.push('RealNoiseReduction');
      }
      
      if (realArtifactResult.status === 'fulfilled' && realArtifactResult.value) {
        loadedModels.push('RealArtifactDetection');
      }
      
      const success = loadedModels.length > 0;
      
      if (success) {
        toast({
          title: "AI Models Loaded",
          description: `Successfully loaded: ${loadedModels.join(', ')}`,
          variant: "default"
        });
      } else {
        toast({
          title: "Model Loading Failed",
          description: "Using fallback processing methods",
          variant: "destructive"
        });
      }
      
      return { success, loadedModels };
    } catch (error) {
      console.error("Error initializing models:", error);
      return { success: false, loadedModels };
    }
  }
  
  // Get model instances (prioritize real AI models)
  getContentClassifier(): ContentClassifierModel {
    return this.contentClassifier;
  }
  
  getNoiseSuppressor(): RealNoiseReductionModel {
    return this.realNoiseReducer;
  }
  
  getArtifactDetector(): RealArtifactDetectionModel {
    return this.realArtifactDetector;
  }
  
  // Legacy methods for backward compatibility
  getLegacyNoiseSuppressor(): NoiseSuppressionModel {
    return this.noiseSuppressor;
  }
  
  getLegacyArtifactDetector(): ArtifactDetectionModel {
    return this.artifactDetector;
  }
  
  // Get processing mode
  getPreferredProcessingMode(): ProcessingMode {
    return this.preferredProcessingMode;
  }
  
  setProcessingMode(mode: ProcessingMode): void {
    this.preferredProcessingMode = mode;
  }
  
  // Check WebGPU support
  async checkWebGPUSupport(): Promise<boolean> {
    return WebGpuDetector.isWebGpuSupported();
  }
  
  // Get model status summary (using real AI models)
  getModelStatusSummary(): {
    contentClassifier: boolean;
    noiseSuppressor: boolean;
    artifactDetector: boolean;
    processingMode: ProcessingMode;
  } {
    return {
      contentClassifier: this.contentClassifier.isReady(),
      noiseSuppressor: this.realNoiseReducer.isReady(),
      artifactDetector: this.realArtifactDetector.isReady(),
      processingMode: this.preferredProcessingMode
    };
  }
  
  // Dispose all models
  dispose(): void {
    this.contentClassifier.dispose();
    this.noiseSuppressor.dispose();
    this.artifactDetector.dispose();
    this.realNoiseReducer.dispose();
    this.realArtifactDetector.dispose();
    console.log("All AI models disposed");
  }
}

// Export the model manager instance
export const modelManager = new ModelManager();

// Re-export types and constants
export * from './modelTypes';
export { WebGpuDetector } from './webGpuDetector';
export { HF_MODELS, TFJS_MODELS, LIGHTWEIGHT_MODELS };
export { RealNoiseReductionModel } from './realNoiseReductionModel';
export { RealArtifactDetectionModel } from './realArtifactDetectionModel';
