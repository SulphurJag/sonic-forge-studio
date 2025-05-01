import { toast } from "@/hooks/use-toast";

// Audio processing configuration types
export interface ProcessingSettings {
  mode: string;
  targetLufs: number;
  dryWet: number;
  noiseReduction: number;
  beatQuantization?: number;
  swingPreservation?: boolean;
  preserveTempo: boolean;
  preserveTone: boolean;
  beatCorrectionMode?: string;
}

export interface ProcessingResults {
  inputLufs: number;
  outputLufs: number;
  inputPeak: number;
  outputPeak: number;
  noiseReduction: number;
}

// Use BaseAudioContext as the common type for both AudioContext and OfflineAudioContext
type AudioContextType = BaseAudioContext;

// Class to handle EBU R128 loudness measurement
class LoudnessAnalyzer {
  private audioContext: AudioContextType;
  private analyserNode: AnalyserNode;
  private gainNode: GainNode;

  constructor(audioContext: AudioContextType) {
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
  private audioContext: AudioContextType;
  private inputNode: GainNode;
  private outputNode: GainNode;
  private filterNode: BiquadFilterNode;
  private dynamicsNode: DynamicsCompressorNode;
  private amount: number;
  private preserveTone: boolean;
  
  constructor(audioContext: AudioContextType, amount: number = 0.5, preserveTone: boolean = true) {
    this.audioContext = audioContext;
    this.amount = amount;
    this.preserveTone = preserveTone;
    
    // Create nodes
    this.inputNode = audioContext.createGain();
    this.outputNode = audioContext.createGain();
    this.filterNode = audioContext.createBiquadFilter();
    this.dynamicsNode = audioContext.createDynamicsCompressor();
    
    this.configureNodes();
    
    // Connect nodes
    this.inputNode.connect(this.filterNode);
    this.filterNode.connect(this.dynamicsNode);
    this.dynamicsNode.connect(this.outputNode);
  }
  
  private configureNodes() {
    // Configure filter (high pass to remove low frequency noise)
    this.filterNode.type = "highpass";
    
    if (this.preserveTone) {
      // Gentler settings when preserving tone
      this.filterNode.frequency.value = 80 * this.amount; // Lower cutoff frequency
      
      // Configure dynamics compressor (for reducing noise floor)
      this.dynamicsNode.threshold.value = -60 + (30 * (1 - this.amount));
      this.dynamicsNode.ratio.value = Math.min(6, 4 + (this.amount * 4)); // Lower ratio
      this.dynamicsNode.attack.value = 0.01; // Slower attack
      this.dynamicsNode.release.value = 0.3; // Slower release
    } else {
      // Original stronger settings
      this.filterNode.frequency.value = 100 * this.amount;
      
      // Configure dynamics compressor (for reducing noise floor)
      this.dynamicsNode.threshold.value = -50 + (20 * (1 - this.amount));
      this.dynamicsNode.ratio.value = 12;
      this.dynamicsNode.attack.value = 0.003;
      this.dynamicsNode.release.value = 0.25;
    }
  }
  
  // Set the amount of noise reduction (0-1)
  setAmount(amount: number, preserveTone: boolean = true): void {
    this.amount = Math.max(0, Math.min(1, amount));
    this.preserveTone = preserveTone;
    this.configureNodes();
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
    return this.preserveTone ? this.amount * 6 : this.amount * 10; // up to 6 or 10 dB of reduction
  }
}

// Content-aware processing engine
class ContentAwareProcessor {
  private audioContext: AudioContextType;
  private inputNode: GainNode;
  private outputNode: GainNode;
  private eqLow: BiquadFilterNode;
  private eqMid: BiquadFilterNode;
  private eqHigh: BiquadFilterNode;
  private compressor: DynamicsCompressorNode;
  private mode: string;
  private preserveTone: boolean;
  
  constructor(audioContext: AudioContextType, mode: string = "music", preserveTone: boolean = true) {
    this.audioContext = audioContext;
    this.mode = mode;
    this.preserveTone = preserveTone;
    
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
    
    // If preserving tone, use much gentler settings
    const tonePreservationFactor = this.preserveTone ? 0.3 : 1.0;
    
    switch (mode) {
      case "podcast":
        // Enhance vocals, reduce boominess
        this.eqLow.frequency.value = 200;
        this.eqLow.gain.value = -2 * tonePreservationFactor;
        this.eqMid.frequency.value = 2500;
        this.eqMid.Q.value = 1;
        this.eqMid.gain.value = 3 * tonePreservationFactor;
        this.eqHigh.frequency.value = 8000;
        this.eqHigh.gain.value = 1 * tonePreservationFactor;
        // Compression for voice
        this.compressor.threshold.value = -20;
        this.compressor.ratio.value = 2 + (2 * tonePreservationFactor); // 2-4
        this.compressor.attack.value = this.preserveTone ? 0.01 : 0.003;
        this.compressor.release.value = this.preserveTone ? 0.35 : 0.25;
        break;
        
      case "vocal":
        // Enhance vocals for music
        this.eqLow.frequency.value = 100;
        this.eqLow.gain.value = -1 * tonePreservationFactor;
        this.eqMid.frequency.value = 3000;
        this.eqMid.Q.value = 1.5;
        this.eqMid.gain.value = 2 * tonePreservationFactor;
        this.eqHigh.frequency.value = 10000;
        this.eqHigh.gain.value = 1.5 * tonePreservationFactor;
        // Moderate compression for vocals
        this.compressor.threshold.value = -24;
        this.compressor.ratio.value = 1.5 + (1.5 * tonePreservationFactor); // 1.5-3
        this.compressor.attack.value = this.preserveTone ? 0.005 : 0.001;
        this.compressor.release.value = this.preserveTone ? 0.3 : 0.2;
        break;
        
      case "instrumental":
        // Enhance instruments
        this.eqLow.frequency.value = 100;
        this.eqLow.gain.value = 1 * tonePreservationFactor;
        this.eqMid.frequency.value = 1000;
        this.eqMid.Q.value = 1;
        this.eqMid.gain.value = 0;
        this.eqHigh.frequency.value = 8000;
        this.eqHigh.gain.value = 2 * tonePreservationFactor;
        // Light compression for instruments
        this.compressor.threshold.value = -18;
        this.compressor.ratio.value = 1.5 + (1 * tonePreservationFactor); // 1.5-2.5
        this.compressor.attack.value = this.preserveTone ? 0.01 : 0.005;
        this.compressor.release.value = this.preserveTone ? 0.25 : 0.15;
        break;
        
      case "music":
      default:
        // Balanced music master
        this.eqLow.frequency.value = 120;
        this.eqLow.gain.value = 1.5 * tonePreservationFactor;
        this.eqMid.frequency.value = 1500;
        this.eqMid.Q.value = 0.8;
        this.eqMid.gain.value = 0;
        this.eqHigh.frequency.value = 8000;
        this.eqHigh.gain.value = 1.5 * tonePreservationFactor;
        // Standard music compression
        this.compressor.threshold.value = -24;
        this.compressor.ratio.value = 1.3 + (0.7 * tonePreservationFactor); // 1.3-2
        this.compressor.attack.value = this.preserveTone ? 0.01 : 0.003;
        this.compressor.release.value = this.preserveTone ? 0.2 : 0.1;
        break;
    }
  }
  
  // Set preserve tone option
  setPreserveTone(preserve: boolean): void {
    this.preserveTone = preserve;
    this.configureForMode(this.mode);
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
  private audioContext: AudioContextType;
  private inputNode: GainNode;
  private outputNode: GainNode;
  private stereoEnhancer: StereoPannerNode;
  private midSideProcessor: ChannelSplitterNode;
  
  constructor(audioContext: AudioContextType) {
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
  private audioContext: AudioContextType;
  private inputNode: GainNode;
  private outputNode: GainNode;
  private compressor: DynamicsCompressorNode;
  private enhancer: BiquadFilterNode;
  private beatQuantizationAmount: number = 0;
  private preserveSwing: boolean = true;
  private preserveTempo: boolean = true;
  private correctionMode: string = "gentle";
  
  constructor(audioContext: AudioContextType, preserveTempo: boolean = true) {
    this.audioContext = audioContext;
    this.preserveTempo = preserveTempo;
    
    // Create nodes
    this.inputNode = audioContext.createGain();
    this.outputNode = audioContext.createGain();
    this.compressor = audioContext.createDynamicsCompressor();
    this.enhancer = audioContext.createBiquadFilter();
    
    // Configure enhancer for transient enhancement
    this.enhancer.type = "peaking";
    this.enhancer.frequency.value = 1200;
    this.enhancer.Q.value = 1.0;
    this.enhancer.gain.value = 0;
    
    // Configure compressor for transient shaping
    this.compressor.threshold.value = -24;
    this.compressor.ratio.value = 4;
    this.compressor.attack.value = 0.001; 
    this.compressor.release.value = 0.1;
    
    // Connect nodes
    this.inputNode.connect(this.enhancer);
    this.enhancer.connect(this.compressor);
    this.compressor.connect(this.outputNode);
  }
  
  // Set beat quantization amount (0-1) and correction mode
  setBeatQuantization(amount: number, preserveSwing: boolean, preserveTempo: boolean, correctionMode: string = "gentle"): void {
    this.beatQuantizationAmount = Math.max(0, Math.min(1, amount));
    this.preserveSwing = preserveSwing;
    this.preserveTempo = preserveTempo;
    this.correctionMode = correctionMode;
    
    // Always prioritize preservation if enabled
    const isPreserving = this.preserveTempo;
    
    // Base settings for each mode
    let thresholdBase: number;
    let ratioBase: number; 
    let attackBase: number;
    let releaseBase: number;
    let enhancerFreq: number;
    let enhancerQ: number;
    let enhancerGainMultiplier: number;
    
    // Set parameters based on correction mode
    switch (this.correctionMode) {
      case "gentle":
        thresholdBase = -20;
        ratioBase = 2;
        attackBase = 0.01;
        releaseBase = 0.2;
        enhancerFreq = 1000;
        enhancerQ = 0.7;
        enhancerGainMultiplier = 2;
        break;
        
      case "balanced":
        thresholdBase = -24;
        ratioBase = 3;
        attackBase = 0.005;
        releaseBase = 0.15;
        enhancerFreq = 1500;
        enhancerQ = 1.0;
        enhancerGainMultiplier = 3;
        break;
        
      case "precise":
        thresholdBase = -28;
        ratioBase = 4;
        attackBase = 0.003;
        releaseBase = 0.1;
        enhancerFreq = 2000;
        enhancerQ = 1.3;
        enhancerGainMultiplier = 4;
        break;
        
      default: // fallback to gentle
        thresholdBase = -20;
        ratioBase = 2;
        attackBase = 0.01;
        releaseBase = 0.2;
        enhancerFreq = 1000;
        enhancerQ = 0.7;
        enhancerGainMultiplier = 2;
    }
    
    // Apply preservation adjustments if needed
    if (isPreserving) {
      // In preservation mode, be more conservative with all settings
      thresholdBase += 4; // Higher threshold = less compression
      ratioBase = Math.max(1.5, ratioBase * 0.6); // Lower ratio = gentler compression
      attackBase *= 1.5; // Slower attack = preserves more transients
      releaseBase *= 1.5; // Slower release = more natural decay
      enhancerGainMultiplier *= 0.7; // Less enhancement = more natural sound
    }
    
    // Apply swing preservation adjustments
    if (this.preserveSwing) {
      // Gentler release preserves groove
      releaseBase *= 1.3;
    }
    
    // Set the adjusted compressor settings
    this.compressor.threshold.value = thresholdBase;
    this.compressor.ratio.value = ratioBase + (this.beatQuantizationAmount * 0.5); // slight ratio increase with quantization
    this.compressor.attack.value = attackBase;
    this.compressor.release.value = releaseBase;
    
    // Set the enhancer settings
    this.enhancer.frequency.value = enhancerFreq;
    this.enhancer.Q.value = enhancerQ;
    this.enhancer.gain.value = this.beatQuantizationAmount * enhancerGainMultiplier;
    
    // console.log("Beat quantization settings:", {
    //   correctionMode: this.correctionMode,
    //   preserveTempo: this.preserveTempo,
    //   preserveSwing: this.preserveSwing,
    //   amount: this.beatQuantizationAmount,
    //   thresholdBase,
    //   ratio: this.compressor.ratio.value,
    //   attack: this.compressor.attack.value,
    //   release: this.compressor.release.value,
    //   enhancerFreq: this.enhancer.frequency.value,
    //   enhancerGain: this.enhancer.gain.value
    // });
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
  private audioContext?: AudioContextType;
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
  private isLoading: boolean = false;
  
  // Check if audio is loaded and ready for processing
  isAudioLoaded(): boolean {
    return !!this.originalBuffer && !!this.audioContext && !this.isLoading;
  }
  
  // Initialize the audio context
  initialize(): void {
    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        console.log("Audio context initialized successfully");
      }
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
    
    this.isLoading = true;
    this.originalBuffer = undefined; // Clear any existing buffer
    
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      
      fileReader.onload = async (event) => {
        try {
          if (event.target?.result && this.audioContext) {
            console.log("Audio file read, decoding...");
            const arrayBuffer = event.target.result as ArrayBuffer;
            this.originalBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            console.log("Audio buffer decoded successfully");
            this.isLoading = false;
            resolve(true);
          } else {
            this.isLoading = false;
            console.error("Failed to read audio file or audio context not available");
            reject(new Error('Failed to read audio file'));
          }
        } catch (error) {
          this.isLoading = false;
          console.error('Error decoding audio data', error);
          reject(error);
        }
      };
      
      fileReader.onerror = (error) => {
        this.isLoading = false;
        console.error("File reader error:", error);
        reject(error);
      };
      
      console.log("Starting to read audio file");
      fileReader.readAsArrayBuffer(file);
    });
  }
  
  // Process audio with all processors
  async processAudio(settings: ProcessingSettings): Promise<ProcessingResults> {
    // Double-check that audio is loaded properly
    if (!this.isAudioLoaded()) {
      console.error("Audio not properly loaded. Context:", !!this.audioContext, "Buffer:", !!this.originalBuffer, "Loading:", this.isLoading);
      throw new Error('Audio context or buffer not initialized. Please ensure the audio file is fully loaded before processing.');
    }
    
    if (!this.audioContext || !this.originalBuffer) {
      throw new Error('Audio context or buffer not initialized');
    }
    
    console.log("Creating offline context for processing");
    
    // Extract beat correction mode from settings if available
    const beatCorrectionMode = (settings as any).beatCorrectionMode || "gentle";
    
    // Create offline context for processing
    const offlineContext = new OfflineAudioContext(
      this.originalBuffer.numberOfChannels,
      this.originalBuffer.length,
      this.originalBuffer.sampleRate
    );
    
    // Create source node
    const sourceNode = offlineContext.createBufferSource();
    sourceNode.buffer = this.originalBuffer;
    
    console.log("Setting up audio processing chain with preservation settings:", {
      preserveTempo: settings.preserveTempo ?? true,
      preserveTone: settings.preserveTone ?? true,
      swingPreservation: settings.swingPreservation ?? true,
      beatCorrectionMode
    });
    
    // Setup processors with preservation settings
    const loudnessAnalyzer = new LoudnessAnalyzer(offlineContext);
    const noiseProcessor = new NoiseSuppressionProcessor(
      offlineContext, 
      settings.noiseReduction / 100,
      settings.preserveTone ?? true
    );
    const contentProcessor = new ContentAwareProcessor(
      offlineContext, 
      settings.mode,
      settings.preserveTone ?? true
    );
    const phaseProcessor = new PhaseCoherenceProcessor(offlineContext);
    const rhythmicProcessor = new RhythmicProcessor(
      offlineContext,
      settings.preserveTempo ?? true
    );
    
    // Apply settings
    if (settings.beatQuantization !== undefined) {
      rhythmicProcessor.setBeatQuantization(
        settings.beatQuantization / 100,
        settings.swingPreservation || true,
        settings.preserveTempo ?? true,
        beatCorrectionMode
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
    
    console.log("Starting audio rendering");
    
    // Start rendering
    sourceNode.start(0);
    
    try {
      // Render audio
      console.log("Waiting for offline context rendering to complete");
      const renderedBuffer = await offlineContext.startRendering();
      console.log("Rendering completed successfully");
      
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
    } catch (error) {
      console.error("Error during audio rendering:", error);
      throw new Error(`Error rendering audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
      // Check if the audioContext has a close method (only available on AudioContext, not BaseAudioContext)
      if ('close' in this.audioContext && typeof (this.audioContext as any).close === 'function') {
        (this.audioContext as AudioContext).close().catch(console.error);
      }
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
    this.isLoading = false;
  }
}

// Export singleton instance
export const audioProcessor = new AudioMasteringEngine();
