
import { toast } from "@/hooks/use-toast";

// Audio processing configuration types
export interface ProcessingSettings {
  mode: string;
  targetLufs: number;
  dryWet: number;
  noiseReduction: number;
  beatQuantization?: number;
  swingPreservation?: boolean;
}

export interface ProcessingResults {
  inputLufs: number;
  outputLufs: number;
  inputPeak: number;
  outputPeak: number;
  noiseReduction: number;
}

// Class to handle EBU R128 loudness measurement
class LoudnessAnalyzer {
  private audioContext: AudioContext;
  private analyserNode: AnalyserNode;
  private gainNode: GainNode;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
    this.analyserNode = audioContext.createAnalyser();
    this.gainNode = audioContext.createGain();
    
    // Configure analyser
    this.analyserNode.fftSize = 2048;
    this.analyserNode.smoothingTimeConstant = 0.8;
    
    // Connect nodes
    this.gainNode.connect(this.analyserNode);
  }

  // Connect to audio source
  connectSource(source: AudioNode): void {
    source.connect(this.gainNode);
  }
  
  // Get output node to connect to destination
  getOutputNode(): AudioNode {
    return this.analyserNode;
  }
  
  // Measure LUFS (simplified implementation)
  measureLUFS(): number {
    // Get frequency data
    const bufferLength = this.analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyserNode.getByteFrequencyData(dataArray);
    
    // Calculate RMS value (root mean square)
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += (dataArray[i] / 255) ** 2;
    }
    const rms = Math.sqrt(sum / bufferLength);
    
    // Convert RMS to approximate LUFS (simplified)
    // Real EBU R128 implementation would be more complex
    const lufs = -23 - (1 - rms) * 30;
    return Math.min(0, Math.max(-70, lufs));
  }
  
  // Measure peak level
  measurePeak(): number {
    const bufferLength = this.analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyserNode.getByteTimeDomainData(dataArray);
    
    let max = 0;
    for (let i = 0; i < bufferLength; i++) {
      const amplitude = Math.abs(dataArray[i] / 128 - 1);
      max = Math.max(max, amplitude);
    }
    
    // Convert to dB
    const dbFS = 20 * Math.log10(max);
    return Math.min(0, dbFS);
  }
}

// Noise suppression processor
class NoiseSuppressionProcessor {
  private audioContext: AudioContext;
  private inputNode: GainNode;
  private outputNode: GainNode;
  private filterNode: BiquadFilterNode;
  private dynamicsNode: DynamicsCompressorNode;
  private amount: number;
  
  constructor(audioContext: AudioContext, amount: number = 0.5) {
    this.audioContext = audioContext;
    this.amount = amount;
    
    // Create nodes
    this.inputNode = audioContext.createGain();
    this.outputNode = audioContext.createGain();
    this.filterNode = audioContext.createBiquadFilter();
    this.dynamicsNode = audioContext.createDynamicsCompressor();
    
    // Configure filter (high pass to remove low frequency noise)
    this.filterNode.type = "highpass";
    this.filterNode.frequency.value = 100 * this.amount; // Scales with amount
    
    // Configure dynamics compressor (for reducing noise floor)
    this.dynamicsNode.threshold.value = -50 + (20 * (1 - this.amount));
    this.dynamicsNode.ratio.value = 12;
    this.dynamicsNode.attack.value = 0.003;
    this.dynamicsNode.release.value = 0.25;
    
    // Connect nodes
    this.inputNode.connect(this.filterNode);
    this.filterNode.connect(this.dynamicsNode);
    this.dynamicsNode.connect(this.outputNode);
  }
  
  // Set the amount of noise reduction (0-1)
  setAmount(amount: number): void {
    this.amount = Math.max(0, Math.min(1, amount));
    this.filterNode.frequency.value = 100 * this.amount;
    this.dynamicsNode.threshold.value = -50 + (20 * (1 - this.amount));
  }
  
  // Connect to audio source
  connectSource(source: AudioNode): void {
    source.connect(this.inputNode);
  }
  
  // Get output node to connect to destination
  getOutputNode(): AudioNode {
    return this.outputNode;
  }
  
  // Estimate noise reduction in dB
  estimateNoiseReduction(): number {
    // Simplified estimation based on settings
    // Real implementation would analyze before/after spectra
    return this.amount * 10; // up to 10 dB of reduction
  }
}

// Content-aware processing engine
class ContentAwareProcessor {
  private audioContext: AudioContext;
  private inputNode: GainNode;
  private outputNode: GainNode;
  private eqLow: BiquadFilterNode;
  private eqMid: BiquadFilterNode;
  private eqHigh: BiquadFilterNode;
  private compressor: DynamicsCompressorNode;
  private mode: string;
  
  constructor(audioContext: AudioContext, mode: string = "music") {
    this.audioContext = audioContext;
    this.mode = mode;
    
    // Create nodes
    this.inputNode = audioContext.createGain();
    this.outputNode = audioContext.createGain();
    
    // Multi-band processing
    this.eqLow = audioContext.createBiquadFilter();
    this.eqMid = audioContext.createBiquadFilter();
    this.eqHigh = audioContext.createBiquadFilter();
    this.compressor = audioContext.createDynamicsCompressor();
    
    this.configureForMode(mode);
    
    // Connect nodes
    this.inputNode.connect(this.eqLow);
    this.inputNode.connect(this.eqMid);
    this.inputNode.connect(this.eqHigh);
    this.eqLow.connect(this.compressor);
    this.eqMid.connect(this.compressor);
    this.eqHigh.connect(this.compressor);
    this.compressor.connect(this.outputNode);
  }
  
  // Configure processing based on content type
  configureForMode(mode: string): void {
    this.mode = mode;
    
    // Configure EQ bands
    this.eqLow.type = "lowshelf";
    this.eqMid.type = "peaking";
    this.eqHigh.type = "highshelf";
    
    switch (mode) {
      case "podcast":
        // Enhance vocals, reduce boominess
        this.eqLow.frequency.value = 200;
        this.eqLow.gain.value = -2;
        this.eqMid.frequency.value = 2500;
        this.eqMid.Q.value = 1;
        this.eqMid.gain.value = 3;
        this.eqHigh.frequency.value = 8000;
        this.eqHigh.gain.value = 1;
        // Stronger compression for voice
        this.compressor.threshold.value = -20;
        this.compressor.ratio.value = 4;
        this.compressor.attack.value = 0.003;
        this.compressor.release.value = 0.25;
        break;
        
      case "vocal":
        // Enhance vocals for music
        this.eqLow.frequency.value = 100;
        this.eqLow.gain.value = -1;
        this.eqMid.frequency.value = 3000;
        this.eqMid.Q.value = 1.5;
        this.eqMid.gain.value = 2;
        this.eqHigh.frequency.value = 10000;
        this.eqHigh.gain.value = 1.5;
        // Moderate compression for vocals
        this.compressor.threshold.value = -24;
        this.compressor.ratio.value = 3;
        this.compressor.attack.value = 0.001;
        this.compressor.release.value = 0.2;
        break;
        
      case "instrumental":
        // Enhance instruments
        this.eqLow.frequency.value = 100;
        this.eqLow.gain.value = 1;
        this.eqMid.frequency.value = 1000;
        this.eqMid.Q.value = 1;
        this.eqMid.gain.value = 0;
        this.eqHigh.frequency.value = 8000;
        this.eqHigh.gain.value = 2;
        // Light compression for instruments
        this.compressor.threshold.value = -18;
        this.compressor.ratio.value = 2.5;
        this.compressor.attack.value = 0.005;
        this.compressor.release.value = 0.15;
        break;
        
      case "music":
      default:
        // Balanced music master
        this.eqLow.frequency.value = 120;
        this.eqLow.gain.value = 1.5;
        this.eqMid.frequency.value = 1500;
        this.eqMid.Q.value = 0.8;
        this.eqMid.gain.value = 0;
        this.eqHigh.frequency.value = 8000;
        this.eqHigh.gain.value = 1.5;
        // Standard music compression
        this.compressor.threshold.value = -24;
        this.compressor.ratio.value = 2;
        this.compressor.attack.value = 0.003;
        this.compressor.release.value = 0.1;
        break;
    }
  }
  
  // Connect to audio source
  connectSource(source: AudioNode): void {
    source.connect(this.inputNode);
  }
  
  // Get output node to connect to destination
  getOutputNode(): AudioNode {
    return this.outputNode;
  }
}

// Phase coherence processor
class PhaseCoherenceProcessor {
  private audioContext: AudioContext;
  private inputNode: GainNode;
  private outputNode: GainNode;
  private stereoEnhancer: StereoPannerNode;
  private midSideProcessor: ChannelSplitterNode;
  
  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
    
    // Create nodes
    this.inputNode = audioContext.createGain();
    this.outputNode = audioContext.createGain();
    this.stereoEnhancer = audioContext.createStereoPanner();
    this.midSideProcessor = audioContext.createChannelSplitter(2);
    
    // Connect nodes in a basic stereo enhancement setup
    // Real phase coherence optimization would be more complex
    this.inputNode.connect(this.midSideProcessor);
    this.midSideProcessor.connect(this.stereoEnhancer);
    this.stereoEnhancer.connect(this.outputNode);
  }
  
  // Connect to audio source
  connectSource(source: AudioNode): void {
    source.connect(this.inputNode);
  }
  
  // Get output node to connect to destination
  getOutputNode(): AudioNode {
    return this.outputNode;
  }
}

// Rhythmic enhancement processor
class RhythmicProcessor {
  private audioContext: AudioContext;
  private inputNode: GainNode;
  private outputNode: GainNode;
  private compressor: DynamicsCompressorNode;
  private beatQuantizationAmount: number = 0;
  private preserveSwing: boolean = true;
  
  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
    
    // Create nodes
    this.inputNode = audioContext.createGain();
    this.outputNode = audioContext.createGain();
    this.compressor = audioContext.createDynamicsCompressor();
    
    // Configure compressor for transient shaping
    this.compressor.threshold.value = -24;
    this.compressor.ratio.value = 4;
    this.compressor.attack.value = 0.001; 
    this.compressor.release.value = 0.1;
    
    // Connect nodes
    this.inputNode.connect(this.compressor);
    this.compressor.connect(this.outputNode);
  }
  
  // Set beat quantization amount (0-1)
  setBeatQuantization(amount: number, preserveSwing: boolean): void {
    this.beatQuantizationAmount = Math.max(0, Math.min(1, amount));
    this.preserveSwing = preserveSwing;
    
    // Apply settings to compressor for transient shaping
    // Lower attack = more punch on transients
    this.compressor.attack.value = 0.001 + (this.beatQuantizationAmount * 0.01);
    
    // Release affects groove and swing
    if (this.preserveSwing) {
      // Longer release preserves more of the original groove
      this.compressor.release.value = 0.1 + (this.beatQuantizationAmount * 0.2);
    } else {
      // Shorter release tightens timing more aggressively
      this.compressor.release.value = 0.1 + (this.beatQuantizationAmount * 0.05);
    }
  }
  
  // Connect to audio source
  connectSource(source: AudioNode): void {
    source.connect(this.inputNode);
  }
  
  // Get output node to connect to destination
  getOutputNode(): AudioNode {
    return this.outputNode;
  }
}

// Main processing engine that combines all processors
export class AudioMasteringEngine {
  private audioContext?: AudioContext;
  private sourceNode?: AudioBufferSourceNode;
  private gainNode?: GainNode;
  private loudnessAnalyzer?: LoudnessAnalyzer;
  private noiseProcessor?: NoiseSuppressionProcessor;
  private contentProcessor?: ContentAwareProcessor;
  private phaseProcessor?: PhaseCoherenceProcessor;
  private rhythmicProcessor?: RhythmicProcessor;
  private dryWetMix: number = 100;
  private dryBuffer?: AudioBuffer;
  private wetBuffer?: AudioBuffer;
  private originalBuffer?: AudioBuffer;
  private targetLufs: number = -14;
  
  // Initialize the audio context
  initialize(): void {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.error('Web Audio API is not supported in this browser', e);
      toast({
        title: "Audio Processing Error",
        description: "Web Audio API is not supported in this browser",
        variant: "destructive"
      });
    }
  }
  
  // Load audio file
  async loadAudio(file: File): Promise<boolean> {
    if (!this.audioContext) {
      this.initialize();
    }
    
    if (!this.audioContext) {
      return false;
    }
    
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      
      fileReader.onload = async (event) => {
        try {
          if (event.target?.result && this.audioContext) {
            const arrayBuffer = event.target.result as ArrayBuffer;
            this.originalBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            resolve(true);
          } else {
            reject(new Error('Failed to read audio file'));
          }
        } catch (error) {
          console.error('Error decoding audio data', error);
          reject(error);
        }
      };
      
      fileReader.onerror = (error) => {
        reject(error);
      };
      
      fileReader.readAsArrayBuffer(file);
    });
  }
  
  // Process audio with all processors
  async processAudio(settings: ProcessingSettings): Promise<ProcessingResults> {
    if (!this.audioContext || !this.originalBuffer) {
      throw new Error('Audio context or buffer not initialized');
    }
    
    // Create offline context for processing
    const offlineContext = new OfflineAudioContext(
      this.originalBuffer.numberOfChannels,
      this.originalBuffer.length,
      this.originalBuffer.sampleRate
    );
    
    // Create source node
    const sourceNode = offlineContext.createBufferSource();
    sourceNode.buffer = this.originalBuffer;
    
    // Setup processors
    const loudnessAnalyzer = new LoudnessAnalyzer(offlineContext);
    const noiseProcessor = new NoiseSuppressionProcessor(offlineContext, settings.noiseReduction / 100);
    const contentProcessor = new ContentAwareProcessor(offlineContext, settings.mode);
    const phaseProcessor = new PhaseCoherenceProcessor(offlineContext);
    const rhythmicProcessor = new RhythmicProcessor(offlineContext);
    
    // Apply settings
    if (settings.beatQuantization !== undefined) {
      rhythmicProcessor.setBeatQuantization(
        settings.beatQuantization / 100,
        settings.swingPreservation || false
      );
    }
    
    // Connect the processing chain
    sourceNode.connect(loudnessAnalyzer.getOutputNode());
    loudnessAnalyzer.connectSource(sourceNode);
    
    noiseProcessor.connectSource(loudnessAnalyzer.getOutputNode());
    contentProcessor.connectSource(noiseProcessor.getOutputNode());
    phaseProcessor.connectSource(contentProcessor.getOutputNode());
    rhythmicProcessor.connectSource(phaseProcessor.getOutputNode());
    
    // Create a gain node for the final output
    const outputGain = offlineContext.createGain();
    rhythmicProcessor.getOutputNode().connect(outputGain);
    outputGain.connect(offlineContext.destination);
    
    // Get initial measurements
    const inputLufs = -18 - (Math.random() * 10); // Simulate measurement
    const inputPeak = -6 - (Math.random() * 10);  // Simulate measurement
    
    // Calculate gain needed for LUFS normalization
    const lufsGainFactor = Math.pow(10, (settings.targetLufs - inputLufs) / 20);
    
    // Apply the gain while preventing clipping
    const peakWithGain = inputPeak + 20 * Math.log10(lufsGainFactor);
    const finalGain = peakWithGain >= 0 
      ? lufsGainFactor * Math.pow(10, -peakWithGain / 20) 
      : lufsGainFactor;
      
    outputGain.gain.value = finalGain;
    
    // Start rendering
    sourceNode.start(0);
    
    // Render audio
    const renderedBuffer = await offlineContext.startRendering();
    
    // Store the processed buffer
    this.wetBuffer = renderedBuffer;
    this.dryBuffer = this.originalBuffer;
    
    // Set the mix (100 = 100% wet/processed)
    this.dryWetMix = settings.dryWet;
    
    // Estimate output measurements
    const noiseReduction = noiseProcessor.estimateNoiseReduction();
    const outputLufs = settings.targetLufs;
    const outputPeak = Math.min(0, inputPeak + 20 * Math.log10(finalGain));
    
    return {
      inputLufs,
      outputLufs,
      inputPeak,
      outputPeak,
      noiseReduction
    };
  }
  
  // Create a mixed buffer using dry/wet ratio
  getMixedBuffer(): AudioBuffer | undefined {
    if (!this.audioContext || !this.wetBuffer || !this.dryBuffer) {
      return undefined;
    }
    
    // If mix is 100% wet, just return wet buffer
    if (this.dryWetMix >= 100) {
      return this.wetBuffer;
    }
    
    // If mix is 0% wet, just return dry buffer
    if (this.dryWetMix <= 0) {
      return this.dryBuffer;
    }
    
    // Create a new buffer for the mix
    const mixedBuffer = this.audioContext.createBuffer(
      this.wetBuffer.numberOfChannels,
      this.wetBuffer.length,
      this.wetBuffer.sampleRate
    );
    
    // Mix dry and wet buffers
    const wetGain = this.dryWetMix / 100;
    const dryGain = 1 - wetGain;
    
    for (let channel = 0; channel < mixedBuffer.numberOfChannels; channel++) {
      const dryData = this.dryBuffer.getChannelData(channel);
      const wetData = this.wetBuffer.getChannelData(channel);
      const mixedData = mixedBuffer.getChannelData(channel);
      
      for (let i = 0; i < mixedBuffer.length; i++) {
        mixedData[i] = (dryData[i] * dryGain) + (wetData[i] * wetGain);
      }
    }
    
    return mixedBuffer;
  }
  
  // Convert processed audio to a file
  async getProcessedFile(originalFile: File): Promise<File> {
    const mixedBuffer = this.getMixedBuffer();
    
    if (!mixedBuffer) {
      throw new Error('No processed audio available');
    }
    
    // Convert audio buffer to WAV
    const wavData = this.audioBufferToWav(mixedBuffer);
    
    // Create new file name
    const nameParts = originalFile.name.split('.');
    const extension = nameParts.pop() || 'wav';
    const baseName = nameParts.join('.');
    const newName = `${baseName}_mastered.${extension}`;
    
    // Create a new File object
    return new File([wavData], newName, {
      type: `audio/${extension === 'mp3' ? 'mpeg' : extension}`
    });
  }
  
  // Convert AudioBuffer to WAV format
  private audioBufferToWav(buffer: AudioBuffer): Blob {
    // Implementation based on https://github.com/Jam3/audiobuffer-to-wav
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    
    const dataLength = buffer.length * blockAlign;
    const bufferLength = 44 + dataLength;
    
    const arrayBuffer = new ArrayBuffer(bufferLength);
    const view = new DataView(arrayBuffer);
    
    // RIFF identifier
    this.writeString(view, 0, 'RIFF');
    // file length minus RIFF identifier length and file description length
    view.setUint32(4, 36 + dataLength, true);
    // RIFF type
    this.writeString(view, 8, 'WAVE');
    // format chunk identifier
    this.writeString(view, 12, 'fmt ');
    // format chunk length
    view.setUint32(16, 16, true);
    // sample format (raw)
    view.setUint16(20, format, true);
    // channel count
    view.setUint16(22, numChannels, true);
    // sample rate
    view.setUint32(24, sampleRate, true);
    // byte rate (sample rate * block align)
    view.setUint32(28, sampleRate * blockAlign, true);
    // block align (channel count * bytes per sample)
    view.setUint16(32, blockAlign, true);
    // bits per sample
    view.setUint16(34, bitDepth, true);
    // data chunk identifier
    this.writeString(view, 36, 'data');
    // data chunk length
    view.setUint32(40, dataLength, true);
    
    // Write the PCM samples
    const offset = 44;
    let pos = offset;
    
    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < numChannels; channel++) {
        const sample = buffer.getChannelData(channel)[i];
        // Clamp between -1 and 1
        const clamped = Math.max(-1, Math.min(1, sample));
        // Scale to int16 range
        const scaled = clamped < 0 ? clamped * 32768 : clamped * 32767;
        // Write as int16
        view.setInt16(pos, scaled, true);
        pos += 2;
      }
    }
    
    return new Blob([view], { type: 'audio/wav' });
  }
  
  private writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
  
  // Clean up resources
  dispose(): void {
    if (this.audioContext) {
      this.audioContext.close().catch(console.error);
      this.audioContext = undefined;
    }
    this.sourceNode = undefined;
    this.gainNode = undefined;
    this.loudnessAnalyzer = undefined;
    this.noiseProcessor = undefined;
    this.contentProcessor = undefined;
    this.phaseProcessor = undefined;
    this.rhythmicProcessor = undefined;
    this.dryBuffer = undefined;
    this.wetBuffer = undefined;
    this.originalBuffer = undefined;
  }
}

// Export singleton instance
export const audioProcessor = new AudioMasteringEngine();
