
import { modelManager, HF_MODELS, LIGHTWEIGHT_MODELS, ProcessingMode } from './models';
import { toast } from "@/hooks/use-toast";
import * as tf from '@tensorflow/tfjs';

// Class for Multi-Strategy Noise Suppression
export class AINoiseSuppressionProcessor {
  private dtlnModel1: any = null;
  private dtlnModel2: any = null;
  private nsnetModel: any = null;
  private noiseSuppressionPipeline: any = null;
  private lightweightModel: any = null;
  private isInitialized: boolean = false;
  private hasGPUSupport: boolean = false;
  
  // Initialize the noise suppression models
  async initialize(): Promise<boolean> {
    try {
      // Check if WebGPU is supported
      this.hasGPUSupport = await modelManager.checkWebGPUSupport();
      let modelLoaded = false;
      
      const processingMode = modelManager.getPreferredProcessingMode();
      
      // Load models based on preferred processing mode
      if (processingMode === ProcessingMode.LOCAL_WEBGPU && this.hasGPUSupport) {
        try {
          console.log("Loading WebGPU-accelerated noise suppression model...");
          this.noiseSuppressionPipeline = await modelManager.loadTransformersModel(
            'automatic-speech-recognition', // Using a compatible task type
            HF_MODELS.NOISE_SUPPRESSOR,
            'NOISE_SUPPRESSOR'
          );
          
          if (this.noiseSuppressionPipeline) {
            console.log("WebGPU noise suppression model loaded successfully");
            modelLoaded = true;
          }
        } catch (transformersError) {
          console.warn("Failed to load WebGPU model:", transformersError);
          // Fall back to remote API
          toast({
            title: "Model Loading Failed",
            description: "Falling back to remote API for noise reduction",
            variant: "default"
          });
        }
      } else if (processingMode === ProcessingMode.LOCAL_LIGHTWEIGHT) {
        try {
          console.log("Loading lightweight noise suppression model...");
          this.lightweightModel = await tf.loadLayersModel(LIGHTWEIGHT_MODELS.NOISE_REDUCTION);
          if (this.lightweightModel) {
            console.log("Lightweight noise suppression model loaded");
            modelLoaded = true;
          }
        } catch (error) {
          console.warn("Failed to load lightweight model:", error);
          // Fall back to remote API
          toast({
            title: "Model Loading Failed",
            description: "Falling back to remote API for noise reduction",
            variant: "default"
          });
        }
      }
      
      // Always check remote API connectivity
      try {
        // Perform a simple ping to the API to ensure it's available
        await fetch(modelManager.getHuggingFaceSpacesAPI().API_BASE_URLs.NOISE_SUPPRESSION, {
          method: 'HEAD'
        });
        
        console.log("Remote API for noise suppression is available");
        modelLoaded = true;
      } catch (apiError) {
        console.warn("Remote API not available:", apiError);
        
        if (!modelLoaded) {
          toast({
            title: "Service Unavailable",
            description: "Neither local models nor remote API are available for noise reduction",
            variant: "destructive"
          });
          return false;
        }
      }
      
      // Mark as initialized if any method is available
      this.isInitialized = modelLoaded;
      return this.isInitialized;
    } catch (error) {
      console.error("Failed to initialize noise suppression:", error);
      toast({
        title: "Initialization Error",
        description: "Failed to initialize noise suppression models",
        variant: "destructive"
      });
      
      return false;
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
      
      const processingMode = modelManager.getPreferredProcessingMode();
      
      // Use the WebGPU accelerated model if available
      if (processingMode === ProcessingMode.LOCAL_WEBGPU && this.noiseSuppressionPipeline && this.hasGPUSupport) {
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
      } 
      // Use the lightweight model if available and preferred
      else if (processingMode === ProcessingMode.LOCAL_LIGHTWEIGHT && this.lightweightModel) {
        // Prepare input for TensorFlow.js model
        // Typically takes a spectrogram or audio features as input
        const channelData = audioBuffer.getChannelData(0); // Process first channel
        
        // Process in chunks to avoid memory issues (1-second chunks)
        const sampleRate = audioBuffer.sampleRate;
        const chunkSize = sampleRate; // 1 second
        const processedData = new Float32Array(channelData.length);
        
        for (let i = 0; i < channelData.length; i += chunkSize) {
          const end = Math.min(i + chunkSize, channelData.length);
          const chunk = channelData.slice(i, end);
          
          // Convert to tensor
          const inputTensor = tf.tensor1d(chunk).expandDims(0);
          
          // Process with model
          const outputTensor = this.lightweightModel.predict(inputTensor);
          
          // Get data and copy to result
          const outputData = await outputTensor.data();
          for (let j = 0; j < outputData.length; j++) {
            if (i + j < processedData.length) {
              processedData[i + j] = outputData[j];
            }
          }
          
          // Clean up tensors
          tf.dispose([inputTensor, outputTensor]);
        }
        
        // Create output buffer
        processedBuffer = context.createBuffer(
          audioBuffer.numberOfChannels,
          audioBuffer.length,
          audioBuffer.sampleRate
        );
        
        // Copy the processed data to the buffer
        // For first channel
        processedBuffer.copyToChannel(processedData, 0);
        
        // Copy same processing to other channels if they exist
        for (let channel = 1; channel < audioBuffer.numberOfChannels; channel++) {
          processedBuffer.copyToChannel(processedData, channel);
        }
      }
      // Use Hugging Face Spaces API as fallback or if remote mode is preferred
      else {
        // Extract audio data for processing
        const channelData = audioBuffer.getChannelData(0);
        
        // Process via API
        const processedData = await modelManager.getHuggingFaceSpacesAPI().processNoiseReduction(
          channelData,
          audioBuffer.sampleRate,
          {
            intensity: settings.intensity,
            strategy: settings.strategy,
            preserveTone: settings.preserveTone
          }
        );
        
        // Create output buffer
        processedBuffer = context.createBuffer(
          audioBuffer.numberOfChannels,
          processedData.length,
          audioBuffer.sampleRate
        );
        
        // Copy the processed data to the buffer
        processedBuffer.copyToChannel(processedData, 0);
        
        // Copy to other channels if multi-channel
        for (let channel = 1; channel < audioBuffer.numberOfChannels; channel++) {
          processedBuffer.copyToChannel(processedData, channel);
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
    // Strategy selection logic
    if (audioBuffer.length < 48000) {
      return 'spectral';
    } else if (audioBuffer.duration > 60) {
      return 'nsnet';
    } else {
      return 'hybrid';
    }
  }
}
