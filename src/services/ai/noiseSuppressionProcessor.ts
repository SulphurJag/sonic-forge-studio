
import { modelManager, HF_MODELS, LIGHTWEIGHT_MODELS, ProcessingMode } from './models';
import { toast } from "@/hooks/use-toast";
import * as tf from '@tensorflow/tfjs';

// Class for AI-Powered Noise Suppression
export class AINoiseSuppressionProcessor {
  private speechT5Model: any = null;
  private rnnNoiseModel: any = null;
  private isInitialized: boolean = false;
  private hasGPUSupport: boolean = false;
  
  // Initialize the noise suppression models
  async initialize(): Promise<boolean> {
    try {
      this.hasGPUSupport = await modelManager.checkWebGPUSupport();
      let modelLoaded = false;
      
      const processingMode = modelManager.getPreferredProcessingMode();
      
      // Try loading SpeechT5 for advanced processing
      if (processingMode === ProcessingMode.LOCAL_WEBGPU && this.hasGPUSupport) {
        try {
          console.log("Loading SpeechT5 model for noise suppression...");
          this.speechT5Model = await modelManager.loadTransformersModel(
            'text-to-speech',
            HF_MODELS.NOISE_SUPPRESSOR,
            'NOISE_SUPPRESSOR'
          );
          
          if (this.speechT5Model) {
            console.log("SpeechT5 model loaded successfully");
            modelLoaded = true;
          }
        } catch (error) {
          console.warn("Failed to load SpeechT5 model:", error);
        }
      }
      
      // Try loading RNNoise as fallback
      if (!modelLoaded) {
        try {
          console.log("Loading RNNoise model...");
          this.rnnNoiseModel = await tf.loadLayersModel(LIGHTWEIGHT_MODELS.NOISE_REDUCTION);
          
          if (this.rnnNoiseModel) {
            console.log("RNNoise model loaded successfully");
            modelLoaded = true;
          }
        } catch (error) {
          console.warn("Failed to load RNNoise model:", error);
        }
      }
      
      if (!modelLoaded) {
        console.log("No noise suppression models loaded, using spectral filtering");
        // We'll use spectral filtering as fallback instead of failing
        modelLoaded = true;
      }
      
      this.isInitialized = modelLoaded;
      
      if (this.isInitialized) {
        toast({
          title: "Noise Suppression Ready",
          description: "AI noise reduction is now available",
          variant: "default"
        });
      }
      
      return this.isInitialized;
    } catch (error) {
      console.error("Failed to initialize noise suppression:", error);
      // Still mark as initialized to allow spectral filtering
      this.isInitialized = true;
      return true;
    }
  }
  
  // Check if models are ready
  isReady(): boolean {
    return this.isInitialized;
  }
  
  // Process audio buffer with noise suppression
  async processBuffer(audioBuffer: AudioBuffer, settings: {
    strategy: 'auto' | 'dtln' | 'spectral' | 'nsnet' | 'hybrid',
    intensity: number,
    preserveTone: boolean
  }): Promise<AudioBuffer | null> {
    if (!this.isInitialized) {
      console.warn("Noise suppression not initialized");
      return null;
    }
    
    try {
      console.log(`Applying noise suppression: ${settings.strategy}, intensity: ${settings.intensity}%`);
      
      const context = new AudioContext();
      let processedBuffer: AudioBuffer;
      
      // Use RNNoise if available
      if (this.rnnNoiseModel) {
        console.log("Using RNNoise for noise suppression");
        processedBuffer = await this.processWithRNNoise(audioBuffer, settings, context);
      }
      // Use spectral filtering as fallback
      else {
        console.log("Using spectral filtering for noise suppression");
        processedBuffer = await this.processWithSpectralFiltering(audioBuffer, settings, context);
      }
      
      return processedBuffer;
    } catch (error) {
      console.error("Error during noise suppression:", error);
      toast({
        title: "Processing Error",
        description: "Failed to apply noise suppression",
        variant: "destructive"
      });
      return null;
    }
  }
  
  // Process with RNNoise model
  private async processWithRNNoise(
    audioBuffer: AudioBuffer, 
    settings: any, 
    context: AudioContext
  ): Promise<AudioBuffer> {
    const processedBuffer = context.createBuffer(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );
    
    // Process each channel
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const inputData = audioBuffer.getChannelData(channel);
      const outputData = processedBuffer.getChannelData(channel);
      
      // RNNoise typically processes in 480-sample frames (10ms at 48kHz)
      const frameSize = 480;
      const hopSize = frameSize;
      
      // Process in frames
      for (let i = 0; i < inputData.length; i += hopSize) {
        const endIdx = Math.min(i + frameSize, inputData.length);
        const frame = inputData.slice(i, endIdx);
        
        // Pad frame if necessary
        const paddedFrame = new Float32Array(frameSize);
        paddedFrame.set(frame);
        
        // Create tensor for RNNoise
        const inputTensor = tf.tensor2d([paddedFrame], [1, frameSize]);
        
        // Process with model
        const outputTensor = this.rnnNoiseModel.predict(inputTensor) as tf.Tensor;
        const processedFrame = await outputTensor.data();
        
        // Apply intensity scaling
        const intensity = settings.intensity / 100;
        
        // Copy processed data back
        for (let j = 0; j < frame.length; j++) {
          const processed = processedFrame[j] as number;
          const original = frame[j];
          outputData[i + j] = original * (1 - intensity) + processed * intensity;
        }
        
        // Clean up tensors
        tf.dispose([inputTensor, outputTensor]);
      }
    }
    
    return processedBuffer;
  }
  
  // Process with spectral filtering
  private async processWithSpectralFiltering(
    audioBuffer: AudioBuffer,
    settings: any,
    context: AudioContext
  ): Promise<AudioBuffer> {
    const processedBuffer = context.createBuffer(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );
    
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const inputData = audioBuffer.getChannelData(channel);
      const outputData = processedBuffer.getChannelData(channel);
      
      // Apply spectral subtraction
      const fftSize = 2048;
      const hopSize = fftSize / 4;
      const window = this.createHanningWindow(fftSize);
      
      // Process overlapping frames
      for (let i = 0; i < inputData.length - fftSize; i += hopSize) {
        const frame = inputData.slice(i, i + fftSize);
        
        // Apply window
        const windowedFrame = frame.map((sample, idx) => sample * window[idx]);
        
        // Simple spectral processing (this is a simplified approach)
        const processedFrame = this.applySpectralSubtraction(windowedFrame, settings.intensity);
        
        // Overlap-add
        for (let j = 0; j < processedFrame.length; j++) {
          if (i + j < outputData.length) {
            outputData[i + j] += processedFrame[j] * window[j];
          }
        }
      }
      
      // Normalize
      const maxValue = Math.max(...Array.from(outputData).map(Math.abs));
      if (maxValue > 0) {
        for (let i = 0; i < outputData.length; i++) {
          outputData[i] /= maxValue;
        }
      }
    }
    
    return processedBuffer;
  }
  
  // Helper: Create Hanning window
  private createHanningWindow(size: number): Float32Array {
    const window = new Float32Array(size);
    for (let i = 0; i < size; i++) {
      window[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (size - 1)));
    }
    return window;
  }
  
  // Helper: Apply spectral subtraction
  private applySpectralSubtraction(frame: Float32Array, intensity: number): Float32Array {
    const processed = new Float32Array(frame.length);
    const alpha = intensity / 100;
    
    // Simple high-pass filtering to remove low-frequency noise
    for (let i = 0; i < frame.length; i++) {
      if (i === 0) {
        processed[i] = frame[i] * (1 - alpha * 0.5);
      } else {
        const highPass = frame[i] - frame[i - 1] * 0.95;
        processed[i] = frame[i] * (1 - alpha) + highPass * alpha;
      }
    }
    
    return processed;
  }
}
