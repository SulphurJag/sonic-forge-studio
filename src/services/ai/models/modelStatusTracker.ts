
import { ModelStatus } from './modelTypes';

// Class to track model initialization and loading status
export class ModelStatusTracker {
  private modelStatus: Map<string, ModelStatus> = new Map();
  
  constructor(modelKeys: string[]) {
    modelKeys.forEach(key => {
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
  
  // Set model to loading state
  setLoading(modelKey: string): void {
    this.modelStatus.set(modelKey, {
      initialized: false,
      loading: true,
      error: null
    });
  }
  
  // Set model to initialized state
  setInitialized(modelKey: string): void {
    this.modelStatus.set(modelKey, {
      initialized: true,
      loading: false,
      error: null
    });
  }
  
  // Set model to error state
  setError(modelKey: string, error: string | Error): void {
    this.modelStatus.set(modelKey, {
      initialized: false,
      loading: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
