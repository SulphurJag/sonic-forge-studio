
import { pipeline } from '@huggingface/transformers';
import { HF_MODELS } from '../modelTypes';

export class WhisperProcessor {
  private pipeline: any = null;
  private useWebGPU: boolean = false;

  constructor() {
    this.useWebGPU = false;
  }

  async initialize(useWebGPU: boolean = false): Promise<boolean> {
    this.useWebGPU = useWebGPU;
    
    try {
      console.log("Loading Whisper model for content classification...");
      
      let pipelineInstance: any = null;
      
      if (this.useWebGPU) {
        try {
          pipelineInstance = await pipeline("automatic-speech-recognition", HF_MODELS.CONTENT_CLASSIFIER, {
            device: "webgpu",
            dtype: "fp16"
          });
        } catch (webgpuError) {
          console.warn("WebGPU failed, falling back to CPU:", webgpuError);
        }
      }
      
      if (!pipelineInstance) {
        pipelineInstance = await pipeline("automatic-speech-recognition", HF_MODELS.CONTENT_CLASSIFIER, {
          device: "cpu",
          dtype: "fp32"
        });
      }
      
      if (pipelineInstance) {
        this.pipeline = pipelineInstance;
        console.log("Whisper model loaded successfully");
        return true;
      }
      return false;
    } catch (error) {
      console.warn("Failed to load Whisper model:", error);
      return false;
    }
  }

  async process(audioBuffer: AudioBuffer): Promise<string[]> {
    if (!this.pipeline) {
      return [];
    }

    try {
      const audioData = audioBuffer.getChannelData(0);
      
      const result = await this.pipeline(audioData, {
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

  private extractContentFromText(text: string): string[] {
    const classifications: string[] = [];
    const lowerText = text.toLowerCase();
    
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

  isReady(): boolean {
    return !!this.pipeline;
  }

  dispose(): void {
    this.pipeline = null;
  }
}
