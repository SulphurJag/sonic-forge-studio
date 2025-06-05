
// Audio analysis utilities for detecting various audio artifacts

export class AudioAnalysisUtils {
  
  // Detect clicks and pops using derivative analysis
  static detectClicksAndPops(audioData: Float32Array, sampleRate: number): Array<{
    position: number;
    magnitude: number;
    duration: number;
  }> {
    const clicks: Array<{position: number; magnitude: number; duration: number}> = [];
    const threshold = 0.5; // Threshold for click detection
    const minGap = Math.floor(sampleRate * 0.001); // 1ms minimum gap between clicks
    
    let lastClickPosition = -minGap;
    
    for (let i = 1; i < audioData.length - 1; i++) {
      // Calculate first derivative (rate of change)
      const derivative = Math.abs(audioData[i] - audioData[i - 1]);
      
      if (derivative > threshold && (i - lastClickPosition) > minGap) {
        // Look ahead to determine click duration
        let duration = 1;
        for (let j = i + 1; j < Math.min(i + 50, audioData.length); j++) {
          const nextDerivative = Math.abs(audioData[j] - audioData[j - 1]);
          if (nextDerivative < threshold * 0.5) {
            break;
          }
          duration++;
        }
        
        clicks.push({
          position: i,
          magnitude: derivative,
          duration: duration
        });
        
        lastClickPosition = i;
      }
    }
    
    return clicks;
  }
  
  // Detect audio dropouts (silence where there shouldn't be)
  static detectDropouts(audioData: Float32Array, sampleRate: number): Array<{
    start: number;
    end: number;
    severity: number;
  }> {
    const dropouts: Array<{start: number; end: number; severity: number}> = [];
    const silenceThreshold = 0.001;
    const minDropoutDuration = Math.floor(sampleRate * 0.005); // 5ms minimum
    const maxDropoutDuration = Math.floor(sampleRate * 0.1); // 100ms maximum to consider
    
    let silenceStart = -1;
    let inSilence = false;
    
    for (let i = 0; i < audioData.length; i++) {
      const isSilent = Math.abs(audioData[i]) < silenceThreshold;
      
      if (isSilent && !inSilence) {
        silenceStart = i;
        inSilence = true;
      } else if (!isSilent && inSilence) {
        const silenceDuration = i - silenceStart;
        
        if (silenceDuration >= minDropoutDuration && silenceDuration <= maxDropoutDuration) {
          // Check if this is likely a dropout by looking at surrounding audio
          const beforeLevel = this.getAudioLevel(audioData, Math.max(0, silenceStart - 1000), silenceStart);
          const afterLevel = this.getAudioLevel(audioData, i, Math.min(audioData.length, i + 1000));
          
          if (beforeLevel > silenceThreshold * 10 && afterLevel > silenceThreshold * 10) {
            dropouts.push({
              start: silenceStart,
              end: i,
              severity: Math.min(beforeLevel, afterLevel) / silenceThreshold
            });
          }
        }
        
        inSilence = false;
        silenceStart = -1;
      }
    }
    
    return dropouts;
  }
  
  // Detect crackles using high-frequency energy analysis
  static detectCrackles(audioData: Float32Array, sampleRate: number): Array<{
    position: number;
    intensity: number;
  }> {
    const crackles: Array<{position: number; intensity: number}> = [];
    const windowSize = Math.floor(sampleRate * 0.005); // 5ms windows
    const hopSize = Math.floor(windowSize / 2);
    const crackleThreshold = 0.05;
    
    for (let i = 0; i < audioData.length - windowSize; i += hopSize) {
      const window = audioData.slice(i, i + windowSize);
      
      // Calculate high-frequency energy
      const hfEnergy = this.calculateHighFrequencyEnergy(window);
      
      // Calculate total energy for normalization
      const totalEnergy = this.calculateTotalEnergy(window);
      
      if (totalEnergy > 0) {
        const hfRatio = hfEnergy / totalEnergy;
        
        if (hfRatio > crackleThreshold) {
          crackles.push({
            position: i + windowSize / 2,
            intensity: hfRatio
          });
        }
      }
    }
    
    return crackles;
  }
  
  // Detect distortion using THD (Total Harmonic Distortion) analysis
  static detectDistortion(audioData: Float32Array, sampleRate: number): Array<{
    position: number;
    thd: number;
  }> {
    const distortions: Array<{position: number; thd: number}> = [];
    const windowSize = 2048; // For FFT analysis
    const hopSize = windowSize / 2;
    const thdThreshold = 0.05; // 5% THD threshold
    
    for (let i = 0; i < audioData.length - windowSize; i += hopSize) {
      const window = audioData.slice(i, i + windowSize);
      const thd = this.calculateTHD(window);
      
      if (thd > thdThreshold) {
        distortions.push({
          position: i + windowSize / 2,
          thd: thd
        });
      }
    }
    
    return distortions;
  }
  
  // Calculate audio level (RMS) for a segment
  private static getAudioLevel(audioData: Float32Array, start: number, end: number): number {
    let sum = 0;
    const actualStart = Math.max(0, start);
    const actualEnd = Math.min(audioData.length, end);
    
    for (let i = actualStart; i < actualEnd; i++) {
      sum += audioData[i] * audioData[i];
    }
    
    return Math.sqrt(sum / (actualEnd - actualStart));
  }
  
  // Calculate high-frequency energy in a window
  private static calculateHighFrequencyEnergy(window: Float32Array): number {
    let energy = 0;
    
    // Simple high-pass filter approximation using differences
    for (let i = 1; i < window.length; i++) {
      const highFreq = window[i] - window[i - 1];
      energy += highFreq * highFreq;
    }
    
    return energy;
  }
  
  // Calculate total energy in a window
  private static calculateTotalEnergy(window: Float32Array): number {
    let energy = 0;
    
    for (let i = 0; i < window.length; i++) {
      energy += window[i] * window[i];
    }
    
    return energy;
  }
  
  // Calculate Total Harmonic Distortion (simplified)
  private static calculateTHD(signal: Float32Array): number {
    // This is a simplified THD calculation
    // In a real implementation, you'd use FFT to find fundamental and harmonics
    
    const fft = this.simpleFFT(signal);
    if (fft.length < 8) return 0;
    
    // Assume fundamental is in the first 1/8 of the spectrum
    const fundamentalBin = this.findPeakBin(fft.slice(0, fft.length / 8));
    const fundamentalPower = fft[fundamentalBin] * fft[fundamentalBin];
    
    // Calculate harmonic power (rough approximation)
    let harmonicPower = 0;
    for (let i = fundamentalBin * 2; i < fft.length && i < fundamentalBin * 6; i += fundamentalBin) {
      harmonicPower += fft[i] * fft[i];
    }
    
    if (fundamentalPower === 0) return 0;
    
    return Math.sqrt(harmonicPower / fundamentalPower);
  }
  
  // Simplified FFT (magnitude only)
  private static simpleFFT(signal: Float32Array): Float32Array {
    const N = signal.length;
    const result = new Float32Array(N / 2);
    
    for (let k = 0; k < N / 2; k++) {
      let real = 0;
      let imag = 0;
      
      for (let n = 0; n < N; n++) {
        const angle = -2 * Math.PI * k * n / N;
        real += signal[n] * Math.cos(angle);
        imag += signal[n] * Math.sin(angle);
      }
      
      result[k] = Math.sqrt(real * real + imag * imag);
    }
    
    return result;
  }
  
  // Find the bin with the peak magnitude
  private static findPeakBin(spectrum: Float32Array): number {
    let maxValue = 0;
    let maxBin = 0;
    
    for (let i = 0; i < spectrum.length; i++) {
      if (spectrum[i] > maxValue) {
        maxValue = spectrum[i];
        maxBin = i;
      }
    }
    
    return maxBin;
  }
  
  // Detect clipping in audio data
  static detectClipping(audioData: Float32Array, threshold: number = 0.99): Array<{
    start: number;
    end: number;
    severity: number;
  }> {
    const clippedSegments: Array<{start: number; end: number; severity: number}> = [];
    let clippingStart = -1;
    let consecutiveClipped = 0;
    
    for (let i = 0; i < audioData.length; i++) {
      if (Math.abs(audioData[i]) >= threshold) {
        if (clippingStart === -1) {
          clippingStart = i;
        }
        consecutiveClipped++;
      } else {
        if (clippingStart !== -1 && consecutiveClipped > 5) {
          clippedSegments.push({
            start: clippingStart,
            end: i,
            severity: consecutiveClipped / (i - clippingStart)
          });
        }
        clippingStart = -1;
        consecutiveClipped = 0;
      }
    }
    
    return clippedSegments;
  }
}
