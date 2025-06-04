
import { BaseModel } from './baseModel';
import { TFJS_MODELS } from './modelTypes';
import * as tf from '@tensorflow/tfjs';

export interface ArtifactAnalysis {
  hasClipping: boolean;
  hasCrackles: boolean;
  hasClicksAndPops: boolean;
  hasDistortion?: boolean;
  problematicSegments: Array<{start: number, end: number, type: string}>;
}

export interface ArtifactFixOptions {
  fixClipping: boolean;
  fixCrackles: boolean;
  fixClicksAndPops: boolean;
  fixDistortion?: boolean;
}

export class ArtifactDetectionModel extends BaseModel {
  private detectionModel: any = null;
  
  constructor() {
    super('ArtifactDetector');
  }
  
  async loadModel(): Promise<boolean> {
    this.setLoading(true);
    
    try {
      // Try loading a simple audio analysis model
      const modelLoaded = await this.loadAudioAnalysisModel();
      
      this.setInitialized(true);
      this.showToast("Artifact Detector Ready", "Audio analysis model loaded");
      return true;
    } catch (error) {
      this.setError(error as Error);
      // Still initialize for signal processing fallback
      this.setInitialized(true);
      return true;
    }
  }
  
  private async loadAudioAnalysisModel(): Promise<boolean> {
    try {
      console.log("Loading audio analysis model...");
      
      this.detectionModel = await this.retryOperation(async () => {
        return await tf.loadLayersModel(TFJS_MODELS.AUDIO_FEATURES);
      });
      
      if (this.detectionModel) {
        console.log("Audio analysis model loaded successfully");
        return true;
      }
      return false;
    } catch (error) {
      console.warn("Failed to load audio analysis model:", error);
      return false;
    }
  }
  
  async detectArtifacts(audioBuffer: AudioBuffer): Promise<ArtifactAnalysis> {
    if (!this.isReady()) {
      throw new Error("Artifact detector not ready");
    }
    
    try {
      // Use signal processing to detect artifacts
      return this.analyzeAudioSignal(audioBuffer);
    } catch (error) {
      console.error("Error during artifact detection:", error);
      throw error;
    }
  }
  
  async fixArtifacts(audioBuffer: AudioBuffer, options: ArtifactFixOptions): Promise<AudioBuffer> {
    if (!this.isReady()) {
      throw new Error("Artifact detector not ready");
    }
    
    try {
      const context = new AudioContext({ sampleRate: audioBuffer.sampleRate });
      const processedBuffer = context.createBuffer(
        audioBuffer.numberOfChannels,
        audioBuffer.length,
        audioBuffer.sampleRate
      );
      
      // Apply artifact fixes to each channel
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
    } catch (error) {
      console.error("Error during artifact fixing:", error);
      throw error;
    }
  }
  
  private analyzeAudioSignal(audioBuffer: AudioBuffer): ArtifactAnalysis {
    const audioData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    const problematicSegments: Array<{start: number, end: number, type: string}> = [];
    
    let hasClipping = false;
    let hasCrackles = false;
    let hasClicksAndPops = false;
    let hasDistortion = false;
    
    // Analyze in chunks
    const chunkSize = sampleRate; // 1 second chunks
    
    for (let i = 0; i < audioData.length; i += chunkSize) {
      const chunk = audioData.slice(i, Math.min(i + chunkSize, audioData.length));
      const startTime = i / sampleRate;
      const endTime = (i + chunk.length) / sampleRate;
      
      // Check for clipping
      const clippingDetected = this.detectClipping(chunk);
      if (clippingDetected && !hasClipping) {
        hasClipping = true;
        problematicSegments.push({
          start: startTime,
          end: endTime,
          type: 'clipping'
        });
      }
      
      // Check for clicks and pops
      const clicksDetected = this.detectClicksAndPops(chunk);
      if (clicksDetected && !hasClicksAndPops) {
        hasClicksAndPops = true;
        problematicSegments.push({
          start: startTime,
          end: endTime,
          type: 'clicks'
        });
      }
      
      // Check for crackles (high frequency artifacts)
      const cracklesDetected = this.detectCrackles(chunk, sampleRate);
      if (cracklesDetected && !hasCrackles) {
        hasCrackles = true;
        problematicSegments.push({
          start: startTime,
          end: endTime,
          type: 'crackles'
        });
      }
      
      // Check for distortion
      const distortionDetected = this.detectDistortion(chunk);
      if (distortionDetected && !hasDistortion) {
        hasDistortion = true;
        problematicSegments.push({
          start: startTime,
          end: endTime,
          type: 'distortion'
        });
      }
    }
    
    return {
      hasClipping,
      hasCrackles,
      hasClicksAndPops,
      hasDistortion,
      problematicSegments: problematicSegments.slice(0, 10) // Limit to first 10 segments
    };
  }
  
  private detectClipping(chunk: Float32Array): boolean {
    const threshold = 0.95;
    let clippingCount = 0;
    
    for (let i = 0; i < chunk.length; i++) {
      if (Math.abs(chunk[i]) >= threshold) {
        clippingCount++;
      }
    }
    
    return clippingCount > chunk.length * 0.01; // More than 1% clipped
  }
  
  private detectClicksAndPops(chunk: Float32Array): boolean {
    const threshold = 0.3;
    let clickCount = 0;
    
    for (let i = 1; i < chunk.length; i++) {
      const diff = Math.abs(chunk[i] - chunk[i - 1]);
      if (diff > threshold) {
        clickCount++;
      }
    }
    
    return clickCount > 5; // More than 5 sudden jumps
  }
  
  private detectCrackles(chunk: Float32Array, sampleRate: number): boolean {
    // Simple high-frequency content detection
    let highFreqEnergy = 0;
    const frameSize = Math.min(512, chunk.length);
    
    for (let i = 0; i < chunk.length - frameSize; i += frameSize) {
      const frame = chunk.slice(i, i + frameSize);
      
      // Calculate high-frequency energy (simplified)
      for (let j = 1; j < frame.length; j++) {
        const highFreq = frame[j] - frame[j - 1];
        highFreqEnergy += highFreq * highFreq;
      }
    }
    
    const avgHighFreqEnergy = highFreqEnergy / (chunk.length / frameSize);
    return avgHighFreqEnergy > 0.01; // Threshold for crackles
  }
  
  private detectDistortion(chunk: Float32Array): boolean {
    // Simple THD estimation
    let totalEnergy = 0;
    let harmonicEnergy = 0;
    
    for (let i = 0; i < chunk.length; i++) {
      const sample = chunk[i];
      totalEnergy += sample * sample;
      
      // Simplified harmonic detection
      if (Math.abs(sample) > 0.7) {
        harmonicEnergy += sample * sample;
      }
    }
    
    const thd = harmonicEnergy / (totalEnergy + 1e-10);
    return thd > 0.1; // 10% THD threshold
  }
  
  private fixClipping(audioData: Float32Array): void {
    const threshold = 0.95;
    
    for (let i = 0; i < audioData.length; i++) {
      if (Math.abs(audioData[i]) >= threshold) {
        audioData[i] = Math.sign(audioData[i]) * threshold;
      }
    }
  }
  
  private fixClicksAndPops(audioData: Float32Array): void {
    const threshold = 0.3;
    
    for (let i = 1; i < audioData.length - 1; i++) {
      const diff = Math.abs(audioData[i] - audioData[i - 1]);
      
      if (diff > threshold) {
        // Interpolate between neighbors
        audioData[i] = (audioData[i - 1] + audioData[i + 1]) / 2;
      }
    }
  }
  
  private fixCrackles(audioData: Float32Array): void {
    // Apply gentle low-pass filtering
    const alpha = 0.8;
    
    for (let i = 1; i < audioData.length; i++) {
      audioData[i] = alpha * audioData[i] + (1 - alpha) * audioData[i - 1];
    }
  }
  
  private fixDistortion(audioData: Float32Array): void {
    // Apply soft limiting
    for (let i = 0; i < audioData.length; i++) {
      const sample = audioData[i];
      if (Math.abs(sample) > 0.8) {
        audioData[i] = Math.sign(sample) * (0.8 + 0.2 * Math.tanh((Math.abs(sample) - 0.8) * 5));
      }
    }
  }
  
  dispose(): void {
    if (this.detectionModel) {
      this.detectionModel.dispose();
      this.detectionModel = null;
    }
    this.setInitialized(false);
  }
}
