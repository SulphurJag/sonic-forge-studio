
import { BaseModel } from './baseModel';

export interface ArtifactAnalysis {
  hasClipping: boolean;
  hasCrackles: boolean;
  hasClicksAndPops: boolean;
  hasDistortion: boolean;
  clippingPercentage: number;
  crackleIntensity: number;
  popCount: number;
}

export interface ArtifactFixOptions {
  fixClipping: boolean;
  fixCrackles: boolean;
  fixClicksAndPops: boolean;
  fixDistortion: boolean;
}

export class ArtifactDetectionModel extends BaseModel {
  constructor() {
    super('ArtifactDetection');
  }
  
  async loadModel(): Promise<boolean> {
    this.setLoading(true);
    
    try {
      // This model uses signal processing algorithms, no ML model needed
      this.setInitialized(true);
      this.showToast("Artifact Detection Ready", "Using signal processing algorithms");
      return true;
    } catch (error) {
      this.setError(error as Error);
      return false;
    }
  }
  
  async detectArtifacts(audioBuffer: AudioBuffer): Promise<ArtifactAnalysis> {
    if (!this.isReady()) {
      throw new Error("Artifact detection not ready");
    }
    
    try {
      const analysis: ArtifactAnalysis = {
        hasClipping: false,
        hasCrackles: false,
        hasClicksAndPops: false,
        hasDistortion: false,
        clippingPercentage: 0,
        crackleIntensity: 0,
        popCount: 0
      };
      
      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        const channelData = audioBuffer.getChannelData(channel);
        
        // Detect clipping
        const clippingData = this.detectClipping(channelData);
        analysis.hasClipping = analysis.hasClipping || clippingData.hasClipping;
        analysis.clippingPercentage = Math.max(analysis.clippingPercentage, clippingData.percentage);
        
        // Detect crackles
        const crackleData = this.detectCrackles(channelData, audioBuffer.sampleRate);
        analysis.hasCrackles = analysis.hasCrackles || crackleData.hasCrackles;
        analysis.crackleIntensity = Math.max(analysis.crackleIntensity, crackleData.intensity);
        
        // Detect clicks and pops
        const popData = this.detectClicksAndPops(channelData, audioBuffer.sampleRate);
        analysis.hasClicksAndPops = analysis.hasClicksAndPops || popData.hasClicksAndPops;
        analysis.popCount += popData.count;
        
        // Detect distortion
        const distortionData = this.detectDistortion(channelData);
        analysis.hasDistortion = analysis.hasDistortion || distortionData.hasDistortion;
      }
      
      return analysis;
    } catch (error) {
      console.error("Error during artifact detection:", error);
      throw error;
    }
  }
  
  async fixArtifacts(audioBuffer: AudioBuffer, options: ArtifactFixOptions): Promise<AudioBuffer> {
    if (!this.isReady()) {
      throw new Error("Artifact detection not ready");
    }
    
    try {
      const context = new AudioContext({ sampleRate: audioBuffer.sampleRate });
      const fixedBuffer = context.createBuffer(
        audioBuffer.numberOfChannels,
        audioBuffer.length,
        audioBuffer.sampleRate
      );
      
      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        const inputData = audioBuffer.getChannelData(channel);
        const outputData = fixedBuffer.getChannelData(channel);
        
        // Copy input to output initially
        outputData.set(inputData);
        
        // Apply fixes in sequence
        if (options.fixClipping) {
          this.fixClipping(outputData);
        }
        
        if (options.fixCrackles) {
          this.fixCrackles(outputData, audioBuffer.sampleRate);
        }
        
        if (options.fixClicksAndPops) {
          this.fixClicksAndPops(outputData, audioBuffer.sampleRate);
        }
        
        if (options.fixDistortion) {
          this.fixDistortion(outputData);
        }
      }
      
      return fixedBuffer;
    } catch (error) {
      console.error("Error during artifact fixing:", error);
      throw error;
    }
  }
  
  private detectClipping(audioData: Float32Array): { hasClipping: boolean; percentage: number } {
    let clippedSamples = 0;
    const threshold = 0.99; // 99% of full scale
    
    for (let i = 0; i < audioData.length; i++) {
      if (Math.abs(audioData[i]) >= threshold) {
        clippedSamples++;
      }
    }
    
    const percentage = (clippedSamples / audioData.length) * 100;
    return {
      hasClipping: percentage > 0.1, // More than 0.1% clipped samples
      percentage
    };
  }
  
  private detectCrackles(audioData: Float32Array, sampleRate: number): { hasCrackles: boolean; intensity: number } {
    const frameSize = Math.floor(sampleRate * 0.01); // 10ms frames
    let crackleIntensity = 0;
    
    for (let i = 0; i < audioData.length - frameSize; i += frameSize) {
      const frame = audioData.slice(i, i + frameSize);
      
      // Calculate frame energy
      const energy = frame.reduce((sum, sample) => sum + sample * sample, 0) / frame.length;
      
      // Calculate zero-crossing rate
      let crossings = 0;
      for (let j = 1; j < frame.length; j++) {
        if ((frame[j] >= 0) !== (frame[j - 1] >= 0)) {
          crossings++;
        }
      }
      const zcr = crossings / frame.length;
      
      // High ZCR with moderate energy indicates crackles
      if (zcr > 0.3 && energy > 0.001 && energy < 0.1) {
        crackleIntensity += zcr * energy;
      }
    }
    
    return {
      hasCrackles: crackleIntensity > 0.05,
      intensity: crackleIntensity
    };
  }
  
  private detectClicksAndPops(audioData: Float32Array, sampleRate: number): { hasClicksAndPops: boolean; count: number } {
    let popCount = 0;
    const threshold = 0.1; // Threshold for sudden changes
    
    // Look for sudden amplitude changes
    for (let i = 1; i < audioData.length - 1; i++) {
      const prev = audioData[i - 1];
      const curr = audioData[i];
      const next = audioData[i + 1];
      
      // Check for sudden spikes
      const leftDiff = Math.abs(curr - prev);
      const rightDiff = Math.abs(next - curr);
      
      if (leftDiff > threshold && rightDiff > threshold && 
          Math.sign(curr - prev) !== Math.sign(next - curr)) {
        popCount++;
        i += Math.floor(sampleRate * 0.001); // Skip ahead 1ms to avoid multiple detections
      }
    }
    
    return {
      hasClicksAndPops: popCount > 0,
      count: popCount
    };
  }
  
  private detectDistortion(audioData: Float32Array): { hasDistortion: boolean } {
    // Simple THD estimation using harmonic analysis
    const frameSize = 2048;
    let totalDistortion = 0;
    let frameCount = 0;
    
    for (let i = 0; i < audioData.length - frameSize; i += frameSize) {
      const frame = audioData.slice(i, i + frameSize);
      
      // Calculate RMS and peak
      const rms = Math.sqrt(frame.reduce((sum, x) => sum + x * x, 0) / frame.length);
      const peak = Math.max(...Array.from(frame).map(Math.abs));
      
      // Crest factor indicates distortion when unusually low
      if (rms > 0) {
        const crestFactor = peak / rms;
        if (crestFactor < 2) { // Heavily compressed/distorted signal
          totalDistortion += (2 - crestFactor);
        }
      }
      frameCount++;
    }
    
    const avgDistortion = totalDistortion / frameCount;
    return { hasDistortion: avgDistortion > 0.2 };
  }
  
  private fixClipping(audioData: Float32Array): void {
    const threshold = 0.95;
    
    for (let i = 0; i < audioData.length; i++) {
      if (Math.abs(audioData[i]) >= threshold) {
        // Soft limiting
        const sign = Math.sign(audioData[i]);
        audioData[i] = sign * (threshold - (1 - threshold) * Math.exp(-(Math.abs(audioData[i]) - threshold) / (1 - threshold)));
      }
    }
  }
  
  private fixCrackles(audioData: Float32Array, sampleRate: number): void {
    const windowSize = Math.floor(sampleRate * 0.005); // 5ms window
    
    for (let i = windowSize; i < audioData.length - windowSize; i++) {
      const window = audioData.slice(i - windowSize, i + windowSize + 1);
      const median = this.calculateMedian(window);
      const deviation = Math.abs(audioData[i] - median);
      
      // If sample deviates significantly from local median, replace it
      if (deviation > 0.1) {
        audioData[i] = median;
      }
    }
  }
  
  private fixClicksAndPops(audioData: Float32Array, sampleRate: number): void {
    const threshold = 0.1;
    
    for (let i = 1; i < audioData.length - 1; i++) {
      const prev = audioData[i - 1];
      const curr = audioData[i];
      const next = audioData[i + 1];
      
      // Detect sudden spikes
      const leftDiff = Math.abs(curr - prev);
      const rightDiff = Math.abs(next - curr);
      
      if (leftDiff > threshold && rightDiff > threshold && 
          Math.sign(curr - prev) !== Math.sign(next - curr)) {
        // Replace with interpolated value
        audioData[i] = (prev + next) / 2;
      }
    }
  }
  
  private fixDistortion(audioData: Float32Array): void {
    // Apply gentle compression to reduce distortion
    for (let i = 0; i < audioData.length; i++) {
      const abs = Math.abs(audioData[i]);
      if (abs > 0.7) {
        const sign = Math.sign(audioData[i]);
        // Soft compression above 70%
        const compressed = 0.7 + (abs - 0.7) * 0.3;
        audioData[i] = sign * Math.min(compressed, 0.95);
      }
    }
  }
  
  private calculateMedian(values: Float32Array): number {
    const sorted = Array.from(values).sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  }
  
  async processAudio(audioBuffer: AudioBuffer, options?: any): Promise<any> {
    return this.detectArtifacts(audioBuffer);
  }
  
  dispose(): void {
    this.setInitialized(false);
  }
}
