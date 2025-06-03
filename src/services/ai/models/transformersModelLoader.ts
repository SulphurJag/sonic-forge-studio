
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
      
      // Load the actual pipeline from Hugging Face
      const modelPipeline = await pipeline(task, modelId, {
        device: 'webgpu', // Try WebGPU first
        dtype: 'fp32'
      });
      
      // Cache the model
      this.modelCache.set(modelKey, modelPipeline);
      
      // Update status to initialized
      this.statusTracker.setInitialized(modelKey);
      
      console.log(`Model ${modelKey} loaded successfully`);
      toast({
        title: "Model Loaded",
        description: `${modelKey} is ready for use`,
        variant: "default"
      });
      
      return modelPipeline;
    } catch (webgpuError) {
      console.warn(`WebGPU loading failed for ${modelKey}, trying CPU:`, webgpuError);
      
      try {
        // Fallback to CPU if WebGPU fails
        const modelPipeline = await pipeline(task, modelId, {
          device: 'cpu',
          dtype: 'fp32'
        });
        
        // Cache the model
        this.modelCache.set(modelKey, modelPipeline);
        
        // Update status to initialized
        this.statusTracker.setInitialized(modelKey);
        
        console.log(`Model ${modelKey} loaded successfully on CPU`);
        toast({
          title: "Model Loaded (CPU)",
          description: `${modelKey} is ready (using CPU)`,
          variant: "default"
        });
        
        return modelPipeline;
      } catch (error) {
        console.error(`Failed to load model ${modelKey}:`, error);
        
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
  }
}
