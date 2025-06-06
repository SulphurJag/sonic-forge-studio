
import { BaseModel } from './baseModel';
import { WhisperProcessor } from './processors/whisperProcessor';
import { YAMNetProcessor } from './processors/yamnetProcessor';
import { AudioAnalysisUtils } from './utils/audioAnalysisUtils';
import { WebGpuUtils } from './utils/webGpuUtils';

export class ContentClassifierModel extends BaseModel {
  private whisperProcessor: WhisperProcessor;
  private yamnetProcessor: YAMNetProcessor;
  private useWebGPU: boolean = false;
  
  constructor() {
    super('ContentClassifier');
    this.whisperProcessor = new WhisperProcessor();
    this.yamnetProcessor = new YAMNetProcessor();
  }
  
  async loadModel(): Promise<boolean> {
    this.setLoading(true);
    
    try {
      this.useWebGPU = await WebGpuUtils.checkSupport();
      
      // Try to load models in order of preference
      const yamnetLoaded = await this.yamnetProcessor.initialize();
      let whisperLoaded = false;
      
      if (this.useWebGPU) {
        whisperLoaded = await this.whisperProcessor.initialize();
      }
      
      if (yamnetLoaded || whisperLoaded) {
        this.setInitialized(true);
        this.showToast(
          "Content Classifier Ready", 
          `Loaded with ${yamnetLoaded ? 'YAMNet' : 'Whisper'} (${this.useWebGPU ? 'WebGPU' : 'CPU'})`
        );
        return true;
      } else {
        // Use fallback analysis
        this.setInitialized(true);
        this.showToast(
          "Content Classifier Ready", 
          "Using algorithmic analysis"
        );
        return true;
      }
    } catch (error) {
      console.warn("Content classifier initialization error:", error);
      // Still mark as initialized to allow fallback processing
      this.setInitialized(true);
      this.showToast(
        "Content Classifier Ready", 
        "Using basic analysis",
        "default"
      );
      return true;
    } finally {
      this.setLoading(false);
    }
  }
  
  // Implement the required processAudio method from BaseModel
  async processAudio(audioBuffer: AudioBuffer): Promise<string[]> {
    if (!this.validateAudioBuffer(audioBuffer)) {
      return ['invalid'];
    }
    
    try {
      let classifications: string[] = [];
      
      // Try YAMNet first (more reliable)
      if (this.yamnetProcessor.isReady()) {
        classifications = await this.yamnetProcessor.process(audioBuffer);
      } 
      // Then try Whisper
      else if (this.whisperProcessor.isReady()) {
        classifications = await this.whisperProcessor.process(audioBuffer);
      }
      
      // Fallback to algorithmic analysis
      if (classifications.length === 0) {
        classifications = AudioAnalysisUtils.analyzeCharacteristics(audioBuffer);
      }
      
      return classifications;
    } catch (error) {
      console.error("Error during content classification:", error);
      // Always provide fallback
      return AudioAnalysisUtils.analyzeCharacteristics(audioBuffer);
    }
  }
  
  dispose(): void {
    try {
      this.whisperProcessor.dispose();
      this.yamnetProcessor.dispose();
      this.setInitialized(false);
    } catch (error) {
      console.warn("Error disposing content classifier:", error);
    }
  }
}
