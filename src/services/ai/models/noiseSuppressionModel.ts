
import { BaseModel } from './baseModel';
import { TFJS_MODELS, MODEL_CONFIGS } from './modelTypes';
import { AudioResamplingUtils } from './utils/audioResamplingUtils';
import * as tf from '@tensorflow/tfjs';

export class NoiseSuppressionModel extends BaseModel {
  private useWebGPU: boolean = false;
  
  constructor() {
    super('NoiseSuppression');
  }
  
  async loadModel(): Promise<boolean> {
    this.setLoading(true);
    
    try {
      // Try to load RNNoise model with fallback
      const modelLoaded = await this.loadRNNoiseModel();
      
      if (modelLoaded) {
        this.setInitialized(true);
        this.showToast("Noise Suppressor Ready", "RNNoise model loaded");
        return true;
      } else {
        // Fallback to simulation mode
        this.setInitialized(true);
        this.showToast("Noise Suppressor Ready", "Using fallback processing");
        return true;
      }
    } catch (error) {
      this.setError(error as Error);
      // Still mark as initialized to allow fallback processing
      this.setInitialized(true);
      return true;
    }
  }
  
  private async loadRNNoiseModel(): Promise<boolean> {
    return this.retryOperation(async () => {
      console.log("Loading RNNoise model...");
      this.model = await tf.loadLayersModel(TFJS_MODELS.RNNOISE);
      return !!this.model;
    });
  }
  
  async processAudio(audioBuffer: AudioBuffer, options?: {
    strategy?: 'auto' | 'rnnoise' | 'spectral' | 'wiener';
    intensity?: number;
    preserveTone?: boolean;
  }): Promise<AudioBuffer> {
    if (!this.isReady()) {
      console.warn("Noise suppressor not ready, returning original buffer");
      return audioBuffer;
    }
    
    try {
      // If we have a loaded model, use it
      if (this.model) {
        return await this.processWithModel(audioBuffer, options);
      } else {
        // Use fallback spectral gating
        return await this.processWithSpectralGating(audioBuffer, options);
      }
    } catch (error) {
      console.error("Noise suppression failed:", error);
      return audioBuffer;
    }
  }
  
  private async processWithModel(audioBuffer: AudioBuffer, options?: any): Promise<AudioBuffer> {
    let audioData = audioBuffer.getChannelData(0);
    
    // Resample if needed
    if (audioBuffer.sampleRate !== MODEL_CONFIGS.RNNOISE.sampleRate) {
      audioData = AudioResamplingUtils.resample(
        audioData, 
        audioBuffer.sampleRate, 
        MODEL_CONFIGS.RNNOISE.sampleRate
      );
    }
    
    // Process in frames
    const frameSize = MODEL_CONFIGS.RNNOISE.frameSize;
    const processedData = new Float32Array(audioData.length);
    
    for (let i = 0; i < audioData.length; i += frameSize) {
      const frame = audioData.slice(i, i + frameSize);
      if (frame.length === frameSize) {
        const inputTensor = tf.tensor2d([Array.from(frame)], [1, frameSize]);
        const output = this.model.predict(inputTensor) as tf.Tensor;
        const outputData = await output.data();
        
        processedData.set(new Float32Array(outputData), i);
        
        tf.dispose([inputTensor, output]);
      } else {
        processedData.set(frame, i);
      }
    }
    
    // Create new AudioBuffer
    const context = new AudioContext();
    const newBuffer = context.createBuffer(1, processedData.length, MODEL_CONFIGS.RNNOISE.sampleRate);
    newBuffer.copyToChannel(processedData, 0);
    
    return newBuffer;
  }
  
  private async processWithSpectralGating(audioBuffer: AudioBuffer, options?: any): Promise<AudioBuffer> {
    // Simple spectral gating implementation
    const audioData = audioBuffer.getChannelData(0);
    const intensity = (options?.intensity || 50) / 100;
    
    // Apply simple noise gate
    const threshold = 0.01 * (1 - intensity);
    const processedData = audioData.map(sample => 
      Math.abs(sample) > threshold ? sample : sample * 0.1
    );
    
    // Create new AudioBuffer
    const context = new AudioContext();
    const newBuffer = context.createBuffer(1, processedData.length, audioBuffer.sampleRate);
    newBuffer.copyToChannel(processedData, 0);
    
    return newBuffer;
  }
  
  dispose(): void {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
    this.setInitialized(false);
  }
}
