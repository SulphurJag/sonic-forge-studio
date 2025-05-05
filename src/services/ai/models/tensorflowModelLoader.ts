
import * as tf from '@tensorflow/tfjs';
import { ModelStatusTracker } from './modelStatusTracker';

// TensorFlow.js model loader
export class TensorflowModelLoader {
  private modelCache: Map<string, tf.GraphModel | tf.LayersModel> = new Map();
  private statusTracker: ModelStatusTracker;
  
  constructor(statusTracker: ModelStatusTracker) {
    this.statusTracker = statusTracker;
  }
  
  // Load a TensorFlow.js model
  async loadModel(modelKey: string, modelPath: string): Promise<tf.GraphModel | tf.LayersModel | null> {
    if (this.modelCache.has(modelKey)) {
      return this.modelCache.get(modelKey)!;
    }
    
    // Update status to loading
    this.statusTracker.setLoading(modelKey);
    
    try {
      // Load the model with absolute URL path
      const model = await tf.loadGraphModel(`${window.location.origin}${modelPath}`);
      
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
