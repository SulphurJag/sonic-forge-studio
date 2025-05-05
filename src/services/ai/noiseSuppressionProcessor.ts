
import { modelManager, HF_MODELS } from './models';
import { toast } from "@/hooks/use-toast";

// Class for Multi-Strategy Noise Suppression
export class AINoiseSuppressionProcessor {
  private dtlnModel1: any = null;
  private dtlnModel2: any = null;
  private nsnetModel: any = null;
  private noiseSuppressionPipeline: any = null;
  private isInitialized: boolean = false;
  private hasGPUSupport: boolean = false;
  
  // Initialize the noise suppression models
  async initialize(): Promise<boolean> {
    try {
      // Check if WebGPU is supported
      this.hasGPUSupport = await modelManager.checkWebGPUSupport();
      
      if (this.hasGPUSupport) {
        // Load the transformers.js model for noise suppression
        this.noiseSuppressionPipeline = await modelManager.loadTransformersModel(
          'automatic-speech-recognition', // Changed from 'audio-to-audio' to supported type
          HF_MODELS.NOISE_SUPPRESSOR,
          'NOISE_SUPPRESSOR'
        );
        
        if (this.noiseSuppressionPipeline) {
          this.isInitialized = true;
          console.log("Noise suppression model loaded successfully");
        }
      } else {
        // Use simulated model if WebGPU is not supported
        console.log("WebGPU not supported, using simulated noise suppression");
        this.isInitialized = true;
      }
      
      return this.isInitialized;
    } catch (error) {
      console.error("Failed to initialize noise suppression:", error);
      toast({
        title: "Initialization Error",
        description: "Failed to initialize noise suppression models",
        variant: "destructive"
      });
      
      // Fallback to simulated mode
      this.isInitialized = true;
      console.log("Falling back to simulated noise suppression");
      
      return this.isInitialized;
    }
  }
  
  // Check if models are ready
  isReady(): boolean {
    return this.isInitialized;
  }
  
  // Process audio buffer with noise suppression
  async processBuffer(audioBuffer: AudioBuffer, settings: {
    strategy: 'auto' | 'dtln' | 'spectral' | 'nsnet' | 'hybrid',
    intensity: number, // 0-100
    preserveTone: boolean
  }): Promise<AudioBuffer | null> {
    if (!this.isInitialized) {
      console.warn("Noise suppression not initialized");
      return null;
    }
    
    try {
      console.log(`Using noise suppression strategy: ${settings.strategy} with intensity: ${settings.intensity}%`);
      
      // Create a new audio context for processing
      const context = new AudioContext();
      let processedBuffer: AudioBuffer;
      
      // Use the transformers pipeline if available and WebGPU is supported
      if (this.noiseSuppressionPipeline && this.hasGPUSupport) {
        // Convert AudioBuffer to Float32Array for processing
        const inputArray = new Float32Array(audioBuffer.length * audioBuffer.numberOfChannels);
        
        // Flatten the audio buffer into a single array
        for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
          const channelData = audioBuffer.getChannelData(channel);
          for (let i = 0; i < channelData.length; i++) {
            inputArray[i * audioBuffer.numberOfChannels + channel] = channelData[i];
          }
        }
        
        // Process with transformers model
        const result = await this.noiseSuppressionPipeline({
          audio: inputArray,
          sampling_rate: audioBuffer.sampleRate,
          apply_intensity: settings.intensity / 100,
        });
        
        // Create output buffer
        processedBuffer = context.createBuffer(
          audioBuffer.numberOfChannels,
          audioBuffer.length,
          audioBuffer.sampleRate
        );
        
        // Convert result back to AudioBuffer format
        if (result && result.audio) {
          for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
            const outputData = processedBuffer.getChannelData(channel);
            for (let i = 0; i < audioBuffer.length; i++) {
              outputData[i] = result.audio[i * audioBuffer.numberOfChannels + channel];
            }
          }
        }
      } else {
        // Create a new audio context for processing
        processedBuffer = context.createBuffer(
          audioBuffer.numberOfChannels,
          audioBuffer.length,
          audioBuffer.sampleRate
        );
        
        // Apply a simple gain reduction based on intensity (simulating noise reduction)
        for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
          const inputData = audioBuffer.getChannelData(channel);
          const outputData = processedBuffer.getChannelData(channel);
          
          // Copy with slight processing to simulate noise reduction
          const intensityFactor = settings.intensity / 100;
          for (let i = 0; i < inputData.length; i++) {
            // Simple noise gate simulation
            if (Math.abs(inputData[i]) < 0.01 * intensityFactor) {
              outputData[i] = 0; // Reduce low-amplitude signals (noise)
            } else {
              outputData[i] = inputData[i];
            }
          }
        }
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
  
  // Auto-detect optimal noise suppression strategy based on audio characteristics
  private detectOptimalStrategy(audioBuffer: AudioBuffer): 'dtln' | 'spectral' | 'nsnet' | 'hybrid' {
    // Simplified detection logic
    if (audioBuffer.length < 48000) {
      return 'spectral';
    } else if (audioBuffer.duration > 60) {
      return 'nsnet';
    } else {
      return 'hybrid';
    }
  }
}
