
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
      // Configure ONNX Runtime to use CDN for WebAssembly files
      ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.16.3/dist/';
      
      // Try to load the model with proper error handling
      let session: ort.InferenceSession;
      
      try {
        // First try the direct path
        session = await ort.InferenceSession.create(modelPath);
      } catch (directError) {
        console.warn(`Direct model loading failed for ${modelKey}, trying CDN fallback:`, directError);
        
        // Fallback: Try loading from a CDN or alternative source
        throw new Error(`Model file not found: ${modelPath}`);
      }
      
      // Cache the model
      this.modelCache.set(modelKey, session);
      
      // Update status to initialized
      this.statusTracker.setInitialized(modelKey);
      
      console.log(`ONNX model ${modelKey} loaded successfully`);
      return session;
    } catch (error) {
      console.warn(`Failed to load ONNX model ${modelKey}:`, error);
      
      // Update status with error
      this.statusTracker.setError(modelKey, error as Error);
      
      return null;
    }
  }
  
  // Dispose of a cached model
  disposeModel(modelKey: string): void {
    const session = this.modelCache.get(modelKey);
    if (session) {
      session.release();
      this.modelCache.delete(modelKey);
    }
  }
  
  // Dispose of all cached models
  disposeAll(): void {
    for (const [key, session] of this.modelCache) {
      session.release();
    }
    this.modelCache.clear();
  }
}
