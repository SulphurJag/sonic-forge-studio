
import { toast } from "@/hooks/use-toast";

export abstract class BaseModel {
  protected modelName: string;
  protected model: any = null;
  protected isLoading: boolean = false;
  protected isInitialized: boolean = false;
  protected error: Error | null = null;
  
  constructor(modelName: string) {
    this.modelName = modelName;
  }
  
  // Abstract methods that must be implemented by subclasses
  abstract loadModel(): Promise<boolean>;
  abstract dispose(): void;
  
  // Common methods
  isReady(): boolean {
    return this.isInitialized && !this.isLoading && !this.error;
  }
  
  getError(): Error | null {
    return this.error;
  }
  
  protected setLoading(loading: boolean): void {
    this.isLoading = loading;
  }
  
  protected setInitialized(initialized: boolean): void {
    this.isInitialized = initialized;
  }
  
  protected setError(error: Error): void {
    this.error = error;
    console.error(`${this.modelName} error:`, error);
  }
  
  protected showToast(title: string, description: string, variant: "default" | "destructive" = "default"): void {
    toast({
      title,
      description,
      variant
    });
  }
  
  protected validateAudioBuffer(audioBuffer: AudioBuffer): boolean {
    if (!audioBuffer || audioBuffer.length === 0) {
      console.warn("Invalid audio buffer provided");
      return false;
    }
    return true;
  }
  
  protected async retryOperation<T>(operation: () => Promise<T>, retries: number = 3): Promise<T> {
    let lastError: Error;
    
    for (let i = 0; i < retries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
      }
    }
    
    throw lastError!;
  }
  
  // Default processAudio implementation that can be overridden
  async processAudio(audioBuffer: AudioBuffer, options?: any): Promise<AudioBuffer | string[]> {
    throw new Error(`processAudio not implemented for ${this.modelName}`);
  }
}
