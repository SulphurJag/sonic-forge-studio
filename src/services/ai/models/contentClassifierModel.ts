import { BaseModel } from './baseModel';
import { TFJS_MODELS, HF_MODELS, MODEL_CONFIGS } from './modelTypes';
import { pipeline } from '@huggingface/transformers';
import * as tf from '@tensorflow/tfjs';

export class ContentClassifierModel extends BaseModel {
  private whisperPipeline: any = null;
  private yamnetModel: any = null;
  private useWebGPU: boolean = false;
  
  constructor() {
    super('ContentClassifier');
  }
  
  async loadModel(): Promise<boolean> {
    this.setLoading(true);
    
    try {
      // Check WebGPU support
      this.useWebGPU = await this.checkWebGPUSupport();
      
      // Try loading Whisper model first
      const whisperLoaded = await this.loadWhisperModel();
      
      // Try loading YAMNet as backup
      const yamnetLoaded = await this.loadYAMNetModel();
      
      if (whisperLoaded || yamnetLoaded) {
        this.setInitialized(true);
        this.showToast(
          "Content Classifier Ready", 
          `Loaded with ${whisperLoaded ? 'Whisper' : 'YAMNet'}`
        );
        return true;
      } else {
        throw new Error("Failed to load any content classification model");
      }
    } catch (error) {
      this.setError(error as Error);
      return false;
    }
  }
  
  private async loadWhisperModel(): Promise<boolean> {
    try {
      console.log("Loading Whisper model for content classification...");
      
      // Properly typed pipeline options
      const pipelineOptions = {
        device: this.useWebGPU ? 'webgpu' as const : 'cpu' as const,
        dtype: this.useWebGPU ? 'fp16' as const : 'fp32' as const
      };
      
      this.whisperPipeline = await this.retryOperation(async () => {
        return await pipeline(
          "automatic-speech-recognition",
          "onnx-community/whisper-tiny.en",
          pipelineOptions
        );
      });
      
      if (this.whisperPipeline) {
        console.log("Whisper model loaded successfully");
        return true;
      }
      return false;
    } catch (error) {
      console.warn("Failed to load Whisper model:", error);
      return false;
    }
  }
  
  private async loadYAMNetModel(): Promise<boolean> {
    try {
      console.log("Loading YAMNet model...");
      
      this.yamnetModel = await this.retryOperation(async () => {
        return await tf.loadGraphModel(TFJS_MODELS.YAMNET);
      });
      
      if (this.yamnetModel) {
        console.log("YAMNet model loaded successfully");
        return true;
      }
      return false;
    } catch (error) {
      console.warn("Failed to load YAMNet model:", error);
      return false;
    }
  }
  
  async processAudio(audioBuffer: AudioBuffer): Promise<string[]> {
    if (!this.isReady()) {
      throw new Error("Content classifier not ready");
    }
    
    try {
      let classifications: string[] = [];
      
      // Try Whisper first
      if (this.whisperPipeline) {
        classifications = await this.processWithWhisper(audioBuffer);
      }
      // Fallback to YAMNet
      else if (this.yamnetModel) {
        classifications = await this.processWithYAMNet(audioBuffer);
      }
      
      // Ensure we have at least one classification
      if (classifications.length === 0) {
        classifications = this.analyzeAudioCharacteristics(audioBuffer);
      }
      
      return classifications;
    } catch (error) {
      console.error("Error during content classification:", error);
      return this.analyzeAudioCharacteristics(audioBuffer);
    }
  }
  
  private async processWithWhisper(audioBuffer: AudioBuffer): Promise<string[]> {
    try {
      // Convert to the format Whisper expects
      const audioData = audioBuffer.getChannelData(0);
      
      const result = await this.whisperPipeline(audioData, {
        sampling_rate: audioBuffer.sampleRate,
        return_timestamps: false,
        language: 'en'
      });
      
      if (result?.text) {
        return this.extractContentFromText(result.text);
      }
      return [];
    } catch (error) {
      console.error("Whisper processing failed:", error);
      return [];
    }
  }
  
  private async processWithYAMNet(audioBuffer: AudioBuffer): Promise<string[]> {
    try {
      // Resample to 16kHz if needed
      let audioData = audioBuffer.getChannelData(0);
      if (audioBuffer.sampleRate !== MODEL_CONFIGS.YAMNET.sampleRate) {
        audioData = this.resampleAudio(audioData, audioBuffer.sampleRate, MODEL_CONFIGS.YAMNET.sampleRate);
      }
      
      // Ensure correct input length
      const inputLength = MODEL_CONFIGS.YAMNET.inputShape[0];
      if (audioData.length > inputLength) {
        audioData = audioData.slice(0, inputLength);
      } else if (audioData.length < inputLength) {
        const padded = new Float32Array(inputLength);
        padded.set(audioData);
        audioData = padded;
      }
      
      // Create tensor and predict
      const inputTensor = tf.tensor2d([Array.from(audioData)], [1, inputLength]);
      const predictions = this.yamnetModel.predict(inputTensor) as tf.Tensor;
      const scores = await predictions.data();
      
      // Get top predictions
      const topClasses = this.getTopYAMNetClasses(new Float32Array(scores));
      
      // Clean up tensors
      tf.dispose([inputTensor, predictions]);
      
      return topClasses;
    } catch (error) {
      console.error("YAMNet processing failed:", error);
      return [];
    }
  }
  
  private extractContentFromText(text: string): string[] {
    const classifications: string[] = [];
    const lowerText = text.toLowerCase();
    
    // Keyword-based classification
    const keywords = {
      music: ['music', 'song', 'melody', 'rhythm', 'beat', 'tune'],
      speech: ['speech', 'talk', 'conversation', 'speaking', 'voice'],
      vocals: ['singing', 'vocal', 'singer', 'chorus'],
      instrumental: ['guitar', 'piano', 'drum', 'instrument']
    };
    
    for (const [category, words] of Object.entries(keywords)) {
      if (words.some(word => lowerText.includes(word))) {
        classifications.push(category);
      }
    }
    
    return classifications.length > 0 ? classifications : ['audio'];
  }
  
  private getTopYAMNetClasses(scores: Float32Array): string[] {
    // YAMNet class mapping (simplified)
    const classMapping: Record<number, string> = {
      0: 'speech',
      1: 'music',
      2: 'vocals',
      3: 'instrumental',
      4: 'percussion'
    };
    
    const topIndices = Array.from(scores)
      .map((score, index) => ({ score, index }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(item => item.index);
    
    return topIndices
      .map(index => classMapping[index % Object.keys(classMapping).length])
      .filter(Boolean);
  }
  
  private analyzeAudioCharacteristics(audioBuffer: AudioBuffer): string[] {
    const audioData = audioBuffer.getChannelData(0);
    const classifications: string[] = [];
    
    // Simple frequency analysis
    const nyquist = audioBuffer.sampleRate / 2;
    let lowEnergyRatio = 0;
    let midEnergyRatio = 0;
    let highEnergyRatio = 0;
    
    // Basic spectral analysis
    const frameSize = 1024;
    for (let i = 0; i < audioData.length - frameSize; i += frameSize) {
      const frame = audioData.slice(i, i + frameSize);
      const energy = frame.reduce((sum, sample) => sum + sample * sample, 0);
      
      if (energy > 0.001) {
        // Simplified frequency band analysis
        if (i / audioData.length < 0.3) lowEnergyRatio += energy;
        else if (i / audioData.length < 0.7) midEnergyRatio += energy;
        else highEnergyRatio += energy;
      }
    }
    
    const totalEnergy = lowEnergyRatio + midEnergyRatio + highEnergyRatio;
    if (totalEnergy > 0) {
      lowEnergyRatio /= totalEnergy;
      midEnergyRatio /= totalEnergy;
      highEnergyRatio /= totalEnergy;
      
      if (midEnergyRatio > 0.5) classifications.push('speech');
      if (highEnergyRatio > 0.3) classifications.push('music');
      if (lowEnergyRatio > 0.4) classifications.push('bass_heavy');
    }
    
    return classifications.length > 0 ? classifications : ['audio'];
  }
  
  private resampleAudio(audioData: Float32Array, fromRate: number, toRate: number): Float32Array {
    const ratio = fromRate / toRate;
    const newLength = Math.round(audioData.length / ratio);
    const result = new Float32Array(newLength);
    
    for (let i = 0; i < newLength; i++) {
      const srcIndex = i * ratio;
      const srcIndexFloor = Math.floor(srcIndex);
      const srcIndexCeil = Math.min(Math.ceil(srcIndex), audioData.length - 1);
      const fraction = srcIndex - srcIndexFloor;
      
      result[i] = audioData[srcIndexFloor] * (1 - fraction) + audioData[srcIndexCeil] * fraction;
    }
    
    return result;
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
    if (this.yamnetModel) {
      this.yamnetModel.dispose();
      this.yamnetModel = null;
    }
    
    this.whisperPipeline = null;
    this.setInitialized(false);
  }
}
