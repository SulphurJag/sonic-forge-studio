
export class AudioResamplingUtils {
  static resample(audioData: Float32Array, fromRate: number, toRate: number): Float32Array {
    const ratio = fromRate / toRate;
    const newLength = Math.round(audioData.length / ratio);
    const result = new Float32Array(newLength);
    
    for (let i = 0; i < newLength; i++) {
      const srcIndex = i * ratio;
      const srcIndexFloor = Math.floor(srcIndex);
      const srcIndexCeil = Math.min(Math.ceil(srcIndex), audioData.length - 1);
      const fraction = srcIndex - srcIndexFloor;
      
      result[i] = audioData[srcIndexFloor] * (1 - fraction) + audioData[srcIndexCeil] * fraction;
    }
    
    return result;
  }
}
