
import * as ort from 'onnxruntime-web';
import * as tf from '@tensorflow/tfjs';
import { pipeline, env } from '@huggingface/transformers';
import { toast } from "@/hooks/use-toast";

// Configuration for model paths and Hugging Face model IDs
export const MODEL_PATHS = {
  // Noise Suppression Models
  DTLN_MODEL_1: '/models/noise_suppression/dtln_model_1.onnx',
  DTLN_MODEL_2: '/models/noise_suppression/dtln_model_2.onnx',
  NSNET_MODEL: '/models/noise_suppression/nsnet_48khz.onnx',
  // Content Classification Models
  YAMNET_MODEL: '/models/classification/yamnet.onnx',
  // Artifact Elimination Models
  ARTIFACT_GAN: '/models/artifact_elimination/gan_reconstructor.onnx',
};

// Hugging Face model IDs for using transformers.js
export const HF_MODELS = {
  NOISE_SUPPRESSOR: 'speechbrain/sepformer-whamr-enhancement',
  CONTENT_CLASSIFIER: 'openai/whisper-base',
  ARTIFACT_DETECTOR: 'microsoft/wavlm-base-plus'
};

// Tracks the initialization status of models
export interface ModelStatus {
  initialized: boolean;
  loading: boolean;
  error: string | null;
}

// Class to handle model loading and status tracking
class ModelManager {
  private modelCache: Map<string, any> = new Map();
  private modelStatus: Map<string, ModelStatus> = new Map();
  
  constructor() {
    Object.keys(MODEL_PATHS).forEach(key => {
      this.modelStatus.set(key, {
        initialized: false,
        loading: false,
        error: null
      });
    });
    
    Object.keys(HF_MODELS).forEach(key => {
      this.modelStatus.set(key, {
        initialized: false,
        loading: false,
        error: null
      });
    });
  }
  
  // Check if a model is ready for inference
  isModelReady(modelKey: string): boolean {
    const status = this.modelStatus.get(modelKey);
    return status ? status.initialized : false;
  }
  
  // Get model loading status
  getModelStatus(modelKey: string): ModelStatus {
    return this.modelStatus.get(modelKey) || {
      initialized: false,
      loading: false,
      error: 'Model not registered'
    };
  }
  
  // Load an ONNX model
  async loadOnnxModel(modelKey: string): Promise<ort.InferenceSession | null> {
    if (this.modelCache.has(modelKey)) {
      return this.modelCache.get(modelKey);
    }
    
    const modelPath = (MODEL_PATHS as any)[modelKey];
    if (!modelPath) {
      console.error(`Model path not found for key: ${modelKey}`);
      return null;
    }
    
    // Update status to loading
    this.modelStatus.set(modelKey, {
      initialized: false,
      loading: true,
      error: null
    });
    
    try {
      // Set ONNX WebAssembly path - using absolute URLs to fix the loading issue
      ort.env.wasm.wasmPaths = {
        'ort-wasm.wasm': `${window.location.origin}/onnx/ort-wasm.wasm`,
        'ort-wasm-simd.wasm': `${window.location.origin}/onnx/ort-wasm-simd.wasm`,
        'ort-wasm-threaded.wasm': `${window.location.origin}/onnx/ort-wasm-threaded.wasm`,
      };
      
      // Create inference session
      const session = await ort.InferenceSession.create(modelPath);
      
      // Cache the model
      this.modelCache.set(modelKey, session);
      
      // Update status to initialized
      this.modelStatus.set(modelKey, {
        initialized: true,
        loading: false,
        error: null
      });
      
      console.log(`Model ${modelKey} loaded successfully`);
      return session;
    } catch (error) {
      console.error(`Failed to load model ${modelKey}:`, error);
      
      // Update status with error
      this.modelStatus.set(modelKey, {
        initialized: false,
        loading: false,
        error: `Failed to load model: ${error instanceof Error ? error.message : String(error)}`
      });
      
      return null;
    }
  }
  
  // Load a TensorFlow.js model
  async loadTfModel(modelKey: string): Promise<tf.GraphModel | tf.LayersModel | null> {
    if (this.modelCache.has(modelKey)) {
      return this.modelCache.get(modelKey);
    }
    
    const modelPath = (MODEL_PATHS as any)[modelKey];
    if (!modelPath) {
      console.error(`Model path not found for key: ${modelKey}`);
      return null;
    }
    
    // Update status to loading
    this.modelStatus.set(modelKey, {
      initialized: false,
      loading: true,
      error: null
    });
    
    try {
      // Load the model with absolute URL path
      const model = await tf.loadGraphModel(`${window.location.origin}${modelPath}`);
      
      // Cache the model
      this.modelCache.set(modelKey, model);
      
      // Update status to initialized
      this.modelStatus.set(modelKey, {
        initialized: true,
        loading: false,
        error: null
      });
      
      console.log(`Model ${modelKey} loaded successfully`);
      return model;
    } catch (error) {
      console.error(`Failed to load model ${modelKey}:`, error);
      
      // Update status with error
      this.modelStatus.set(modelKey, {
        initialized: false,
        loading: false,
        error: `Failed to load model: ${error instanceof Error ? error.message : String(error)}`
      });
      
      return null;
    }
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
    if (this.modelCache.has(modelKey)) {
      return this.modelCache.get(modelKey);
    }
    
    // Update status to loading
    this.modelStatus.set(modelKey, {
      initialized: false,
      loading: true,
      error: null
    });
    
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
      this.modelStatus.set(modelKey, {
        initialized: true,
        loading: false,
        error: null
      });
      
      console.log(`Model ${modelKey} loaded successfully`);
      return model;
    } catch (error) {
      console.error(`Failed to load model ${modelKey}:`, error);
      
      // Update status with error
      this.modelStatus.set(modelKey, {
        initialized: false,
        loading: false,
        error: `Failed to load model: ${error instanceof Error ? error.message : String(error)}`
      });
      
      return null;
    }
  }
  
  // Check if browser supports WebGPU (required for efficient AI processing)
  async checkWebGPUSupport(): Promise<boolean> {
    if ('gpu' in navigator) {
      try {
        const adapter = await (navigator as any).gpu.requestAdapter();
        if (adapter) {
          return true;
        }
      } catch (e) {
        console.warn("WebGPU check failed:", e);
      }
    }
    return false;
  }
}

// Export the model manager instance
export const modelManager = new ModelManager();
