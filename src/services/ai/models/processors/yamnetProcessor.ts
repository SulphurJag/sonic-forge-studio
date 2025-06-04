
import * as tf from '@tensorflow/tfjs';
import { TFJS_MODELS, MODEL_CONFIGS } from '../modelTypes';
import { AudioResamplingUtils } from '../utils/audioResamplingUtils';

export class YAMNetProcessor {
  private model: any = null;

  async initialize(): Promise<boolean> {
    try {
      console.log("Loading YAMNet model...");
      
      this.model = await tf.loadGraphModel(TFJS_MODELS.YAMNET);
      
      if (this.model) {
        console.log("YAMNet model loaded successfully");
        return true;
      }
      return false;
    } catch (error) {
      console.warn("Failed to load YAMNet model:", error);
      return false;
    }
  }

  async process(audioBuffer: AudioBuffer): Promise<string[]> {
    if (!this.model) {
      return [];
    }

    try {
      let audioData = audioBuffer.getChannelData(0);
      if (audioBuffer.sampleRate !== MODEL_CONFIGS.YAMNET.sampleRate) {
        audioData = AudioResamplingUtils.resample(
          audioData, 
          audioBuffer.sampleRate, 
          MODEL_CONFIGS.YAMNET.sampleRate
        );
      }
      
      const inputLength = MODEL_CONFIGS.YAMNET.inputShape[0];
      if (audioData.length > inputLength) {
        audioData = audioData.slice(0, inputLength);
      } else if (audioData.length < inputLength) {
        const padded = new Float32Array(inputLength);
        padded.set(audioData);
        audioData = padded;
      }
      
      const inputTensor = tf.tensor2d([Array.from(audioData)], [1, inputLength]);
      const predictions = this.model.predict(inputTensor) as tf.Tensor;
      const scores = await predictions.data();
      
      const topClasses = this.getTopYAMNetClasses(new Float32Array(scores));
      
      tf.dispose([inputTensor, predictions]);
      
      return topClasses;
    } catch (error) {
      console.error("YAMNet processing failed:", error);
      return [];
    }
  }

  private getTopYAMNetClasses(scores: Float32Array): string[] {
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

  isReady(): boolean {
    return !!this.model;
  }

  dispose(): void {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
  }
}
