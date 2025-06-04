
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
      this.whisperProcessor = new WhisperProcessor(this.useWebGPU);
      
      const whisperLoaded = await this.whisperProcessor.initialize();
      const yamnetLoaded = await this.yamnetProcessor.initialize();
      
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
  
  async processAudio(audioBuffer: AudioBuffer): Promise<string[]> {
    if (!this.isReady()) {
      throw new Error("Content classifier not ready");
    }
    
    try {
      let classifications: string[] = [];
      
      if (this.whisperProcessor.isReady()) {
        classifications = await this.whisperProcessor.process(audioBuffer);
      } else if (this.yamnetProcessor.isReady()) {
        classifications = await this.yamnetProcessor.process(audioBuffer);
      }
      
      if (classifications.length === 0) {
        classifications = AudioAnalysisUtils.analyzeCharacteristics(audioBuffer);
      }
      
      return classifications;
    } catch (error) {
      console.error("Error during content classification:", error);
      return AudioAnalysisUtils.analyzeCharacteristics(audioBuffer);
    }
  }
  
  dispose(): void {
    this.whisperProcessor.dispose();
    this.yamnetProcessor.dispose();
    this.setInitialized(false);
  }
}
