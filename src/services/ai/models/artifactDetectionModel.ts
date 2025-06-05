import { BaseModel } from './baseModel';
import { TFJS_MODELS, MODEL_CONFIGS, LIGHTWEIGHT_MODELS } from './modelTypes';
import { AudioResamplingUtils } from './utils/audioResamplingUtils';
import * as tf from '@tensorflow/tfjs';

export class ArtifactDetectionModel extends BaseModel {
  private spiceModel: any = null;
  private useWebGPU: boolean = false;
  
  constructor() {
    super('ArtifactDetection');
  }
  
  // Implement required processAudio method from BaseModel
  async processAudio(audioBuffer: AudioBuffer): Promise<AudioBuffer> {
    // For artifact detection, we don't modify the audio, just detect issues
    return audioBuffer;
  }
  
  async loadModel(): Promise<boolean> {
    this.setLoading(true);
    
    try {
      // Try to load SPICE model for pitch/artifact analysis
      const modelLoaded = await this.loadSpiceModel();
      
      if (modelLoaded) {
        this.setInitialized(true);
        this.showToast("Artifact Detector Ready", "SPICE model loaded");
        return true;
      } else {
        // Fallback to algorithmic detection
        this.setInitialized(true);
        this.showToast("Artifact Detector Ready", "Using algorithmic detection");
        return true;
      }
    } catch (error) {
      this.setError(error as Error);
      // Still mark as initialized to allow fallback processing
      this.setInitialized(true);
      return true;
    }
  }
  
  private async loadSpiceModel(): Promise<boolean> {
    return this.retryOperation(async () => {
      console.log("Loading SPICE model for artifact detection...");
      this.spiceModel = await tf.loadGraphModel(TFJS_MODELS.SPICE);
      this.model = this.spiceModel;
      return !!this.model;
    });
  }
  
  async detectArtifacts(audioBuffer: AudioBuffer): Promise<{
    hasClipping: boolean;
    hasCrackles: boolean;
    hasClicksAndPops: boolean;
    hasDistortion: boolean;
    problematicSegments: {start: number, end: number, type: string}[]
  }> {
    if (!this.isReady()) {
      console.warn("Artifact detector not ready, using basic detection");
      return this.basicArtifactDetection(audioBuffer);
    }
    
    try {
      if (this.spiceModel) {
        return await this.detectWithSpice(audioBuffer);
      } else {
        return await this.advancedAlgorithmicDetection(audioBuffer);
      }
    } catch (error) {
      console.error("Artifact detection failed:", error);
      return this.basicArtifactDetection(audioBuffer);
    }
  }
  
  private async detectWithSpice(audioBuffer: AudioBuffer): Promise<any> {
    let audioData = audioBuffer.getChannelData(0);
    
    // Resample for SPICE if needed
    if (audioBuffer.sampleRate !== MODEL_CONFIGS.SPICE.sampleRate) {
      audioData = AudioResamplingUtils.resample(
        audioData, 
        audioBuffer.sampleRate, 
        MODEL_CONFIGS.SPICE.sampleRate
      );
    }
    
    const result = {
      hasClipping: false,
      hasCrackles: false,
      hasClicksAndPops: false,
      hasDistortion: false,
      problematicSegments: [] as {start: number, end: number, type: string}[]
    };
    
    // Process in chunks for SPICE analysis
    const chunkSize = MODEL_CONFIGS.SPICE.inputShape[0];
    const chunks = Math.ceil(audioData.length / chunkSize);
    
    for (let i = 0; i < chunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, audioData.length);
      const chunk = audioData.slice(start, end);
      
      // Pad chunk if necessary
      const paddedChunk = new Float32Array(chunkSize);
      paddedChunk.set(chunk);
      
      try {
        // Analyze with SPICE
        const inputTensor = tf.tensor2d([Array.from(paddedChunk)], [1, chunkSize]);
        const prediction = this.spiceModel.predict(inputTensor) as tf.Tensor;
        const analysis = await prediction.data();
        
        // Interpret SPICE output for artifact detection
        const artifacts = this.interpretSpiceOutput(analysis, start / audioBuffer.sampleRate, end / audioBuffer.sampleRate);
        
        if (artifacts.hasClipping) result.hasClipping = true;
        if (artifacts.hasCrackles) result.hasCrackles = true;
        if (artifacts.hasClicksAndPops) result.hasClicksAndPops = true;
        if (artifacts.hasDistortion) result.hasDistortion = true;
        
        result.problematicSegments.push(...artifacts.segments);
        
        tf.dispose([inputTensor, prediction]);
      } catch (error) {
        console.warn("SPICE analysis failed for chunk, using fallback:", error);
        // Fallback to basic detection for this chunk
        const basicResult = this.analyzeChunkBasic(chunk, start / audioBuffer.sampleRate);
        if (basicResult.hasArtifacts) {
          result.problematicSegments.push(...basicResult.segments);
        }
      }
    }
    
    return result;
  }
  
  private interpretSpiceOutput(spiceData: any, startTime: number, endTime: number): any {
    // SPICE outputs pitch confidence - low confidence might indicate artifacts
    const confidence = Array.from(spiceData) as number[];
    const avgConfidence = confidence.reduce((a, b) => a + b, 0) / confidence.length;
    
    const result = {
      hasClipping: false,
      hasCrackles: false,
      hasClicksAndPops: false,
      hasDistortion: false,
      segments: [] as {start: number, end: number, type: string}[]
    };
    
    // Low pitch confidence often indicates artifacts
    if (avgConfidence < 0.3) {
      result.hasDistortion = true;
      result.segments.push({
        start: startTime,
        end: endTime,
        type: 'distortion'
      });
    }
    
    // Analyze confidence variations for clicks/pops
    let previousConf = confidence[0];
    for (let i = 1; i < confidence.length; i++) {
      const currentConf = confidence[i];
      const diff = Math.abs(currentConf - previousConf);
      
      if (diff > 0.5) {
        result.hasClicksAndPops = true;
        const segmentStart = startTime + ((i - 1) / confidence.length) * (endTime - startTime);
        const segmentEnd = startTime + ((i + 1) / confidence.length) * (endTime - startTime);
        result.segments.push({
          start: segmentStart,
          end: segmentEnd,
          type: 'click'
        });
      }
      
      previousConf = currentConf;
    }
    
    return result;
  }
  
  private async advancedAlgorithmicDetection(audioBuffer: AudioBuffer): Promise<any> {
    const channel = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    
    const result = {
      hasClipping: false,
      hasCrackles: false,
      hasClicksAndPops: false,
      hasDistortion: false,
      problematicSegments: [] as {start: number, end: number, type: string}[]
    };
    
    // Advanced clipping detection
    let consecutiveClipped = 0;
    for (let i = 0; i < channel.length; i++) {
      if (Math.abs(channel[i]) > 0.99) {
        consecutiveClipped++;
        if (consecutiveClipped > 10) { // Multiple consecutive clipped samples
          result.hasClipping = true;
          result.problematicSegments.push({
            start: (i - consecutiveClipped) / sampleRate,
            end: i / sampleRate,
            type: 'clipping'
          });
          consecutiveClipped = 0;
        }
      } else {
        consecutiveClipped = 0;
      }
    }
    
    // Advanced click/pop detection using derivative
    const windowSize = Math.floor(sampleRate * 0.001); // 1ms window
    for (let i = windowSize; i < channel.length - windowSize; i++) {
      const before = channel.slice(i - windowSize, i);
      const after = channel.slice(i, i + windowSize);
      
      const beforeAvg = before.reduce((a, b) => a + b, 0) / before.length;
      const afterAvg = after.reduce((a, b) => a + b, 0) / after.length;
      
      if (Math.abs(afterAvg - beforeAvg) > 0.3) {
        result.hasClicksAndPops = true;
        result.problematicSegments.push({
          start: (i - windowSize) / sampleRate,
          end: (i + windowSize) / sampleRate,
          type: 'click'
        });
        i += windowSize; // Skip ahead to avoid duplicate detection
      }
    }
    
    // Distortion detection using harmonic analysis
    const fftSize = 2048;
    for (let i = 0; i < channel.length - fftSize; i += fftSize / 2) {
      const segment = channel.slice(i, i + fftSize);
      const thd = this.calculateTHD(segment);
      
      if (thd > 0.1) { // 10% THD threshold
        result.hasDistortion = true;
        result.problematicSegments.push({
          start: i / sampleRate,
          end: (i + fftSize) / sampleRate,
          type: 'distortion'
        });
      }
    }
    
    // Crackle detection using high-frequency energy
    const crackleResult = this.detectCrackles(channel, sampleRate);
    if (crackleResult.detected) {
      result.hasCrackles = true;
      result.problematicSegments.push(...crackleResult.segments);
    }
    
    return result;
  }
  
  private calculateTHD(signal: Float32Array): number {
    // Simplified THD calculation
    const fft = this.simpleFFT(signal);
    const fundamental = Math.max(...fft.slice(0, fft.length / 8));
    const harmonics = fft.slice(fft.length / 8).reduce((a, b) => a + b * b, 0);
    
    return Math.sqrt(harmonics) / fundamental;
  }
  
  private simpleFFT(signal: Float32Array): Float32Array {
    // Very simplified FFT approximation for demonstration
    const result = new Float32Array(signal.length / 2);
    for (let i = 0; i < result.length; i++) {
      let real = 0, imag = 0;
      for (let j = 0; j < signal.length; j++) {
        const angle = -2 * Math.PI * i * j / signal.length;
        real += signal[j] * Math.cos(angle);
        imag += signal[j] * Math.sin(angle);
      }
      result[i] = Math.sqrt(real * real + imag * imag);
    }
    return result;
  }
  
  private detectCrackles(channel: Float32Array, sampleRate: number): {detected: boolean, segments: any[]} {
    // Detect high-frequency transients that indicate crackles
    const segments = [];
    const windowSize = Math.floor(sampleRate * 0.01); // 10ms windows
    
    for (let i = 0; i < channel.length - windowSize; i += windowSize / 2) {
      const window = channel.slice(i, i + windowSize);
      const highFreqEnergy = this.calculateHighFrequencyEnergy(window);
      
      if (highFreqEnergy > 0.01) {
        segments.push({
          start: i / sampleRate,
          end: (i + windowSize) / sampleRate,
          type: 'crackle'
        });
      }
    }
    
    return {
      detected: segments.length > 0,
      segments: segments
    };
  }
  
  private calculateHighFrequencyEnergy(signal: Float32Array): number {
    // Calculate energy in high frequency components
    let energy = 0;
    for (let i = 1; i < signal.length; i++) {
      const diff = signal[i] - signal[i - 1];
      energy += diff * diff;
    }
    return energy / signal.length;
  }
  
  private analyzeChunkBasic(chunk: Float32Array, startTime: number): {hasArtifacts: boolean, segments: any[]} {
    const segments = [];
    let hasArtifacts = false;
    
    // Basic clipping check
    for (let i = 0; i < chunk.length; i++) {
      if (Math.abs(chunk[i]) > 0.95) {
        hasArtifacts = true;
        segments.push({
          start: startTime + (i / chunk.length) * 0.1,
          end: startTime + ((i + 10) / chunk.length) * 0.1,
          type: 'clipping'
        });
        break;
      }
    }
    
    return { hasArtifacts, segments };
  }
  
  private basicArtifactDetection(audioBuffer: AudioBuffer): any {
    const channel = audioBuffer.getChannelData(0);
    const problematicSegments = [];
    
    // Basic clipping detection
    let hasClipping = false;
    for (let i = 0; i < channel.length; i += 100) {
      if (Math.abs(channel[i]) > 0.95) {
        hasClipping = true;
        problematicSegments.push({
          start: i / audioBuffer.sampleRate,
          end: (i + 1000) / audioBuffer.sampleRate,
          type: 'clipping'
        });
        break;
      }
    }
    
    return {
      hasClipping,
      hasCrackles: false,
      hasClicksAndPops: false,
      hasDistortion: false,
      problematicSegments: problematicSegments.slice(0, 3)
    };
  }
  
  async fixArtifacts(audioBuffer: AudioBuffer, options: {
    fixClipping: boolean;
    fixCrackles: boolean;
    fixClicksAndPops: boolean;
    fixDistortion: boolean;
  }): Promise<AudioBuffer> {
    const context = new AudioContext();
    const processedBuffer = context.createBuffer(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );
    
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const inputData = audioBuffer.getChannelData(channel);
      const outputData = processedBuffer.getChannelData(channel);
      
      // Copy original data
      outputData.set(inputData);
      
      // Apply fixes based on options
      if (options.fixClipping) {
        this.fixClipping(outputData);
      }
      
      if (options.fixClicksAndPops) {
        this.fixClicksAndPops(outputData);
      }
      
      if (options.fixCrackles) {
        this.fixCrackles(outputData);
      }
      
      if (options.fixDistortion) {
        this.fixDistortion(outputData);
      }
    }
    
    return processedBuffer;
  }
  
  private fixClipping(audioData: Float32Array): void {
    for (let i = 0; i < audioData.length; i++) {
      if (Math.abs(audioData[i]) > 0.95) {
        audioData[i] = Math.sign(audioData[i]) * 0.95;
      }
    }
  }
  
  private fixClicksAndPops(audioData: Float32Array): void {
    const threshold = 0.3;
    for (let i = 1; i < audioData.length - 1; i++) {
      const prev = audioData[i - 1];
      const curr = audioData[i];
      const next = audioData[i + 1];
      
      if (Math.abs(curr - prev) > threshold && Math.abs(curr - next) > threshold) {
        // Interpolate
        audioData[i] = (prev + next) / 2;
      }
    }
  }
  
  private fixCrackles(audioData: Float32Array): void {
    // Simple smoothing filter
    for (let i = 1; i < audioData.length - 1; i++) {
      audioData[i] = (audioData[i - 1] + audioData[i] + audioData[i + 1]) / 3;
    }
  }
  
  private fixDistortion(audioData: Float32Array): void {
    // Simple soft limiting
    for (let i = 0; i < audioData.length; i++) {
      const x = audioData[i];
      audioData[i] = Math.sign(x) * (1 - Math.exp(-Math.abs(x))) * 0.8;
    }
  }
  
  dispose(): void {
    if (this.spiceModel) {
      this.spiceModel.dispose();
      this.spiceModel = null;
    }
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
    this.setInitialized(false);
  }
}
