
// Implements the Hugging Face Spaces API for remote AI audio processing

import { ProcessingMode } from "./modelTypes";

// Types for API requests and responses
interface NoiseSuppressionRequest {
  audioData: Float32Array;
  sampleRate: number;
  strategy: string;
  intensity: number;
}

interface NoiseSuppressionResponse {
  processedAudio: Float32Array;
  success: boolean;
  message: string;
}

interface ContentClassificationRequest {
  audioData: Float32Array;
  sampleRate: number;
}

interface ContentClassificationResponse {
  contentType: string[];
  confidence: number[];
  success: boolean;
  message: string;
}

interface ArtifactDetectionRequest {
  audioData: Float32Array;
  sampleRate: number;
}

interface ArtifactDetectionResponse {
  artifactsFound: boolean;
  locations: number[];
  types: string[];
  success: boolean;
  message: string;
}

// Hugging Face Spaces API implementation
class HuggingFaceSpacesAPI {
  private readonly noiseSuppressionEndpoint: string;
  private readonly contentClassifierEndpoint: string;
  private readonly artifactDetectorEndpoint: string;
  
  constructor() {
    // Define the endpoints for the Hugging Face Spaces
    this.noiseSuppressionEndpoint = "https://huggingface.co/spaces/audio-ai/noise-reduction-api/api";
    this.contentClassifierEndpoint = "https://huggingface.co/spaces/audio-ai/content-classifier/api";
    this.artifactDetectorEndpoint = "https://huggingface.co/spaces/audio-ai/artifact-detector/api";
  }
  
  // Check if the API is available for remote processing
  public async checkAvailability(): Promise<boolean> {
    try {
      // Try a simple ping request to check if the service is up
      const response = await fetch(`${this.noiseSuppressionEndpoint}/ping`, {
        method: 'GET'
      });
      
      return response.ok;
    } catch (error) {
      console.error("Failed to check Hugging Face Spaces API availability:", error);
      return false;
    }
  }
  
  // Process audio with noise suppression
  public async suppressNoise(
    audioBuffer: AudioBuffer,
    strategy: string = 'auto',
    intensity: number = 0.5
  ): Promise<AudioBuffer | null> {
    try {
      const audioData = audioBuffer.getChannelData(0);
      
      const request: NoiseSuppressionRequest = {
        audioData: audioData,
        sampleRate: audioBuffer.sampleRate,
        strategy,
        intensity
      };
      
      const response = await fetch(`${this.noiseSuppressionEndpoint}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      
      const result: NoiseSuppressionResponse = await response.json();
      
      if (!result.success) {
        throw new Error(`Processing Error: ${result.message}`);
      }
      
      // Create a new AudioBuffer with the processed audio data
      const processedBuffer = new AudioContext().createBuffer(
        1,
        result.processedAudio.length,
        audioBuffer.sampleRate
      );
      processedBuffer.getChannelData(0).set(result.processedAudio);
      
      return processedBuffer;
    } catch (error) {
      console.error("Failed to process audio with Hugging Face Spaces API:", error);
      return null;
    }
  }
  
  // Classify audio content
  public async classifyContent(
    audioBuffer: AudioBuffer
  ): Promise<string[] | null> {
    try {
      const audioData = audioBuffer.getChannelData(0);
      
      const request: ContentClassificationRequest = {
        audioData: audioData,
        sampleRate: audioBuffer.sampleRate
      };
      
      const response = await fetch(`${this.contentClassifierEndpoint}/classify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      
      const result: ContentClassificationResponse = await response.json();
      
      if (!result.success) {
        throw new Error(`Classification Error: ${result.message}`);
      }
      
      return result.contentType;
    } catch (error) {
      console.error("Failed to classify audio with Hugging Face Spaces API:", error);
      return null;
    }
  }
  
  // Detect artifacts in audio
  public async detectArtifacts(
    audioBuffer: AudioBuffer
  ): Promise<boolean | null> {
    try {
      const audioData = audioBuffer.getChannelData(0);
      
      const request: ArtifactDetectionRequest = {
        audioData: audioData,
        sampleRate: audioBuffer.sampleRate
      };
      
      const response = await fetch(`${this.artifactDetectorEndpoint}/detect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      
      const result: ArtifactDetectionResponse = await response.json();
      
      if (!result.success) {
        throw new Error(`Detection Error: ${result.message}`);
      }
      
      return result.artifactsFound;
    } catch (error) {
      console.error("Failed to detect artifacts with Hugging Face Spaces API:", error);
      return null;
    }
  }
}

export const huggingFaceSpacesAPI = new HuggingFaceSpacesAPI();
