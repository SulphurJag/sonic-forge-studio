
import { toast } from "@/hooks/use-toast";

export interface ModelState {
  initialized: boolean;
  loading: boolean;
  error: Error | null;
}

export abstract class BaseModel {
  protected modelName: string;
  protected model: any = null;
  private state: ModelState = {
    initialized: false,
    loading: false,
    error: null
  };
  
  constructor(name: string) {
    this.modelName = name;
  }
  
  // Abstract methods that must be implemented by subclasses
  abstract loadModel(): Promise<boolean>;
  abstract processAudio(audioBuffer: AudioBuffer): Promise<any>;
  abstract dispose(): void;
  
  // Common state management methods
  protected setLoading(loading: boolean): void {
    this.state.loading = loading;
  }
  
  protected setInitialized(initialized: boolean): void {
    this.state.initialized = initialized;
    if (initialized) {
      this.state.error = null;
    }
  }
  
  protected setError(error: Error): void {
    this.state.error = error;
    this.state.loading = false;
    console.error(`${this.modelName} model error:`, error);
  }
  
  // Public state accessors
  isReady(): boolean {
    return this.state.initialized && !this.state.loading && !this.state.error;
  }
  
  isLoading(): boolean {
    return this.state.loading;
  }
  
  getError(): Error | null {
    return this.state.error;
  }
  
  getState(): ModelState {
    return { ...this.state };
  }
  
  // Utility methods
  protected showToast(title: string, description: string, variant: "default" | "destructive" = "default"): void {
    toast({
      title,
      description,
      variant
    });
  }
  
  protected async retryOperation<T>(operation: () => Promise<T>, maxRetries: number = 3, delay: number = 1000): Promise<T> {
    let lastError: Error;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        console.warn(`${this.modelName} operation failed (attempt ${i + 1}/${maxRetries}):`, error);
        
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
        }
      }
    }
    
    throw lastError!;
  }
  
  protected validateAudioBuffer(audioBuffer: AudioBuffer): boolean {
    if (!audioBuffer || audioBuffer.length === 0) {
      console.warn(`${this.modelName}: Invalid audio buffer`);
      return false;
    }
    
    if (audioBuffer.numberOfChannels === 0) {
      console.warn(`${this.modelName}: Audio buffer has no channels`);
      return false;
    }
    
    return true;
  }
}
