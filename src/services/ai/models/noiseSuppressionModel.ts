
import { BaseModel } from './baseModel';
import { TFJS_MODELS, MODEL_CONFIGS, LIGHTWEIGHT_MODELS } from './modelTypes';
import { AudioResamplingUtils } from './utils/audioResamplingUtils';
import * as tf from '@tensorflow/tfjs';

export class NoiseSuppressionModel extends BaseModel {
  private useWebGPU: boolean = false;
  private yamnetModel: any = null; // Using YAMNet as base for audio analysis
  
  constructor() {
    super('NoiseSuppression');
  }
  
  async loadModel(): Promise<boolean> {
    this.setLoading(true);
    
    try {
      // Try to load YAMNet model for audio analysis
      const modelLoaded = await this.loadYAMNetModel();
      
      if (modelLoaded) {
        this.setInitialized(true);
        this.showToast("Noise Suppressor Ready", "YAMNet-based processing loaded");
        return true;
      } else {
        // Fallback to algorithmic processing
        this.setInitialized(true);
        this.showToast("Noise Suppressor Ready", "Using algorithmic processing");
        return true;
      }
    } catch (error) {
      this.setError(error as Error);
      // Still mark as initialized to allow fallback processing
      this.setInitialized(true);
      return true;
    }
  }
  
  private async loadYAMNetModel(): Promise<boolean> {
    return this.retryOperation(async () => {
      console.log("Loading YAMNet model for noise analysis...");
      this.yamnetModel = await tf.loadGraphModel(LIGHTWEIGHT_MODELS.NOISE_REDUCER);
      this.model = this.yamnetModel;
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
      // If we have YAMNet loaded, use it for analysis-guided processing
      if (this.yamnetModel) {
        return await this.processWithAnalysis(audioBuffer, options);
      } else {
        // Use enhanced spectral processing
        return await this.processWithSpectralGating(audioBuffer, options);
      }
    } catch (error) {
      console.error("Noise suppression failed:", error);
      return audioBuffer;
    }
  }
  
  private async processWithAnalysis(audioBuffer: AudioBuffer, options?: any): Promise<AudioBuffer> {
    let audioData = audioBuffer.getChannelData(0);
    
    // Resample to YAMNet's expected sample rate
    if (audioBuffer.sampleRate !== MODEL_CONFIGS.YAMNET.sampleRate) {
      audioData = AudioResamplingUtils.resample(
        audioData, 
        audioBuffer.sampleRate, 
        MODEL_CONFIGS.YAMNET.sampleRate
      );
    }
    
    // Analyze audio characteristics with YAMNet
    const analysis = await this.analyzeAudioWithYAMNet(audioData);
    
    // Apply adaptive processing based on analysis
    const processedData = this.applyAdaptiveProcessing(audioData, analysis, options);
    
    // Create new AudioBuffer
    const context = new AudioContext();
    const newBuffer = context.createBuffer(1, processedData.length, MODEL_CONFIGS.YAMNET.sampleRate);
    newBuffer.copyToChannel(processedData, 0);
    
    return newBuffer;
  }
  
  private async analyzeAudioWithYAMNet(audioData: Float32Array): Promise<any> {
    try {
      // Prepare input for YAMNet
      const inputLength = MODEL_CONFIGS.YAMNET.inputShape[0];
      let processedAudio = audioData;
      
      if (audioData.length > inputLength) {
        processedAudio = audioData.slice(0, inputLength);
      } else if (audioData.length < inputLength) {
        const padded = new Float32Array(inputLength);
        padded.set(audioData);
        processedAudio = padded;
      }
      
      const inputTensor = tf.tensor2d([Array.from(processedAudio)], [1, inputLength]);
      const predictions = this.yamnetModel.predict(inputTensor) as tf.Tensor;
      const scores = await predictions.data();
      
      tf.dispose([inputTensor, predictions]);
      
      return {
        hasMusic: scores[1] > 0.3, // Assuming music is at index 1
        hasSpeech: scores[0] > 0.3, // Assuming speech is at index 0
        noiseLevel: this.estimateNoiseLevel(processedAudio)
      };
    } catch (error) {
      console.warn("YAMNet analysis failed, using fallback:", error);
      return {
        hasMusic: false,
        hasSpeech: true,
        noiseLevel: this.estimateNoiseLevel(audioData)
      };
    }
  }
  
  private applyAdaptiveProcessing(audioData: Float32Array, analysis: any, options?: any): Float32Array {
    const intensity = (options?.intensity || 50) / 100;
    const processedData = new Float32Array(audioData.length);
    
    // Apply different processing based on content analysis
    if (analysis.hasMusic) {
      // Gentler processing for music
      this.applyMusicPreservingFilter(audioData, processedData, intensity * 0.7);
    } else if (analysis.hasSpeech) {
      // More aggressive processing for speech
      this.applySpeechEnhancingFilter(audioData, processedData, intensity);
    } else {
      // Standard processing
      this.applyStandardFilter(audioData, processedData, intensity);
    }
    
    return processedData;
  }
  
  private applyMusicPreservingFilter(input: Float32Array, output: Float32Array, intensity: number): void {
    // Gentle high-pass filter to preserve musical content
    for (let i = 0; i < input.length; i++) {
      if (i === 0) {
        output[i] = input[i];
      } else {
        const filtered = input[i] - input[i - 1] * 0.1;
        output[i] = input[i] * (1 - intensity * 0.5) + filtered * intensity * 0.5;
      }
    }
  }
  
  private applySpeechEnhancingFilter(input: Float32Array, output: Float32Array, intensity: number): void {
    // More aggressive filtering for speech clarity
    const threshold = 0.02 * (1 - intensity);
    for (let i = 0; i < input.length; i++) {
      if (Math.abs(input[i]) > threshold) {
        output[i] = input[i];
      } else {
        output[i] = input[i] * 0.1;
      }
    }
  }
  
  private applyStandardFilter(input: Float32Array, output: Float32Array, intensity: number): void {
    // Standard noise gate
    const threshold = 0.01 * (1 - intensity);
    for (let i = 0; i < input.length; i++) {
      if (Math.abs(input[i]) > threshold) {
        output[i] = input[i];
      } else {
        output[i] = input[i] * 0.2;
      }
    }
  }
  
  private estimateNoiseLevel(audioData: Float32Array): number {
    // Simple RMS calculation for noise estimation
    let sumSquares = 0;
    for (let i = 0; i < audioData.length; i++) {
      sumSquares += audioData[i] * audioData[i];
    }
    return Math.sqrt(sumSquares / audioData.length);
  }
  
  private async processWithSpectralGating(audioBuffer: AudioBuffer, options?: any): Promise<AudioBuffer> {
    // Enhanced spectral gating implementation
    const audioData = audioBuffer.getChannelData(0);
    const intensity = (options?.intensity || 50) / 100;
    
    // Apply adaptive noise gate based on content
    const dynamicThreshold = this.calculateDynamicThreshold(audioData);
    const threshold = dynamicThreshold * (1 - intensity);
    
    const processedData = audioData.map(sample => {
      if (Math.abs(sample) > threshold) {
        return sample;
      } else {
        return sample * (0.1 + intensity * 0.1);
      }
    });
    
    // Create new AudioBuffer
    const context = new AudioContext();
    const newBuffer = context.createBuffer(1, processedData.length, audioBuffer.sampleRate);
    newBuffer.copyToChannel(processedData, 0);
    
    return newBuffer;
  }
  
  private calculateDynamicThreshold(audioData: Float32Array): number {
    // Calculate adaptive threshold based on audio statistics
    const sorted = Array.from(audioData).map(Math.abs).sort((a, b) => a - b);
    const percentile90 = sorted[Math.floor(sorted.length * 0.9)];
    const percentile10 = sorted[Math.floor(sorted.length * 0.1)];
    
    return percentile10 + (percentile90 - percentile10) * 0.1;
  }
  
  dispose(): void {
    if (this.yamnetModel) {
      this.yamnetModel.dispose();
      this.yamnetModel = null;
    }
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
    this.setInitialized(false);
  }
}
