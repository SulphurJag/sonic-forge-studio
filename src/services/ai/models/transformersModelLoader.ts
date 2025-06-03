
import { pipeline } from '@huggingface/transformers';
import { ModelStatusTracker } from './modelStatusTracker';
import { toast } from "@/hooks/use-toast";

// Hugging Face Transformers model loader
export class TransformersModelLoader {
  private modelCache: Map<string, any> = new Map();
  private statusTracker: ModelStatusTracker;
  
  constructor(statusTracker: ModelStatusTracker) {
    this.statusTracker = statusTracker;
  }
  
  // Load a Hugging Face Transformers model
  async loadModel(
    task: "feature-extraction" | "text-classification" | "token-classification" | 
          "question-answering" | "summarization" | "translation" | 
          "text-generation" | "fill-mask" | 
          "image-classification" | "image-segmentation" | 
          "object-detection" | "image-to-text" | "automatic-speech-recognition" | 
          "audio-classification" | "text-to-speech" | "zero-shot-classification",
    modelId: string,
    modelKey: string
  ): Promise<any> {
    if (this.modelCache.has(modelKey)) {
      return this.modelCache.get(modelKey);
    }
    
    // Update status to loading
    this.statusTracker.setLoading(modelKey);
    
    try {
      console.log(`Loading ${task} model: ${modelId}`);
      
      let modelPipeline: any;
      
      // Try WebGPU first if available
      try {
        modelPipeline = await pipeline(task, modelId, {
          device: 'webgpu',
          dtype: 'fp32'
        });
        console.log(`Model ${modelKey} loaded successfully on WebGPU`);
      } catch (webgpuError) {
        console.warn(`WebGPU loading failed for ${modelKey}, trying CPU:`, webgpuError);
        
        // Fallback to CPU
        try {
          modelPipeline = await pipeline(task, modelId, {
            device: 'cpu',
            dtype: 'fp32'
          });
          console.log(`Model ${modelKey} loaded successfully on CPU`);
        } catch (cpuError) {
          console.error(`CPU loading also failed for ${modelKey}:`, cpuError);
          throw new Error(`Failed to load model on any device: ${modelKey}`);
        }
      }
      
      // Cache the model
      this.modelCache.set(modelKey, modelPipeline);
      
      // Update status to initialized
      this.statusTracker.setInitialized(modelKey);
      
      toast({
        title: "AI Model Ready",
        description: `${modelKey} loaded successfully`,
        variant: "default"
      });
      
      return modelPipeline;
    } catch (error) {
      console.error(`Failed to load transformers model ${modelKey}:`, error);
      
      // Update status with error
      this.statusTracker.setError(modelKey, error as Error);
      
      toast({
        title: "Model Loading Failed",
        description: `Could not initialize ${modelKey}`,
        variant: "destructive"
      });
      
      return null;
    }
  }
  
  // Dispose of cached models (transformers models don't have explicit dispose)
  disposeModel(modelKey: string): void {
    this.modelCache.delete(modelKey);
  }
  
  // Clear all cached models
  disposeAll(): void {
    this.modelCache.clear();
  }
}
