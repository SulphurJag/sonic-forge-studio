
import { ModelStatus } from './modelTypes';
import { toast } from "@/hooks/use-toast";

export abstract class BaseModel {
  protected modelStatus: ModelStatus = {
    initialized: false,
    loading: false,
    error: null
  };
  
  protected model: any = null;
  protected modelKey: string;
  
  constructor(modelKey: string) {
    this.modelKey = modelKey;
  }
  
  // Abstract methods that must be implemented
  abstract loadModel(): Promise<boolean>;
  abstract processAudio(audioBuffer: AudioBuffer, options?: any): Promise<AudioBuffer | any>;
  abstract dispose(): void;
  
  // Common status methods
  isReady(): boolean {
    return this.modelStatus.initialized && !this.modelStatus.loading && !this.modelStatus.error;
  }
  
  isLoading(): boolean {
    return this.modelStatus.loading;
  }
  
  getStatus(): ModelStatus {
    return { ...this.modelStatus };
  }
  
  getError(): string | null {
    return this.modelStatus.error;
  }
  
  // Protected helper methods
  protected setLoading(loading: boolean): void {
    this.modelStatus.loading = loading;
    if (loading) {
      this.modelStatus.error = null;
    }
  }
  
  protected setInitialized(initialized: boolean): void {
    this.modelStatus.initialized = initialized;
    this.modelStatus.loading = false;
  }
  
  protected setError(error: string | Error): void {
    this.modelStatus.error = error instanceof Error ? error.message : error;
    this.modelStatus.loading = false;
    this.modelStatus.initialized = false;
    
    console.error(`Model ${this.modelKey} error:`, error);
  }
  
  protected showToast(title: string, description: string, variant: "default" | "destructive" = "default"): void {
    toast({ title, description, variant });
  }
  
  // Retry mechanism
  protected async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T | null> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        console.warn(`Attempt ${attempt}/${maxRetries} failed:`, error);
        if (attempt === maxRetries) {
          this.setError(error as Error);
          return null;
        }
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
    return null;
  }
}
