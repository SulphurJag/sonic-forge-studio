
import * as ort from 'onnxruntime-web';
import { ModelStatusTracker } from './modelStatusTracker';

// ONNX model loader for handling ONNX format models
export class OnnxModelLoader {
  private modelCache: Map<string, ort.InferenceSession> = new Map();
  private statusTracker: ModelStatusTracker;
  
  constructor(statusTracker: ModelStatusTracker) {
    this.statusTracker = statusTracker;
  }
  
  // Load an ONNX model
  async loadModel(modelKey: string, modelPath: string): Promise<ort.InferenceSession | null> {
    if (this.modelCache.has(modelKey)) {
      return this.modelCache.get(modelKey)!;
    }
    
    // Update status to loading
    this.statusTracker.setLoading(modelKey);
    
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
      this.statusTracker.setInitialized(modelKey);
      
      console.log(`Model ${modelKey} loaded successfully`);
      return session;
    } catch (error) {
      console.error(`Failed to load model ${modelKey}:`, error);
      
      // Update status with error
      this.statusTracker.setError(modelKey, error as Error);
      
      return null;
    }
  }
}
