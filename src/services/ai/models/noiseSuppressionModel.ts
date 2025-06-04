
import { BaseModel } from './baseModel';
import { TFJS_MODELS, HF_MODELS, MODEL_CONFIGS } from './modelTypes';
import * as tf from '@tensorflow/tfjs';

export interface NoiseSuppressionOptions {
  strategy: 'auto' | 'rnnoise' | 'spectral' | 'wiener';
  intensity: number; // 0-100
  preserveTone: boolean;
}

export class NoiseSuppressionModel extends BaseModel {
  private rnnModel: any = null;
  private useWebGPU: boolean = false;
  
  constructor() {
    super('NoiseSuppression');
  }
  
  async loadModel(): Promise<boolean> {
    this.setLoading(true);
    
    try {
      this.useWebGPU = await this.checkWebGPUSupport();
      
      // Try loading RNNoise model
      const rnnLoaded = await this.loadRNNoiseModel();
      
      if (rnnLoaded) {
        this.setInitialized(true);
        this.showToast("Noise Suppression Ready", "RNNoise model loaded");
        return true;
      } else {
        // Even if model loading fails, we can use spectral filtering
        this.setInitialized(true);
        this.showToast("Noise Suppression Ready", "Using spectral filtering");
        return true;
      }
    } catch (error) {
      this.setError(error as Error);
      // Still initialize for spectral filtering fallback
      this.setInitialized(true);
      return true;
    }
  }
  
  private async loadRNNoiseModel(): Promise<boolean> {
    try {
      console.log("Loading RNNoise model...");
      
      this.rnnModel = await this.retryOperation(async () => {
        return await tf.loadLayersModel(TFJS_MODELS.SPECTRAL_DENOISER);
      });
      
      if (this.rnnModel) {
        console.log("RNNoise model loaded successfully");
        return true;
      }
      return false;
    } catch (error) {
      console.warn("Failed to load RNNoise model:", error);
      return false;
    }
  }
  
  async processAudio(audioBuffer: AudioBuffer, options: NoiseSuppressionOptions): Promise<AudioBuffer> {
    if (!this.isReady()) {
      throw new Error("Noise suppression not ready");
    }
    
    try {
      const context = new AudioContext({ sampleRate: audioBuffer.sampleRate });
      let processedBuffer: AudioBuffer;
      
      // Choose processing method based on strategy and model availability
      if (options.strategy === 'rnnoise' && this.rnnModel) {
        processedBuffer = await this.processWithRNNoise(audioBuffer, options, context);
      } else if (options.strategy === 'wiener') {
        processedBuffer = await this.processWithWienerFilter(audioBuffer, options, context);
      } else {
        processedBuffer = await this.processWithSpectralFiltering(audioBuffer, options, context);
      }
      
      return processedBuffer;
    } catch (error) {
      console.error("Error during noise suppression:", error);
      throw error;
    }
  }
  
  private async processWithRNNoise(
    audioBuffer: AudioBuffer, 
    options: NoiseSuppressionOptions, 
    context: AudioContext
  ): Promise<AudioBuffer> {
    const frameSize = MODEL_CONFIGS.RNNOISE.frameSize;
    const processedBuffer = context.createBuffer(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );
    
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const inputData = audioBuffer.getChannelData(channel);
      const outputData = processedBuffer.getChannelData(channel);
      
      // Process in frames
      for (let i = 0; i < inputData.length; i += frameSize) {
        const endIdx = Math.min(i + frameSize, inputData.length);
        const frameLength = endIdx - i;
        
        // Prepare frame
        const frame = new Float32Array(frameSize);
        frame.set(inputData.slice(i, endIdx));
        
        // Process with RNNoise
        const inputTensor = tf.tensor2d([Array.from(frame)], [1, frameSize]);
        const outputTensor = this.rnnModel.predict(inputTensor) as tf.Tensor;
        const processedFrame = await outputTensor.data();
        
        // Apply with intensity mixing
        const intensity = options.intensity / 100;
        for (let j = 0; j < frameLength; j++) {
          const original = inputData[i + j];
          const processed = processedFrame[j];
          outputData[i + j] = original * (1 - intensity) + processed * intensity;
        }
        
        // Clean up tensors
        tf.dispose([inputTensor, outputTensor]);
      }
    }
    
    return processedBuffer;
  }
  
  private async processWithWienerFilter(
    audioBuffer: AudioBuffer,
    options: NoiseSuppressionOptions,
    context: AudioContext
  ): Promise<AudioBuffer> {
    const processedBuffer = context.createBuffer(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );
    
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const inputData = audioBuffer.getChannelData(channel);
      const outputData = processedBuffer.getChannelData(channel);
      
      // Estimate noise from first 0.5 seconds
      const noiseEstimationLength = Math.min(audioBuffer.sampleRate * 0.5, inputData.length);
      const noiseVariance = this.estimateNoiseVariance(inputData.slice(0, noiseEstimationLength));
      
      // Apply Wiener filtering
      const fftSize = 2048;
      const hopSize = fftSize / 4;
      const window = this.createHanningWindow(fftSize);
      
      for (let i = 0; i < inputData.length - fftSize; i += hopSize) {
        const frame = inputData.slice(i, i + fftSize);
        const windowedFrame = frame.map((sample, idx) => sample * window[idx]);
        
        // Apply Wiener filter
        const filteredFrame = this.applyWienerFilter(windowedFrame, noiseVariance, options.intensity);
        
        // Overlap-add
        for (let j = 0; j < filteredFrame.length; j++) {
          if (i + j < outputData.length) {
            outputData[i + j] += filteredFrame[j] * window[j];
          }
        }
      }
      
      // Normalize output
      this.normalizeAudio(outputData);
    }
    
    return processedBuffer;
  }
  
  private async processWithSpectralFiltering(
    audioBuffer: AudioBuffer,
    options: NoiseSuppressionOptions,
    context: AudioContext
  ): Promise<AudioBuffer> {
    const processedBuffer = context.createBuffer(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );
    
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const inputData = audioBuffer.getChannelData(channel);
      const outputData = processedBuffer.getChannelData(channel);
      
      // Apply adaptive spectral subtraction
      const fftSize = 2048;
      const hopSize = fftSize / 4;
      const window = this.createHanningWindow(fftSize);
      
      for (let i = 0; i < inputData.length - fftSize; i += hopSize) {
        const frame = inputData.slice(i, i + fftSize);
        const windowedFrame = frame.map((sample, idx) => sample * window[idx]);
        
        // Apply spectral subtraction
        const processedFrame = this.applySpectralSubtraction(
          windowedFrame, 
          options.intensity,
          options.preserveTone
        );
        
        // Overlap-add
        for (let j = 0; j < processedFrame.length; j++) {
          if (i + j < outputData.length) {
            outputData[i + j] += processedFrame[j] * window[j];
          }
        }
      }
      
      // Normalize output
      this.normalizeAudio(outputData);
    }
    
    return processedBuffer;
  }
  
  private estimateNoiseVariance(noiseSegment: Float32Array): number {
    const mean = noiseSegment.reduce((sum, val) => sum + val, 0) / noiseSegment.length;
    const variance = noiseSegment.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / noiseSegment.length;
    return Math.max(variance, 1e-10); // Avoid division by zero
  }
  
  private applyWienerFilter(frame: Float32Array, noiseVariance: number, intensity: number): Float32Array {
    const result = new Float32Array(frame.length);
    const alpha = intensity / 100;
    
    for (let i = 0; i < frame.length; i++) {
      const signalPower = frame[i] * frame[i];
      const wienerGain = Math.max(0, (signalPower - noiseVariance) / (signalPower + 1e-10));
      const filteredSample = frame[i] * wienerGain;
      result[i] = frame[i] * (1 - alpha) + filteredSample * alpha;
    }
    
    return result;
  }
  
  private applySpectralSubtraction(frame: Float32Array, intensity: number, preserveTone: boolean): Float32Array {
    const result = new Float32Array(frame.length);
    const alpha = intensity / 100;
    
    // Simple high-pass filtering approach
    for (let i = 0; i < frame.length; i++) {
      if (i === 0) {
        result[i] = frame[i] * (1 - alpha * 0.3);
      } else {
        const highPassComponent = frame[i] - frame[i - 1] * 0.95;
        const processed = preserveTone ? 
          frame[i] * (1 - alpha * 0.5) + highPassComponent * alpha * 0.3 :
          frame[i] * (1 - alpha) + highPassComponent * alpha;
        result[i] = processed;
      }
    }
    
    return result;
  }
  
  private createHanningWindow(size: number): Float32Array {
    const window = new Float32Array(size);
    for (let i = 0; i < size; i++) {
      window[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (size - 1)));
    }
    return window;
  }
  
  private normalizeAudio(audioData: Float32Array): void {
    const maxValue = Math.max(...Array.from(audioData).map(Math.abs));
    if (maxValue > 0) {
      const scale = 0.95 / maxValue;
      for (let i = 0; i < audioData.length; i++) {
        audioData[i] *= scale;
      }
    }
  }
  
  private async checkWebGPUSupport(): Promise<boolean> {
    try {
      if (!('gpu' in navigator)) return false;
      const adapter = await (navigator as any).gpu?.requestAdapter();
      return !!adapter;
    } catch {
      return false;
    }
  }
  
  dispose(): void {
    if (this.rnnModel) {
      this.rnnModel.dispose();
      this.rnnModel = null;
    }
    this.setInitialized(false);
  }
}
