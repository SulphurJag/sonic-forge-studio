
export class AudioAnalysisUtils {
  /**
   * Analyze audio characteristics for basic content classification
   */
  static analyzeCharacteristics(audioBuffer: AudioBuffer): string[] {
    const audioData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    const classifications: string[] = [];
    
    // Analyze tempo for music detection
    const tempo = this.estimateTempo(audioData, sampleRate);
    if (tempo > 60 && tempo < 200) {
      classifications.push('music');
    }
    
    // Analyze spectral characteristics
    const spectralFeatures = this.analyzeSpectralFeatures(audioData);
    
    if (spectralFeatures.highFrequencyEnergy > 0.3) {
      classifications.push('speech');
    }
    
    if (spectralFeatures.lowFrequencyEnergy > 0.4) {
      classifications.push('bass-heavy');
    }
    
    if (spectralFeatures.dynamicRange > 0.6) {
      classifications.push('dynamic');
    } else {
      classifications.push('compressed');
    }
    
    // Detect silence or very quiet content
    const averageLevel = this.calculateRMS(audioData);
    if (averageLevel < 0.01) {
      classifications.push('quiet');
    } else if (averageLevel > 0.5) {
      classifications.push('loud');
    }
    
    return classifications.length > 0 ? classifications : ['audio'];
  }
  
  private static estimateTempo(audioData: Float32Array, sampleRate: number): number {
    // Simple tempo estimation using autocorrelation
    const hopSize = Math.floor(sampleRate / 100); // 10ms hops
    const minTempo = 60; // BPM
    const maxTempo = 200; // BPM
    
    const minPeriod = Math.floor(60 * sampleRate / maxTempo);
    const maxPeriod = Math.floor(60 * sampleRate / minTempo);
    
    let bestPeriod = minPeriod;
    let maxCorrelation = 0;
    
    for (let period = minPeriod; period < maxPeriod && period < audioData.length / 2; period += hopSize) {
      let correlation = 0;
      let count = 0;
      
      for (let i = 0; i < audioData.length - period; i += hopSize) {
        correlation += audioData[i] * audioData[i + period];
        count++;
      }
      
      correlation /= count;
      
      if (correlation > maxCorrelation) {
        maxCorrelation = correlation;
        bestPeriod = period;
      }
    }
    
    return 60 * sampleRate / bestPeriod;
  }
  
  private static analyzeSpectralFeatures(audioData: Float32Array): {
    highFrequencyEnergy: number;
    lowFrequencyEnergy: number;
    dynamicRange: number;
  } {
    // Simple spectral analysis using time-domain approximation
    let highFreqEnergy = 0;
    let lowFreqEnergy = 0;
    let maxLevel = 0;
    let minLevel = Infinity;
    
    // High frequency energy (approximated by derivative)
    for (let i = 1; i < audioData.length; i++) {
      const derivative = Math.abs(audioData[i] - audioData[i - 1]);
      highFreqEnergy += derivative;
      
      const level = Math.abs(audioData[i]);
      maxLevel = Math.max(maxLevel, level);
      minLevel = Math.min(minLevel, level);
    }
    
    // Low frequency energy (approximated by moving average)
    const windowSize = 100;
    for (let i = windowSize; i < audioData.length; i++) {
      let sum = 0;
      for (let j = i - windowSize; j < i; j++) {
        sum += Math.abs(audioData[j]);
      }
      lowFreqEnergy += sum / windowSize;
    }
    
    highFreqEnergy /= audioData.length;
    lowFreqEnergy /= (audioData.length - windowSize);
    
    const dynamicRange = maxLevel > 0 ? (maxLevel - minLevel) / maxLevel : 0;
    
    return {
      highFrequencyEnergy: Math.min(highFreqEnergy * 10, 1), // Normalize
      lowFrequencyEnergy: Math.min(lowFreqEnergy, 1),
      dynamicRange
    };
  }
  
  private static calculateRMS(audioData: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < audioData.length; i++) {
      sum += audioData[i] * audioData[i];
    }
    return Math.sqrt(sum / audioData.length);
  }
}
