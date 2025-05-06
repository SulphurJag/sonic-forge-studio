
import { toast } from "@/hooks/use-toast";

// Hugging Face Spaces API integration
export class HuggingFaceSpacesAPI {
  private static readonly API_BASE_URLs = {
    NOISE_SUPPRESSION: "https://api-inference.huggingface.co/models/speechbrain/mtl-mimic-voicebank",
    CONTENT_CLASSIFICATION: "https://api-inference.huggingface.co/models/openai/whisper-tiny",
    ARTIFACT_DETECTION: "https://api-inference.huggingface.co/models/microsoft/unispeech-sat-base"
  };
  
  private static readonly SPACES_API_URLs = {
    NOISE_SUPPRESSION: "https://noise-reduction-api.hf.space/api",
    CONTENT_CLASSIFICATION: "https://audio-content-classifier.hf.space/api",
    ARTIFACT_DETECTION: "https://audio-artifact-detector.hf.space/api"
  };
  
  // Process audio with noise suppression model on HF Spaces
  static async processNoiseReduction(
    audioData: Float32Array,
    sampleRate: number,
    options: {
      intensity: number;
      strategy: string;
      preserveTone: boolean;
    }
  ): Promise<Float32Array> {
    try {
      const formData = new FormData();
      
      // Convert float32array to blob
      const wavBlob = await this.float32ArrayToWavBlob(audioData, sampleRate);
      formData.append('audio', wavBlob, 'input.wav');
      formData.append('intensity', options.intensity.toString());
      formData.append('strategy', options.strategy);
      formData.append('preserveTone', options.preserveTone.toString());
      
      const response = await fetch(this.SPACES_API_URLs.NOISE_SUPPRESSION, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }
      
      const audioBlob = await response.blob();
      const processedAudioBuffer = await this.wavBlobToFloat32Array(audioBlob);
      
      return processedAudioBuffer;
    } catch (error) {
      console.error("Error in noise reduction API:", error);
      toast({
        title: "API Error",
        description: "Failed to process audio through noise reduction API",
        variant: "destructive"
      });
      throw error;
    }
  }
  
  // Classify audio content using HF Spaces
  static async classifyContent(
    audioData: Float32Array, 
    sampleRate: number
  ): Promise<string[]> {
    try {
      const formData = new FormData();
      
      // Convert float32array to blob
      const wavBlob = await this.float32ArrayToWavBlob(audioData, sampleRate);
      formData.append('audio', wavBlob, 'input.wav');
      
      const response = await fetch(this.SPACES_API_URLs.CONTENT_CLASSIFICATION, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result && result.classifications) {
        return result.classifications;
      }
      
      return ['audio']; // Default fallback
    } catch (error) {
      console.error("Error in content classification API:", error);
      toast({
        title: "API Error",
        description: "Failed to classify audio content",
        variant: "destructive"
      });
      throw error;
    }
  }
  
  // Detect artifacts in audio using HF Spaces
  static async detectArtifacts(
    audioData: Float32Array, 
    sampleRate: number
  ): Promise<{
    hasClipping: boolean;
    hasCrackles: boolean;
    hasClicksAndPops: boolean;
    problematicSegments: {start: number, end: number, type: string}[]
  }> {
    try {
      const formData = new FormData();
      
      // Convert float32array to blob
      const wavBlob = await this.float32ArrayToWavBlob(audioData, sampleRate);
      formData.append('audio', wavBlob, 'input.wav');
      
      const response = await fetch(this.SPACES_API_URLs.ARTIFACT_DETECTION, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error in artifact detection API:", error);
      toast({
        title: "API Error",
        description: "Failed to detect audio artifacts",
        variant: "destructive"
      });
      throw error;
    }
  }
  
  // Fix artifacts in audio using HF Spaces
  static async fixArtifacts(
    audioData: Float32Array,
    sampleRate: number,
    options: {
      fixClipping: boolean;
      fixCrackles: boolean;
      fixClicksAndPops: boolean;
    }
  ): Promise<Float32Array> {
    try {
      const formData = new FormData();
      
      // Convert float32array to blob
      const wavBlob = await this.float32ArrayToWavBlob(audioData, sampleRate);
      formData.append('audio', wavBlob, 'input.wav');
      formData.append('fixClipping', options.fixClipping.toString());
      formData.append('fixCrackles', options.fixCrackles.toString());
      formData.append('fixClicksAndPops', options.fixClicksAndPops.toString());
      
      const response = await fetch(`${this.SPACES_API_URLs.ARTIFACT_DETECTION}/fix`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }
      
      const audioBlob = await response.blob();
      const processedAudioBuffer = await this.wavBlobToFloat32Array(audioBlob);
      
      return processedAudioBuffer;
    } catch (error) {
      console.error("Error in artifact fixing API:", error);
      toast({
        title: "API Error",
        description: "Failed to fix audio artifacts",
        variant: "destructive"
      });
      throw error;
    }
  }
  
  // Helper method to convert Float32Array to WAV blob
  private static async float32ArrayToWavBlob(
    audioData: Float32Array, 
    sampleRate: number
  ): Promise<Blob> {
    // Simple WAV file creation - real implementation would be more robust
    const buffer = new ArrayBuffer(44 + audioData.length * 2);
    const view = new DataView(buffer);
    
    // WAV header
    // "RIFF" chunk descriptor
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 32 + audioData.length * 2, true);
    this.writeString(view, 8, 'WAVE');
    
    // "fmt " sub-chunk
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // subchunk size
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, 1, true); // Mono channel
    view.setUint32(24, sampleRate, true); // Sample rate
    view.setUint32(28, sampleRate * 2, true); // Byte rate
    view.setUint16(32, 2, true); // Block align
    view.setUint16(34, 16, true); // Bits per sample
    
    // "data" sub-chunk
    this.writeString(view, 36, 'data');
    view.setUint32(40, audioData.length * 2, true);
    
    // Write audio data
    const volume = 1;
    let index = 44;
    for (let i = 0; i < audioData.length; i++) {
      view.setInt16(index, audioData[i] * (0x7FFF * volume), true);
      index += 2;
    }
    
    return new Blob([buffer], { type: 'audio/wav' });
  }
  
  // Helper method to write a string to a DataView
  private static writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
  
  // Helper method to convert WAV blob back to Float32Array
  private static async wavBlobToFloat32Array(wavBlob: Blob): Promise<Float32Array> {
    const arrayBuffer = await wavBlob.arrayBuffer();
    const view = new DataView(arrayBuffer);
    
    // Parse WAV headers
    const numChannels = view.getUint16(22, true);
    const sampleRate = view.getUint32(24, true);
    const bitsPerSample = view.getUint16(34, true);
    
    // Find the data section
    let offset = 36;
    while (
      offset < arrayBuffer.byteLength && 
      (view.getUint8(offset) !== 0x64 || // 'd'
       view.getUint8(offset + 1) !== 0x61 || // 'a'
       view.getUint8(offset + 2) !== 0x74 || // 't'
       view.getUint8(offset + 3) !== 0x61) // 'a'
    ) {
      offset += 1;
    }
    
    if (offset >= arrayBuffer.byteLength) {
      throw new Error("Invalid WAV format: no 'data' section found");
    }
    
    const dataChunkSize = view.getUint32(offset + 4, true);
    const dataOffset = offset + 8;
    
    // Convert audio data
    const numSamples = dataChunkSize / (bitsPerSample / 8) / numChannels;
    const audioData = new Float32Array(numSamples);
    
    let sampleIndex = 0;
    for (let i = 0; i < numSamples; i++) {
      const sampleOffset = dataOffset + (i * (bitsPerSample / 8));
      
      if (bitsPerSample === 16) {
        audioData[sampleIndex] = view.getInt16(sampleOffset, true) / 32768.0;
      } else if (bitsPerSample === 8) {
        audioData[sampleIndex] = (view.getUint8(sampleOffset) - 128) / 128.0;
      } else if (bitsPerSample === 32) {
        audioData[sampleIndex] = view.getFloat32(sampleOffset, true);
      }
      
      sampleIndex++;
    }
    
    return audioData;
  }
}
