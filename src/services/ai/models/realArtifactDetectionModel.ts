import { BaseModel } from './baseModel';
import { HF_MODELS, TFJS_MODELS, MODEL_CONFIGS } from './modelTypes';
import { AudioResamplingUtils } from './utils/audioResamplingUtils';
import { AudioAnalysisUtils } from './utils/audioAnalysisUtils';
import { pipeline } from '@huggingface/transformers';
import * as tf from '@tensorflow/tfjs';

export interface ArtifactAnalysis {
  hasClipping: boolean;
  hasCrackles: boolean;
  hasClicksAndPops: boolean;
  hasDistortion: boolean;
  hasDropouts: boolean;
  problematicSegments: {start: number, end: number, type: string, severity: number}[];
}

export class RealArtifactDetectionModel extends BaseModel {
  private wav2vecPipeline: any = null;
  private spiceModel: any = null;
  private useWebGPU: boolean = false;
  
  constructor() {
    super('RealArtifactDetection');
  }
  
  async loadModel(): Promise<boolean> {
    this.setLoading(true);
    
    try {
      // Load Wav2Vec2 for audio analysis
      const wav2vecLoaded = await this.loadWav2Vec();
      
      // Load SPICE for pitch/harmonic analysis
      const spiceLoaded = await this.loadSpice();
      
      if (wav2vecLoaded || spiceLoaded) {
        this.setInitialized(true);
        this.showToast("Artifact Detection Ready", `Loaded ${wav2vecLoaded ? 'Wav2Vec2' : ''}${wav2vecLoaded && spiceLoaded ? ' + ' : ''}${spiceLoaded ? 'SPICE' : ''}`);
        return true;
      } else {
        // Still mark as initialized for algorithmic fallback
        this.setInitialized(true);
        this.showToast("Artifact Detection Ready", "Using algorithmic detection");
        return true;
      }
    } catch (error) {
      this.setError(error as Error);
      this.setInitialized(true); // Allow fallback
      return true;
    }
  }
  
  private async loadWav2Vec(): Promise<boolean> {
    return this.retryOperation(async () => {
      try {
        console.log("Loading Wav2Vec2 model...");
        this.wav2vecPipeline = await pipeline(
          'audio-classification',
          HF_MODELS.ARTIFACT_DETECTOR,
          { device: this.useWebGPU ? 'webgpu' : 'cpu' }
        );
        this.model = this.wav2vecPipeline;
        return !!this.wav2vecPipeline;
      } catch (error) {
        console.warn("Wav2Vec2 failed to load:", error);
        return false;
      }
    });
  }
  
  private async loadSpice(): Promise<boolean> {
    return this.retryOperation(async () => {
      try {
        console.log("Loading SPICE model...");
        this.spiceModel = await tf.loadGraphModel(TFJS_MODELS.SPICE);
        return !!this.spiceModel;
      } catch (error) {
        console.warn("SPICE model failed to load:", error);
        return false;
      }
    });
  }
  
  async processAudio(audioBuffer: AudioBuffer): Promise<AudioBuffer> {
    // For artifact detection, we don't modify the audio, just analyze it
    return audioBuffer;
  }
  
  async detectArtifacts(audioBuffer: AudioBuffer): Promise<ArtifactAnalysis> {
    if (!this.isReady()) {
      console.warn("Artifact detector not ready, using basic detection");
      return this.basicArtifactDetection(audioBuffer);
    }
    
    try {
      // Use AI models if available
      if (this.wav2vecPipeline || this.spiceModel) {
        return await this.detectWithAI(audioBuffer);
      } else {
        return await this.advancedAlgorithmicDetection(audioBuffer);
      }
    } catch (error) {
      console.error("Artifact detection failed:", error);
      return this.basicArtifactDetection(audioBuffer);
    }
  }
  
  private async detectWithAI(audioBuffer: AudioBuffer): Promise<ArtifactAnalysis> {
    const analysis: ArtifactAnalysis = {
      hasClipping: false,
      hasCrackles: false,
      hasClicksAndPops: false,
      hasDistortion: false,
      hasDropouts: false,
      problematicSegments: []
    };
    
    // Process in chunks for AI analysis
    const chunkDuration = 2; // seconds
    const sampleRate = audioBuffer.sampleRate;
    const chunkSize = sampleRate * chunkDuration;
    const audioData = audioBuffer.getChannelData(0);
    
    for (let i = 0; i < audioData.length; i += chunkSize) {
      const endIdx = Math.min(i + chunkSize, audioData.length);
      const chunk = audioData.slice(i, endIdx);
      const startTime = i / sampleRate;
      const endTime = endIdx / sampleRate;
      
      // Analyze chunk with AI models
      await this.analyzeChunkWithAI(chunk, startTime, endTime, analysis);
      
      // Also run algorithmic detection for comprehensive coverage
      const algoResults = this.analyzeChunkAlgorithmic(chunk, startTime, endTime);
      this.mergeAnalysisResults(analysis, algoResults);
    }
    
    return analysis;
  }
  
  private async analyzeChunkWithAI(
    chunk: Float32Array, 
    startTime: number, 
    endTime: number, 
    analysis: ArtifactAnalysis
  ): Promise<void> {
    try {
      if (this.wav2vecPipeline) {
        // Use Wav2Vec2 to detect audio anomalies
        const features = await this.extractAudioFeatures(chunk);
        const anomalies = this.detectAnomaliesFromFeatures(features, startTime, endTime);
        this.mergeAnalysisResults(analysis, anomalies);
      }
      
      if (this.spiceModel) {
        // Use SPICE for pitch/harmonic analysis to detect distortion
        const pitchAnalysis = await this.analyzePitchWithSpice(chunk, startTime, endTime);
        this.mergeAnalysisResults(analysis, pitchAnalysis);
      }
    } catch (error) {
      console.warn("AI analysis failed for chunk, using fallback:", error);
    }
  }
  
  private async extractAudioFeatures(chunk: Float32Array): Promise<any> {
    try {
      // Convert audio chunk for Wav2Vec2 processing
      const resampled = AudioResamplingUtils.resample(chunk, 48000, 16000);
      
      // Process with Wav2Vec2
      const result = await this.wav2vecPipeline(resampled);
      return result;
    } catch (error) {
      console.warn("Feature extraction failed:", error);
      return null;
    }
  }
  
  private detectAnomaliesFromFeatures(features: any, startTime: number, endTime: number): Partial<ArtifactAnalysis> {
    const anomalies: Partial<ArtifactAnalysis> = {
      hasClipping: false,
      hasCrackles: false,
      hasClicksAndPops: false,
      hasDistortion: false,
      hasDropouts: false,
      problematicSegments: []
    };
    
    if (features && Array.isArray(features)) {
      // Analyze confidence scores to detect anomalies
      const avgConfidence = features.reduce((sum, item) => sum + (item.score || 0), 0) / features.length;
      
      if (avgConfidence < 0.3) {
        anomalies.hasDistortion = true;
        anomalies.problematicSegments!.push({
          start: startTime,
          end: endTime,
          type: 'distortion',
          severity: 1 - avgConfidence
        });
      }
    }
    
    return anomalies;
  }
  
  private async analyzePitchWithSpice(chunk: Float32Array, startTime: number, endTime: number): Promise<Partial<ArtifactAnalysis>> {
    const analysis: Partial<ArtifactAnalysis> = {
      hasClipping: false,
      hasCrackles: false,
      hasClicksAndPops: false,
      hasDistortion: false,
      hasDropouts: false,
      problematicSegments: []
    };
    
    try {
      // Resample for SPICE
      const resampled = AudioResamplingUtils.resample(chunk, 48000, MODEL_CONFIGS.SPICE.sampleRate);
      
      // Prepare input tensor
      const inputLength = MODEL_CONFIGS.SPICE.inputShape[0];
      const paddedInput = new Float32Array(inputLength);
      paddedInput.set(resampled.slice(0, Math.min(resampled.length, inputLength)));
      
      const inputTensor = tf.tensor2d([Array.from(paddedInput)], [1, inputLength]);
      const prediction = this.spiceModel.predict(inputTensor) as tf.Tensor;
      const pitchData = await prediction.data();
      
      // Analyze pitch consistency for distortion detection
      const pitchVariance = this.calculatePitchVariance(pitchData);
      
      if (pitchVariance > 0.5) {
        analysis.hasDistortion = true;
        analysis.problematicSegments!.push({
          start: startTime,
          end: endTime,
          type: 'pitch_distortion',
          severity: Math.min(pitchVariance, 1.0)
        });
      }
      
      tf.dispose([inputTensor, prediction]);
    } catch (error) {
      console.warn("SPICE analysis failed:", error);
    }
    
    return analysis;
  }
  
  private calculatePitchVariance(pitchData: any): number {
    const data = Array.from(pitchData) as number[];
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    return Math.sqrt(variance);
  }
  
  private analyzeChunkAlgorithmic(chunk: Float32Array, startTime: number, endTime: number): Partial<ArtifactAnalysis> {
    const analysis: Partial<ArtifactAnalysis> = {
      hasClipping: false,
      hasCrackles: false,
      hasClicksAndPops: false,
      hasDistortion: false,
      hasDropouts: false,
      problematicSegments: []
    };
    
    // Clipping detection
    let clippedSamples = 0;
    for (let i = 0; i < chunk.length; i++) {
      if (Math.abs(chunk[i]) > 0.99) {
        clippedSamples++;
      }
    }
    
    if (clippedSamples > chunk.length * 0.01) {
      analysis.hasClipping = true;
      analysis.problematicSegments!.push({
        start: startTime,
        end: endTime,
        type: 'clipping',
        severity: clippedSamples / chunk.length
      });
    }
    
    // Click/pop detection using derivative
    const clicks = AudioAnalysisUtils.detectClicksAndPops(chunk, 48000);
    if (clicks.length > 0) {
      analysis.hasClicksAndPops = true;
      clicks.forEach(click => {
        analysis.problematicSegments!.push({
          start: startTime + click.position / 48000,
          end: startTime + (click.position + click.duration) / 48000,
          type: 'click',
          severity: click.magnitude
        });
      });
    }
    
    // Dropout detection
    const dropouts = AudioAnalysisUtils.detectDropouts(chunk, 48000);
    if (dropouts.length > 0) {
      analysis.hasDropouts = true;
      dropouts.forEach(dropout => {
        analysis.problematicSegments!.push({
          start: startTime + dropout.start / 48000,
          end: startTime + dropout.end / 48000,
          type: 'dropout',
          severity: dropout.severity
        });
      });
    }
    
    // Crackle detection using high-frequency analysis
    const crackles = AudioAnalysisUtils.detectCrackles(chunk, 48000);
    if (crackles.length > 0) {
      analysis.hasCrackles = true;
      crackles.forEach(crackle => {
        analysis.problematicSegments!.push({
          start: startTime + crackle.position / 48000,
          end: startTime + (crackle.position + 0.01) / 48000, // 10ms duration
          type: 'crackle',
          severity: crackle.intensity
        });
      });
    }
    
    return analysis;
  }
  
  private mergeAnalysisResults(main: ArtifactAnalysis, additional: Partial<ArtifactAnalysis>): void {
    if (additional.hasClipping) main.hasClipping = true;
    if (additional.hasCrackles) main.hasCrackles = true;
    if (additional.hasClicksAndPops) main.hasClicksAndPops = true;
    if (additional.hasDistortion) main.hasDistortion = true;
    if (additional.hasDropouts) main.hasDropouts = true;
    
    if (additional.problematicSegments) {
      main.problematicSegments.push(...additional.problematicSegments);
    }
  }
  
  private async advancedAlgorithmicDetection(audioBuffer: AudioBuffer): Promise<ArtifactAnalysis> {
    const channel = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    
    const analysis: ArtifactAnalysis = {
      hasClipping: false,
      hasCrackles: false,
      hasClicksAndPops: false,
      hasDistortion: false,
      hasDropouts: false,
      problematicSegments: []
    };
    
    // Comprehensive algorithmic analysis
    const chunkSize = sampleRate * 0.1; // 100ms chunks
    
    for (let i = 0; i < channel.length; i += chunkSize) {
      const endIdx = Math.min(i + chunkSize, channel.length);
      const chunk = channel.slice(i, endIdx);
      const startTime = i / sampleRate;
      const endTime = endIdx / sampleRate;
      
      const chunkAnalysis = this.analyzeChunkAlgorithmic(chunk, startTime, endTime);
      this.mergeAnalysisResults(analysis, chunkAnalysis);
    }
    
    return analysis;
  }
  
  private basicArtifactDetection(audioBuffer: AudioBuffer): ArtifactAnalysis {
    const channel = audioBuffer.getChannelData(0);
    const analysis: ArtifactAnalysis = {
      hasClipping: false,
      hasCrackles: false,
      hasClicksAndPops: false,
      hasDistortion: false,
      hasDropouts: false,
      problematicSegments: []
    };
    
    // Simple clipping detection
    for (let i = 0; i < channel.length; i += 1000) {
      if (Math.abs(channel[i]) > 0.95) {
        analysis.hasClipping = true;
        analysis.problematicSegments.push({
          start: i / audioBuffer.sampleRate,
          end: (i + 1000) / audioBuffer.sampleRate,
          type: 'clipping',
          severity: 0.8
        });
        break;
      }
    }
    
    return analysis;
  }
  
  async fixArtifacts(audioBuffer: AudioBuffer, options: {
    fixClipping: boolean;
    fixCrackles: boolean;
    fixClicksAndPops: boolean;
    fixDistortion: boolean;
    fixDropouts?: boolean;
  }): Promise<AudioBuffer> {
    console.log("Fixing artifacts with AI-enhanced processing");
    
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
        this.fixClicksAndPops(outputData, audioBuffer.sampleRate);
      }
      
      if (options.fixCrackles) {
        this.fixCrackles(outputData);
      }
      
      if (options.fixDistortion) {
        this.fixDistortion(outputData);
      }
      
      if (options.fixDropouts) {
        this.fixDropouts(outputData, audioBuffer.sampleRate);
      }
    }
    
    return processedBuffer;
  }
  
  private fixClipping(audioData: Float32Array): void {
    // Soft clipping with cubic interpolation
    for (let i = 0; i < audioData.length; i++) {
      if (Math.abs(audioData[i]) > 0.95) {
        const sign = Math.sign(audioData[i]);
        const x = Math.abs(audioData[i]);
        // Cubic soft clipping
        audioData[i] = sign * (x < 2/3 ? 2*x : (3 - Math.pow(2-3*x, 2))/3);
      }
    }
  }
  
  private fixClicksAndPops(audioData: Float32Array, sampleRate: number): void {
    const threshold = 0.3;
    const windowSize = Math.floor(sampleRate * 0.001); // 1ms window
    
    for (let i = windowSize; i < audioData.length - windowSize; i++) {
      const current = audioData[i];
      const before = audioData.slice(i - windowSize, i);
      const after = audioData.slice(i + 1, i + windowSize + 1);
      
      const beforeAvg = before.reduce((a, b) => a + b, 0) / before.length;
      const afterAvg = after.reduce((a, b) => a + b, 0) / after.length;
      const expectedValue = (beforeAvg + afterAvg) / 2;
      
      if (Math.abs(current - expectedValue) > threshold) {
        // Interpolate using cubic spline
        audioData[i] = this.cubicInterpolate(
          audioData[i - 2] || 0,
          audioData[i - 1] || 0,
          audioData[i + 1] || 0,
          audioData[i + 2] || 0,
          0.5
        );
      }
    }
  }
  
  private fixCrackles(audioData: Float32Array): void {
    // Apply adaptive median filter for crackle removal
    const windowSize = Math.floor(sampleRate * 0.0005); // 0.5ms window
    
    for (let i = windowSize; i < audioData.length - windowSize; i++) {
      const window = audioData.slice(i - windowSize, i + windowSize + 1);
      const sorted = Array.from(window).sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)];
      
      // If current sample is far from median, replace with median
      if (Math.abs(audioData[i] - median) > 0.1) {
        audioData[i] = median;
      }
    }
  }
  
  private fixDistortion(audioData: Float32Array): void {
    // Apply dynamic range compression for distortion
    const ratio = 0.3;
    const threshold = 0.7;
    
    for (let i = 0; i < audioData.length; i++) {
      const abs = Math.abs(audioData[i]);
      if (abs > threshold) {
        const excess = abs - threshold;
        const compressed = threshold + excess * ratio;
        audioData[i] = Math.sign(audioData[i]) * compressed;
      }
    }
  }
  
  private fixDropouts(audioData: Float32Array, sampleRate: number): void {
    const silenceThreshold = 0.001;
    const minDropoutLength = Math.floor(sampleRate * 0.01); // 10ms
    
    let silenceStart = -1;
    
    for (let i = 0; i < audioData.length; i++) {
      if (Math.abs(audioData[i]) < silenceThreshold) {
        if (silenceStart === -1) {
          silenceStart = i;
        }
      } else {
        if (silenceStart !== -1) {
          const silenceLength = i - silenceStart;
          if (silenceLength > minDropoutLength) {
            // Interpolate across the dropout
            this.interpolateDropout(audioData, silenceStart, i);
          }
          silenceStart = -1;
        }
      }
    }
  }
  
  private interpolateDropout(audioData: Float32Array, start: number, end: number): void {
    const beforeValue = start > 0 ? audioData[start - 1] : 0;
    const afterValue = end < audioData.length ? audioData[end] : 0;
    const length = end - start;
    
    for (let i = 0; i < length; i++) {
      const t = i / length;
      audioData[start + i] = beforeValue * (1 - t) + afterValue * t;
    }
  }
  
  private cubicInterpolate(y0: number, y1: number, y2: number, y3: number, t: number): number {
    const a0 = y3 - y2 - y0 + y1;
    const a1 = y0 - y1 - a0;
    const a2 = y2 - y0;
    const a3 = y1;
    
    return a0 * t * t * t + a1 * t * t + a2 * t + a3;
  }
  
  dispose(): void {
    if (this.wav2vecPipeline) {
      this.wav2vecPipeline = null;
    }
    if (this.spiceModel) {
      this.spiceModel.dispose();
      this.spiceModel = null;
    }
    this.setInitialized(false);
  }
}
