
// Audio visualization utilities for Moroder

/**
 * Analyzes an audio file and generates waveform data
 * @param file The audio file to analyze
 * @param numSamples Number of points in the resulting waveform
 */
export const generateWaveformData = async (
  file: File, 
  numSamples: number = 100
): Promise<number[]> => {
  return new Promise((resolve, reject) => {
    // Create audio context
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create file reader
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        if (!event.target?.result || typeof event.target.result === 'string') {
          throw new Error('Error reading audio file');
        }
        
        // Decode audio data
        const audioData = await audioContext.decodeAudioData(event.target.result as ArrayBuffer);
        
        // Get the raw audio data from the first channel
        const rawData = audioData.getChannelData(0);
        
        // Calculate the step size based on the length of the audio
        const step = Math.floor(rawData.length / numSamples);
        const waveform: number[] = [];
        
        // Sample the audio data at regular intervals
        for (let i = 0; i < numSamples; i++) {
          const startIdx = i * step;
          const endIdx = Math.min(startIdx + step, rawData.length);
          
          // Find the peak amplitude in this segment
          let max = 0;
          for (let j = startIdx; j < endIdx; j++) {
            const amplitude = Math.abs(rawData[j]);
            if (amplitude > max) max = amplitude;
          }
          
          waveform.push(max);
        }
        
        // Close the audio context
        audioContext.close();
        
        resolve(waveform);
      } catch (error) {
        console.error("Error generating waveform data:", error);
        reject(error);
      }
    };
    
    reader.onerror = (error) => {
      console.error("FileReader error:", error);
      reject(error);
    };
    
    // Start reading the file
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Generates waveform data with RMS (root mean square) values for better representation
 * @param file The audio file to analyze
 * @param numSamples Number of points in the resulting waveform
 */
export const generateRMSWaveformData = async (
  file: File, 
  numSamples: number = 100
): Promise<{ peaks: number[], rms: number[] }> => {
  return new Promise((resolve, reject) => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        if (!event.target?.result || typeof event.target.result === 'string') {
          throw new Error('Error reading audio file');
        }
        
        const audioData = await audioContext.decodeAudioData(event.target.result as ArrayBuffer);
        const rawData = audioData.getChannelData(0);
        const step = Math.floor(rawData.length / numSamples);
        
        const peaks: number[] = [];
        const rms: number[] = [];
        
        for (let i = 0; i < numSamples; i++) {
          const startIdx = i * step;
          const endIdx = Math.min(startIdx + step, rawData.length);
          
          let max = 0;
          let sumOfSquares = 0;
          
          for (let j = startIdx; j < endIdx; j++) {
            const amplitude = Math.abs(rawData[j]);
            max = Math.max(max, amplitude);
            sumOfSquares += rawData[j] ** 2;
          }
          
          const segmentRMS = Math.sqrt(sumOfSquares / (endIdx - startIdx));
          
          peaks.push(max);
          rms.push(segmentRMS);
        }
        
        audioContext.close();
        resolve({ peaks, rms });
      } catch (error) {
        console.error("Error generating RMS waveform data:", error);
        reject(error);
      }
    };
    
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Performs spectral analysis on an audio file
 * @param file The audio file to analyze
 * @param fftSize FFT size for analysis (power of 2)
 */
export const generateSpectralData = async (
  file: File,
  fftSize: number = 2048
): Promise<{ frequencies: Float32Array, magnitudes: Float32Array }> => {
  return new Promise((resolve, reject) => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        if (!event.target?.result || typeof event.target.result === 'string') {
          throw new Error('Error reading audio file');
        }
        
        const audioData = await audioContext.decodeAudioData(event.target.result as ArrayBuffer);
        const analyser = audioContext.createAnalyser();
        
        analyser.fftSize = fftSize;
        
        // Connect nodes
        const source = audioContext.createBufferSource();
        source.buffer = audioData;
        source.connect(analyser);
        
        // Get frequency and time data
        const frequencyData = new Float32Array(analyser.frequencyBinCount);
        analyser.getFloatFrequencyData(frequencyData);
        
        // Create array of frequency values (in Hz)
        const frequencies = new Float32Array(analyser.frequencyBinCount);
        for (let i = 0; i < analyser.frequencyBinCount; i++) {
          frequencies[i] = i * audioContext.sampleRate / fftSize;
        }
        
        audioContext.close();
        resolve({ frequencies, magnitudes: frequencyData });
      } catch (error) {
        console.error("Error generating spectral data:", error);
        reject(error);
      }
    };
    
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};
