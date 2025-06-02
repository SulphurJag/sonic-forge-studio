
import { toast } from "@/hooks/use-toast";

// Hugging Face Spaces API for remote processing using open-source models
export class HuggingFaceSpacesAPI {
  // Updated API endpoints to use open-source models
  public readonly API_BASE_URLs = {
    NOISE_SUPPRESSION: "https://api-inference.huggingface.co/models/facebook/denoiser-dns64",
    CONTENT_CLASSIFICATION: "https://api-inference.huggingface.co/models/openai/whisper-tiny.en",
    ARTIFACT_DETECTION: "https://api-inference.huggingface.co/models/microsoft/unispeech-sat-base-plus"
  };
  
  // Process noise reduction using Facebook's Denoiser model
  async processNoiseReduction(
    audioData: Float32Array,
    sampleRate: number,
    options: {
      intensity: number;
      strategy: string;
      preserveTone: boolean;
    }
  ): Promise<Float32Array> {
    try {
      console.log("Processing noise reduction with Facebook Denoiser model...");
      
      // Convert audio data to the format expected by the model
      const audioBuffer = Array.from(audioData);
      
      const response = await fetch(this.API_BASE_URLs.NOISE_SUPPRESSION, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: audioBuffer,
          parameters: {
            sample_rate: sampleRate,
            intensity: options.intensity / 100,
            preserve_tone: options.preserveTone
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Convert result back to Float32Array
      if (result && result.audio) {
        return new Float32Array(result.audio);
      }
      
      // Fallback: simple noise gate simulation
      return this.simulateNoiseReduction(audioData, options.intensity);
    } catch (error) {
      console.warn("Remote noise reduction failed, using local simulation:", error);
      return this.simulateNoiseReduction(audioData, options.intensity);
    }
  }
  
  // Classify content using OpenAI Whisper
  async classifyContent(
    audioData: Float32Array,
    sampleRate: number
  ): Promise<string[]> {
    try {
      console.log("Classifying content with OpenAI Whisper model...");
      
      const audioBuffer = Array.from(audioData);
      
      const response = await fetch(this.API_BASE_URLs.CONTENT_CLASSIFICATION, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: audioBuffer,
          parameters: {
            task: "transcribe",
            return_timestamps: true,
            language: "en"
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Analyze transcription to determine content type
      if (result && result.text) {
        return this.analyzeTranscriptionForContentType(result.text);
      }
      
      return ['audio']; // Default classification
    } catch (error) {
      console.warn("Remote content classification failed:", error);
      return ['audio'];
    }
  }
  
  // Detect artifacts using Microsoft UniSpeech
  async detectArtifacts(
    audioData: Float32Array,
    sampleRate: number
  ): Promise<{
    hasClipping: boolean;
    hasCrackles: boolean;
    hasClicksAndPops: boolean;
    confidence: number;
  }> {
    try {
      console.log("Detecting artifacts with Microsoft UniSpeech model...");
      
      const audioBuffer = Array.from(audioData);
      
      const response = await fetch(this.API_BASE_URLs.ARTIFACT_DETECTION, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: audioBuffer,
          parameters: {
            task: "audio-classification",
            top_k: 5
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Analyze classification results for artifacts
      if (result && Array.isArray(result)) {
        return this.analyzeClassificationForArtifacts(result);
      }
      
      return {
        hasClipping: false,
        hasCrackles: false,
        hasClicksAndPops: false,
        confidence: 0
      };
    } catch (error) {
      console.warn("Remote artifact detection failed:", error);
      return {
        hasClipping: false,
        hasCrackles: false,
        hasClicksAndPops: false,
        confidence: 0
      };
    }
  }
  
  // Helper: Simulate noise reduction locally
  private simulateNoiseReduction(audioData: Float32Array, intensity: number): Float32Array {
    const result = new Float32Array(audioData.length);
    const threshold = (100 - intensity) / 1000; // Convert intensity to threshold
    
    for (let i = 0; i < audioData.length; i++) {
      const sample = audioData[i];
      // Simple noise gate
      if (Math.abs(sample) > threshold) {
        result[i] = sample;
      } else {
        result[i] = sample * 0.1; // Reduce quiet sounds
      }
    }
    
    return result;
  }
  
  // Helper: Analyze transcription for content type
  private analyzeTranscriptionForContentType(text: string): string[] {
    const lowerText = text.toLowerCase();
    const contentTypes: string[] = [];
    
    // Check for music-related keywords
    if (lowerText.includes('music') || lowerText.includes('song') || 
        lowerText.includes('melody') || lowerText.includes('rhythm')) {
      contentTypes.push('music');
    }
    
    // Check for speech-related patterns
    if (lowerText.includes('hello') || lowerText.includes('welcome') || 
        lowerText.includes('today') || lowerText.includes('interview')) {
      contentTypes.push('speech');
    }
    
    // Check for vocal content
    if (lowerText.includes('singing') || lowerText.includes('vocal') || 
        lowerText.includes('voice')) {
      contentTypes.push('vocals');
    }
    
    return contentTypes.length > 0 ? contentTypes : ['audio'];
  }
  
  // Helper: Analyze classification results for artifacts
  private analyzeClassificationForArtifacts(classifications: any[]): {
    hasClipping: boolean;
    hasCrackles: boolean;
    hasClicksAndPops: boolean;
    confidence: number;
  } {
    let hasClipping = false;
    let hasCrackles = false;
    let hasClicksAndPops = false;
    let maxConfidence = 0;
    
    for (const classification of classifications) {
      const label = classification.label?.toLowerCase() || '';
      const score = classification.score || 0;
      
      maxConfidence = Math.max(maxConfidence, score);
      
      if (label.includes('distortion') || label.includes('clipping')) {
        hasClipping = true;
      }
      if (label.includes('noise') || label.includes('crackle')) {
        hasCrackles = true;
      }
      if (label.includes('click') || label.includes('pop')) {
        hasClicksAndPops = true;
      }
    }
    
    return {
      hasClipping,
      hasCrackles,
      hasClicksAndPops,
      confidence: maxConfidence
    };
  }
}

// Export singleton instance
export const huggingFaceSpacesAPI = new HuggingFaceSpacesAPI();
