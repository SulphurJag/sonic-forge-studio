
import { BaseModel } from './baseModel';
import { TFJS_MODELS } from './modelTypes';
import * as tf from '@tensorflow/tfjs';

export interface ArtifactAnalysis {
  hasClipping: boolean;
  hasCrackles: boolean;
  hasClicksAndPops: boolean;
  hasDistortion?: boolean;
}

export class ArtifactDetectionModel extends BaseModel {
  constructor() {
    super('ArtifactDetector');
  }
  
  async loadModel(): Promise<boolean> {
    this.setLoading(true);
    
    try {
      // Try to load audio analysis model with fallback
      const modelLoaded = await this.loadAudioAnalysisModel();
      
      if (modelLoaded) {
        this.setInitialized(true);
        this.showToast("Artifact Detector Ready", "Audio analysis model loaded");
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
  
  private async loadAudioAnalysisModel(): Promise<boolean> {
    return this.retryOperation(async () => {
      console.log("Loading audio analysis model...");
      this.model = await tf.loadLayersModel(TFJS_MODELS.SPICE);
      return !!this.model;
    });
  }
  
  async detectArtifacts(audioBuffer: AudioBuffer): Promise<ArtifactAnalysis> {
    if (!this.isReady()) {
      return {
        hasClipping: false,
        hasCrackles: false,
        hasClicksAndPops: false,
        hasDistortion: false
      };
    }
    
    return this.detectArtifactsAlgorithmic(audioBuffer);
  }
  
  private detectArtifactsAlgorithmic(audioBuffer: AudioBuffer): ArtifactAnalysis {
    const audioData = audioBuffer.getChannelData(0);
    let hasClipping = false;
    let hasCrackles = false;
    let hasClicksAndPops = false;
    
    // Detect clipping
    const clippingThreshold = 0.99;
    for (let i = 0; i < audioData.length; i++) {
      if (Math.abs(audioData[i]) >= clippingThreshold) {
        hasClipping = true;
        break;
      }
    }
    
    // Detect sudden amplitude changes (clicks/pops)
    const clickThreshold = 0.5;
    for (let i = 1; i < audioData.length; i++) {
      const diff = Math.abs(audioData[i] - audioData[i - 1]);
      if (diff > clickThreshold) {
        hasClicksAndPops = true;
        break;
      }
    }
    
    // Simple crackle detection (high frequency noise)
    const windowSize = 512;
    for (let i = 0; i < audioData.length - windowSize; i += windowSize) {
      const window = audioData.slice(i, i + windowSize);
      const energy = window.reduce((sum, sample) => sum + sample * sample, 0);
      const avgEnergy = energy / windowSize;
      
      if (avgEnergy > 0.1) {
        // Check for irregular patterns
        let irregularityCount = 0;
        for (let j = 1; j < window.length; j++) {
          if (Math.abs(window[j] - window[j - 1]) > 0.05) {
            irregularityCount++;
          }
        }
        
        if (irregularityCount > windowSize * 0.3) {
          hasCrackles = true;
          break;
        }
      }
    }
    
    return {
      hasClipping,
      hasCrackles,
      hasClicksAndPops,
      hasDistortion: hasClipping || hasCrackles
    };
  }
  
  async fixArtifacts(audioBuffer: AudioBuffer, options: {
    fixClipping?: boolean;
    fixCrackles?: boolean;
    fixClicksAndPops?: boolean;
    fixDistortion?: boolean;
  }): Promise<AudioBuffer> {
    const audioData = audioBuffer.getChannelData(0).slice();
    
    if (options.fixClipping) {
      this.fixClipping(audioData);
    }
    
    if (options.fixClicksAndPops) {
      this.fixClicksAndPops(audioData);
    }
    
    if (options.fixCrackles) {
      this.fixCrackles(audioData);
    }
    
    // Create new AudioBuffer
    const context = new AudioContext();
    const newBuffer = context.createBuffer(1, audioData.length, audioBuffer.sampleRate);
    newBuffer.copyToChannel(audioData, 0);
    
    return newBuffer;
  }
  
  private fixClipping(audioData: Float32Array): void {
    const clippingThreshold = 0.95;
    for (let i = 0; i < audioData.length; i++) {
      if (Math.abs(audioData[i]) >= clippingThreshold) {
        // Soft limiting
        audioData[i] = Math.sign(audioData[i]) * clippingThreshold;
      }
    }
  }
  
  private fixClicksAndPops(audioData: Float32Array): void {
    const clickThreshold = 0.3;
    for (let i = 1; i < audioData.length - 1; i++) {
      const diff = Math.abs(audioData[i] - audioData[i - 1]);
      if (diff > clickThreshold) {
        // Interpolate the problematic sample
        audioData[i] = (audioData[i - 1] + audioData[i + 1]) / 2;
      }
    }
  }
  
  private fixCrackles(audioData: Float32Array): void {
    // Simple median filter for crackle reduction
    const windowSize = 5;
    const halfWindow = Math.floor(windowSize / 2);
    
    for (let i = halfWindow; i < audioData.length - halfWindow; i++) {
      const window = [];
      for (let j = -halfWindow; j <= halfWindow; j++) {
        window.push(audioData[i + j]);
      }
      
      window.sort((a, b) => a - b);
      audioData[i] = window[halfWindow]; // median value
    }
  }
  
  async processAudio(audioBuffer: AudioBuffer): Promise<ArtifactAnalysis> {
    return this.detectArtifacts(audioBuffer);
  }
  
  dispose(): void {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
    this.setInitialized(false);
  }
}
