
import { pipeline, env } from '@huggingface/transformers';
import { ModelStatusTracker } from './modelStatusTracker';

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
      // Set up WebGPU if available
      env.backends.onnx.wasm.wasmPaths = `${window.location.origin}/onnx/`;
      
      // Load the pipeline with webgpu device if available, fallback to cpu
      const model = await pipeline(task, modelId, { 
        device: 'webgpu', 
        progress_callback: (progressInfo: any) => {
          // Extract a numeric value from the progress info object
          // or use a default value if the structure doesn't match expectations
          const progress = typeof progressInfo === 'number' ? 
            progressInfo : 
            (progressInfo && progressInfo.progress ? progressInfo.progress : 0);
            
          console.log(`Loading model ${modelKey}: ${Math.round(progress * 100)}%`);
        }
      });
      
      // Cache the model
      this.modelCache.set(modelKey, model);
      
      // Update status to initialized
      this.statusTracker.setInitialized(modelKey);
      
      console.log(`Model ${modelKey} loaded successfully`);
      return model;
    } catch (error) {
      console.error(`Failed to load model ${modelKey}:`, error);
      
      // Update status with error
      this.statusTracker.setError(modelKey, error as Error);
      
      return null;
    }
  }
}
