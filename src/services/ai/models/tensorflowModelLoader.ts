
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
      let model: tf.GraphModel | tf.LayersModel;
      
      // Try loading as graph model first
      try {
        model = await tf.loadGraphModel(modelPath);
        console.log(`TensorFlow graph model ${modelKey} loaded successfully`);
      } catch (graphError) {
        console.warn(`Graph model loading failed for ${modelKey}, trying layers model:`, graphError);
        
        // Fallback to layers model
        try {
          model = await tf.loadLayersModel(modelPath);
          console.log(`TensorFlow layers model ${modelKey} loaded successfully`);
        } catch (layersError) {
          console.error(`Both graph and layers model loading failed for ${modelKey}:`, layersError);
          throw new Error(`Failed to load TensorFlow model: ${modelKey}`);
        }
      }
      
      // Cache the model
      this.modelCache.set(modelKey, model);
      
      // Update status to initialized
      this.statusTracker.setInitialized(modelKey);
      
      return model;
    } catch (error) {
      console.error(`Failed to load TensorFlow model ${modelKey}:`, error);
      
      // Update status with error
      this.statusTracker.setError(modelKey, error as Error);
      
      return null;
    }
  }
  
  // Dispose of a cached model
  disposeModel(modelKey: string): void {
    const model = this.modelCache.get(modelKey);
    if (model) {
      model.dispose();
      this.modelCache.delete(modelKey);
    }
  }
  
  // Dispose of all cached models
  disposeAll(): void {
    for (const [key, model] of this.modelCache) {
      model.dispose();
    }
    this.modelCache.clear();
  }
}
