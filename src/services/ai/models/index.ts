
import { ModelStatusTracker } from './modelStatusTracker';
import { OnnxModelLoader } from './onnxModelLoader';
import { TensorflowModelLoader } from './tensorflowModelLoader';
import { TransformersModelLoader } from './transformersModelLoader';
import { WebGpuDetector } from './webGpuDetector';
import { huggingFaceSpacesAPI } from './hugginFaceSpacesAPI';
import { MODEL_PATHS, HF_MODELS, LIGHTWEIGHT_MODELS, ModelStatus, ProcessingMode, HF_SPACES_ENDPOINTS } from './modelTypes';
import { toast } from "@/hooks/use-toast";

// Main model manager that combines all loaders
class ModelManager {
  private statusTracker: ModelStatusTracker;
  private onnxLoader: OnnxModelLoader;
  private tfLoader: TensorflowModelLoader;
  private transformersLoader: TransformersModelLoader;
  private preferredProcessingMode: ProcessingMode = ProcessingMode.REMOTE_API;
  private isInitialized: boolean = false;
  
  constructor() {
    // Initialize model status tracker with all model keys
    const allModelKeys = [
      ...Object.keys(MODEL_PATHS),
      ...Object.keys(HF_MODELS),
      ...Object.keys(HF_SPACES_ENDPOINTS)
    ];
    
    this.statusTracker = new ModelStatusTracker(allModelKeys);
    this.onnxLoader = new OnnxModelLoader(this.statusTracker);
    this.tfLoader = new TensorflowModelLoader(this.statusTracker);
    this.transformersLoader = new TransformersModelLoader(this.statusTracker);
    
    // Determine preferred processing mode
    this.detectOptimalProcessingMode();
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
        this.preferredProcessingMode = ProcessingMode.REMOTE_API;
        console.log("Using remote API for model processing");
        
        toast({
          title: "Using Remote Processing",
          description: "Your device doesn't support WebGPU. Using cloud-based processing.",
          variant: "default"
        });
      }
      
      this.isInitialized = true;
    } catch (error) {
      console.error("Error detecting processing mode:", error);
      this.preferredProcessingMode = ProcessingMode.REMOTE_API;
      this.isInitialized = true;
    }
  }
  
  // Get the preferred processing mode
  getPreferredProcessingMode(): ProcessingMode {
    return this.preferredProcessingMode;
  }
  
  // Set processing mode explicitly
  setProcessingMode(mode: ProcessingMode): void {
    this.preferredProcessingMode = mode;
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
    const modelPath = (LIGHTWEIGHT_MODELS as any)[modelKey];
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
  
  // Get API for Hugging Face Spaces
  getHuggingFaceSpacesAPI() {
    return huggingFaceSpacesAPI;
  }
  
  // Dispose of all models to free memory
  dispose(): void {
    this.onnxLoader.disposeAll();
    this.tfLoader.disposeAll();
    this.transformersLoader.disposeAll();
    console.log("All AI models disposed");
  }
}

// Export model types and constants
export { MODEL_PATHS, HF_MODELS, LIGHTWEIGHT_MODELS, HF_SPACES_ENDPOINTS, ProcessingMode };
export type { ModelStatus };

// Export the model manager instance
export const modelManager = new ModelManager();
