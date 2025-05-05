
import { ModelStatusTracker } from './modelStatusTracker';
import { OnnxModelLoader } from './onnxModelLoader';
import { TensorflowModelLoader } from './tensorflowModelLoader';
import { TransformersModelLoader } from './transformersModelLoader';
import { WebGpuDetector } from './webGpuDetector';
import { MODEL_PATHS, HF_MODELS, ModelStatus } from './modelTypes';
import { toast } from "@/hooks/use-toast";

// Main model manager that combines all loaders
class ModelManager {
  private statusTracker: ModelStatusTracker;
  private onnxLoader: OnnxModelLoader;
  private tfLoader: TensorflowModelLoader;
  private transformersLoader: TransformersModelLoader;
  
  constructor() {
    // Initialize model status tracker with all model keys
    const allModelKeys = [
      ...Object.keys(MODEL_PATHS),
      ...Object.keys(HF_MODELS)
    ];
    
    this.statusTracker = new ModelStatusTracker(allModelKeys);
    this.onnxLoader = new OnnxModelLoader(this.statusTracker);
    this.tfLoader = new TensorflowModelLoader(this.statusTracker);
    this.transformersLoader = new TransformersModelLoader(this.statusTracker);
  }
  
  // Check if a model is ready for inference
  isModelReady(modelKey: string): boolean {
    return this.statusTracker.isModelReady(modelKey);
  }
  
  // Get model loading status
  getModelStatus(modelKey: string): ModelStatus {
    return this.statusTracker.getModelStatus(modelKey);
  }
  
  // Load an ONNX model
  async loadOnnxModel(modelKey: string): Promise<any | null> {
    const modelPath = (MODEL_PATHS as any)[modelKey];
    if (!modelPath) {
      console.error(`Model path not found for key: ${modelKey}`);
      return null;
    }
    
    return this.onnxLoader.loadModel(modelKey, modelPath);
  }
  
  // Load a TensorFlow.js model
  async loadTfModel(modelKey: string): Promise<any | null> {
    const modelPath = (MODEL_PATHS as any)[modelKey];
    if (!modelPath) {
      console.error(`Model path not found for key: ${modelKey}`);
      return null;
    }
    
    return this.tfLoader.loadModel(modelKey, modelPath);
  }
  
  // Load a Hugging Face Transformers model
  async loadTransformersModel(
    task: "feature-extraction" | "text-classification" | "token-classification" | 
          "question-answering" | "summarization" | "translation" | 
          "text-generation" | "fill-mask" | 
          "image-classification" | "image-segmentation" | 
          "object-detection" | "image-to-text" | "automatic-speech-recognition" | 
          "audio-classification" | "text-to-speech" | "zero-shot-classification",
    modelId: string,
    modelKey: string
  ): Promise<any> {
    return this.transformersLoader.loadModel(task, modelId, modelKey);
  }
  
  // Check if browser supports WebGPU
  async checkWebGPUSupport(): Promise<boolean> {
    return WebGpuDetector.isWebGpuSupported();
  }
}

// Export model types and constants
export { MODEL_PATHS, HF_MODELS };
export type { ModelStatus };

// Export the model manager instance
export const modelManager = new ModelManager();

