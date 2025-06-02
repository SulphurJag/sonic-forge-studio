
import { AIAudioMasteringEngine } from './ai/aiAudioMasteringEngine';
import { AIAudioProcessingSettings } from './ai/mastering/types';

// Processing results interface
export interface ProcessingResults {
  inputLufs: number;
  outputLufs: number;
  inputPeak: number;
  outputPeak: number;
  noiseReduction: number;
  contentType?: string[];
  artifactsFound?: boolean;
}

// Audio processing settings interface
export interface AudioProcessingSettings {
  mode: string;
  targetLufs: number;
  dryWet: number;
  noiseReduction: number;
  beatQuantization?: number;
  swingPreservation?: boolean;
  preserveTempo?: boolean;
  preserveTone?: boolean;
  beatCorrectionMode?: string;
}

// Main audio processing service
class AudioProcessor {
  private audioContext: AudioContext | null = null;
  private currentAudioBuffer: AudioBuffer | null = null;
  private aiEngine: AIAudioMasteringEngine;
  private isInitialized: boolean = false;
  
  constructor() {
    this.aiEngine = new AIAudioMasteringEngine();
  }
  
  // Initialize the audio processor
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      this.audioContext = new AudioContext();
      console.log("Audio context initialized successfully");
      
      // Initialize AI engine in background
      this.aiEngine.initialize().catch(error => {
        console.warn("AI engine initialization failed:", error);
      });
      
      this.isInitialized = true;
    } catch (error) {
      console.error("Failed to initialize audio processor:", error);
      throw error;
    }
  }
  
  // Load audio file
  async loadAudio(file: File): Promise<void> {
    if (!this.audioContext) {
      throw new Error("Audio processor not initialized");
    }
    
    const arrayBuffer = await file.arrayBuffer();
    this.currentAudioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
  }
  
  // Check if audio is loaded
  isAudioLoaded(): boolean {
    return this.currentAudioBuffer !== null;
  }
  
  // Process audio with mastering
  async processAudio(settings: AudioProcessingSettings): Promise<ProcessingResults> {
    if (!this.currentAudioBuffer) {
      throw new Error("No audio loaded");
    }
    
    console.log("Processing audio with settings:", settings);
    
    // Convert settings to AI processing settings
    const aiSettings: AIAudioProcessingSettings = {
      enableNoiseReduction: settings.noiseReduction > 0,
      noiseReductionStrategy: 'auto',
      noiseReductionIntensity: settings.noiseReduction,
      preserveTone: settings.preserveTone ?? true,
      enableContentClassification: true,
      enableAutoProcessing: true,
      enableArtifactElimination: true
    };
    
    let processedBuffer = this.currentAudioBuffer;
    let contentType: string[] = [];
    let artifactsFound = false;
    
    // Try AI processing if available
    try {
      if (this.aiEngine.isReady()) {
        console.log("Using AI processing");
        const aiResult = await this.aiEngine.processAudio(this.currentAudioBuffer, aiSettings);
        processedBuffer = aiResult.processedBuffer;
        contentType = aiResult.contentType;
        artifactsFound = aiResult.artifactsFound;
      } else {
        console.log("AI engine not ready, using basic processing");
        processedBuffer = await this.basicProcessing(this.currentAudioBuffer, settings);
      }
    } catch (error) {
      console.warn("AI processing failed, falling back to basic processing:", error);
      processedBuffer = await this.basicProcessing(this.currentAudioBuffer, settings);
    }
    
    // Analyze the results
    const inputLufs = this.calculateLUFS(this.currentAudioBuffer);
    const outputLufs = this.calculateLUFS(processedBuffer);
    const inputPeak = this.calculatePeak(this.currentAudioBuffer);
    const outputPeak = this.calculatePeak(processedBuffer);
    
    return {
      inputLufs,
      outputLufs,
      inputPeak,
      outputPeak,
      noiseReduction: settings.noiseReduction,
      contentType,
      artifactsFound
    };
  }
  
  // Basic audio processing fallback
  private async basicProcessing(audioBuffer: AudioBuffer, settings: AudioProcessingSettings): Promise<AudioBuffer> {
    if (!this.audioContext) {
      throw new Error("Audio context not available");
    }
    
    const outputBuffer = this.audioContext.createBuffer(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );
    
    // Apply basic gain adjustment based on target LUFS
    const gainAdjustment = this.calculateGainAdjustment(settings.targetLufs);
    
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const inputData = audioBuffer.getChannelData(channel);
      const outputData = outputBuffer.getChannelData(channel);
      
      for (let i = 0; i < inputData.length; i++) {
        outputData[i] = inputData[i] * gainAdjustment;
        // Simple limiter
        if (outputData[i] > 0.95) outputData[i] = 0.95;
        if (outputData[i] < -0.95) outputData[i] = -0.95;
      }
    }
    
    return outputBuffer;
  }
  
  // Get processed file
  async getProcessedFile(originalFile: File): Promise<File> {
    if (!this.currentAudioBuffer || !this.audioContext) {
      throw new Error("No processed audio available");
    }
    
    // Create a simple WAV file from the processed buffer
    const wavData = this.audioBufferToWav(this.currentAudioBuffer);
    const blob = new Blob([wavData], { type: 'audio/wav' });
    
    const processedFileName = originalFile.name.replace(/\.[^/.]+$/, '') + '_mastered.wav';
    return new File([blob], processedFileName, { type: 'audio/wav' });
  }
  
  // Helper: Calculate LUFS (simplified)
  private calculateLUFS(audioBuffer: AudioBuffer): number {
    let sum = 0;
    let sampleCount = 0;
    
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      for (let i = 0; i < channelData.length; i++) {
        sum += channelData[i] * channelData[i];
        sampleCount++;
      }
    }
    
    const rms = Math.sqrt(sum / sampleCount);
    return 20 * Math.log10(rms) - 0.691; // Rough LUFS approximation
  }
  
  // Helper: Calculate peak
  private calculatePeak(audioBuffer: AudioBuffer): number {
    let peak = 0;
    
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      for (let i = 0; i < channelData.length; i++) {
        peak = Math.max(peak, Math.abs(channelData[i]));
      }
    }
    
    return 20 * Math.log10(peak);
  }
  
  // Helper: Calculate gain adjustment
  private calculateGainAdjustment(targetLufs: number): number {
    if (!this.currentAudioBuffer) return 1;
    
    const currentLufs = this.calculateLUFS(this.currentAudioBuffer);
    const lufsAdjustment = targetLufs - currentLufs;
    return Math.pow(10, lufsAdjustment / 20);
  }
  
  // Helper: Convert AudioBuffer to WAV
  private audioBufferToWav(audioBuffer: AudioBuffer): ArrayBuffer {
    const length = audioBuffer.length * audioBuffer.numberOfChannels * 2;
    const buffer = new ArrayBuffer(44 + length);
    const view = new DataView(buffer);
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, audioBuffer.numberOfChannels, true);
    view.setUint32(24, audioBuffer.sampleRate, true);
    view.setUint32(28, audioBuffer.sampleRate * audioBuffer.numberOfChannels * 2, true);
    view.setUint16(32, audioBuffer.numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length, true);
    
    // Convert float samples to 16-bit PCM
    let offset = 44;
    for (let i = 0; i < audioBuffer.length; i++) {
      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(channel)[i]));
        view.setInt16(offset, sample * 0x7FFF, true);
        offset += 2;
      }
    }
    
    return buffer;
  }
  
  // Dispose resources
  dispose(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.currentAudioBuffer = null;
    this.aiEngine.dispose();
    this.isInitialized = false;
  }
}

// Export singleton instance
export const audioProcessor = new AudioProcessor();
export type { ProcessingResults, AudioProcessingSettings };
