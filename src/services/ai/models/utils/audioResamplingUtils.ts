
export class AudioResamplingUtils {
  /**
   * Resample audio data from source sample rate to target sample rate
   */
  static resample(
    inputData: Float32Array,
    sourceSampleRate: number,
    targetSampleRate: number
  ): Float32Array {
    if (sourceSampleRate === targetSampleRate) {
      return inputData;
    }
    
    const ratio = sourceSampleRate / targetSampleRate;
    const outputLength = Math.floor(inputData.length / ratio);
    const outputData = new Float32Array(outputLength);
    
    // Linear interpolation resampling
    for (let i = 0; i < outputLength; i++) {
      const sourceIndex = i * ratio;
      const sourceIndexFloor = Math.floor(sourceIndex);
      const sourceIndexCeil = Math.min(sourceIndexFloor + 1, inputData.length - 1);
      const fraction = sourceIndex - sourceIndexFloor;
      
      const sample1 = inputData[sourceIndexFloor] || 0;
      const sample2 = inputData[sourceIndexCeil] || 0;
      
      outputData[i] = sample1 * (1 - fraction) + sample2 * fraction;
    }
    
    return outputData;
  }
  
  /**
   * Normalize audio data to prevent clipping
   */
  static normalize(audioData: Float32Array): Float32Array {
    const maxValue = Math.max(...Array.from(audioData).map(Math.abs));
    if (maxValue === 0) return audioData;
    
    const normalizedData = new Float32Array(audioData.length);
    const scale = 0.95 / maxValue; // Leave some headroom
    
    for (let i = 0; i < audioData.length; i++) {
      normalizedData[i] = audioData[i] * scale;
    }
    
    return normalizedData;
  }
  
  /**
   * Convert stereo to mono by averaging channels
   */
  static stereoToMono(leftChannel: Float32Array, rightChannel: Float32Array): Float32Array {
    const length = Math.min(leftChannel.length, rightChannel.length);
    const monoData = new Float32Array(length);
    
    for (let i = 0; i < length; i++) {
      monoData[i] = (leftChannel[i] + rightChannel[i]) / 2;
    }
    
    return monoData;
  }
}
