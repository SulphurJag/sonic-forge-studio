
import { HF_SPACES_ENDPOINTS } from './modelTypes';

// API endpoints for Hugging Face Spaces
const API_BASE_URLs = {
  NOISE_SUPPRESSION: `${HF_SPACES_ENDPOINTS.NOISE_SUPPRESSOR}/api/process`,
  CONTENT_CLASSIFIER: `${HF_SPACES_ENDPOINTS.CONTENT_CLASSIFIER}/api/classify`,
  ARTIFACT_DETECTOR: `${HF_SPACES_ENDPOINTS.ARTIFACT_ELIMINATOR}/api/detect`,
  ARTIFACT_REMOVER: `${HF_SPACES_ENDPOINTS.ARTIFACT_ELIMINATOR}/api/fix`
};

// Process options for noise reduction
interface NoiseReductionOptions {
  intensity: number;
  strategy: 'auto' | 'dtln' | 'spectral' | 'nsnet' | 'hybrid';
  preserveTone: boolean;
}

// Process options for artifact elimination
interface ArtifactFixOptions {
  fixClipping: boolean;
  fixCrackles: boolean;
  fixClicksAndPops: boolean;
}

// Hugging Face Spaces API implementation
class HuggingFaceSpacesAPI {
  private readonly noiseSuppressionEndpoint: string;
  private readonly contentClassifierEndpoint: string;
  private readonly artifactDetectorEndpoint: string;
  private readonly artifactRemoverEndpoint: string;
  
  constructor() {
    this.noiseSuppressionEndpoint = API_BASE_URLs.NOISE_SUPPRESSION;
    this.contentClassifierEndpoint = API_BASE_URLs.CONTENT_CLASSIFIER;
    this.artifactDetectorEndpoint = API_BASE_URLs.ARTIFACT_DETECTOR;
    this.artifactRemoverEndpoint = API_BASE_URLs.ARTIFACT_REMOVER;
  }

  // Public API for easier access
  public get API_BASE_URLs() {
    return API_BASE_URLs;
  }
  
  // Process audio for noise reduction
  async processNoiseReduction(
    audioData: Float32Array,
    sampleRate: number,
    options: NoiseReductionOptions
  ): Promise<Float32Array> {
    try {
      console.log(`Processing noise reduction with strategy: ${options.strategy}, intensity: ${options.intensity}`);
      
      // Convert audio data to format suitable for API
      const audioBuffer = Array.from(audioData);
      
      // Post to API
      const response = await fetch(this.noiseSuppressionEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          audio: audioBuffer,
          sampleRate: sampleRate,
          strategy: options.strategy,
          intensity: options.intensity,
          preserveTone: options.preserveTone
        })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      // Parse result
      const result = await response.json();
      
      // Convert back to Float32Array
      return new Float32Array(result.audio);
    } catch (error) {
      console.error('Error processing noise reduction:', error);
      // Return original audio on error
      return audioData;
    }
  }
  
  // Classify audio content
  async classifyContent(audioData: Float32Array, sampleRate: number): Promise<string[]> {
    try {
      // Convert audio data to format suitable for API
      const audioBuffer = Array.from(audioData);
      
      // Post to API
      const response = await fetch(this.contentClassifierEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          audio: audioBuffer,
          sampleRate: sampleRate
        })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      // Parse result
      const result = await response.json();
      
      return result.classifications || [];
    } catch (error) {
      console.error('Error classifying content:', error);
      return [];
    }
  }
  
  // Detect audio artifacts
  async detectArtifacts(audioData: Float32Array, sampleRate: number): Promise<{
    hasClipping: boolean;
    hasCrackles: boolean;
    hasClicksAndPops: boolean;
  }> {
    try {
      // Convert audio data to format suitable for API
      const audioBuffer = Array.from(audioData);
      
      // Post to API
      const response = await fetch(this.artifactDetectorEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          audio: audioBuffer,
          sampleRate: sampleRate
        })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      // Parse result
      const result = await response.json();
      
      return {
        hasClipping: result.hasClipping || false,
        hasCrackles: result.hasCrackles || false,
        hasClicksAndPops: result.hasClicksAndPops || false
      };
    } catch (error) {
      console.error('Error detecting artifacts:', error);
      return {
        hasClipping: false,
        hasCrackles: false,
        hasClicksAndPops: false
      };
    }
  }
  
  // Fix audio artifacts
  async fixArtifacts(
    audioData: Float32Array,
    sampleRate: number,
    options: ArtifactFixOptions
  ): Promise<Float32Array> {
    try {
      // Convert audio data to format suitable for API
      const audioBuffer = Array.from(audioData);
      
      // Post to API
      const response = await fetch(this.artifactRemoverEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          audio: audioBuffer,
          sampleRate: sampleRate,
          fixClipping: options.fixClipping,
          fixCrackles: options.fixCrackles,
          fixClicksAndPops: options.fixClicksAndPops
        })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      // Parse result
      const result = await response.json();
      
      // Convert back to Float32Array
      return new Float32Array(result.audio);
    } catch (error) {
      console.error('Error fixing artifacts:', error);
      // Return original audio on error
      return audioData;
    }
  }
}

// Export singleton instance
export const huggingFaceSpacesAPI = new HuggingFaceSpacesAPI();
