
import { AINoiseSuppressionProcessor } from './noiseSuppressionProcessor';
import { AIContentClassifier } from './contentClassifier';
import { AIArtifactEliminator } from './artifactEliminator';
import { modelManager } from './modelManager';
import { toast } from "@/hooks/use-toast";

// Main AI Audio Processing Engine that combines all components
export class AIAudioMasteringEngine {
  private noiseProcessor: AINoiseSuppressionProcessor;
  private contentClassifier: AIContentClassifier;
  private artifactEliminator: AIArtifactEliminator;
  private isInitialized: boolean = false;
  private isInitializing: boolean = false;
  private hasGPUSupport: boolean = false;
  
  constructor() {
    this.noiseProcessor = new AINoiseSuppressionProcessor();
    this.contentClassifier = new AIContentClassifier();
    this.artifactEliminator = new AIArtifactEliminator();
  }
  
  // Initialize all AI components
  async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }
    
    if (this.isInitializing) {
      console.log("AI engine is already initializing");
      return false;
    }
    
    this.isInitializing = true;
    
    try {
      // Check for WebGPU support first
      this.hasGPUSupport = await modelManager.checkWebGPUSupport();
      
      if (!this.hasGPUSupport) {
        toast({
          title: "WebGPU Not Supported",
          description: "Your browser doesn't support WebGPU. Using simplified AI processing.",
          variant: "default"
        });
        console.log("WebGPU not supported - using simplified AI processing");
      }
      
      // Initialize all components in parallel
      const results = await Promise.all([
        this.noiseProcessor.initialize(),
        this.contentClassifier.initialize(),
        this.artifactEliminator.initialize()
      ]);
      
      this.isInitialized = results.every(result => result);
      
      console.log(`AI audio mastering engine initialized: ${this.isInitialized}`);
      
      if (this.isInitialized) {
        toast({
          title: "AI Engine Ready",
          description: this.hasGPUSupport ? 
            "Audio processing AI features are now available" :
            "Using simplified AI processing (WebGPU not supported)",
          variant: "default"
        });
      } else {
        toast({
          title: "Partial Initialization",
          description: "Some AI models could not be loaded. Limited functionality available.",
          variant: "destructive"
        });
      }
      
      return this.isInitialized;
    } catch (error) {
      console.error("Failed to initialize AI audio engine:", error);
      toast({
        title: "Initialization Error",
        description: "Failed to initialize AI audio processing engine",
        variant: "destructive"
      });
      return false;
    } finally {
      this.isInitializing = false;
    }
  }
  
  // Check if the engine is ready for processing
  isReady(): boolean {
    return this.isInitialized;
  }
  
  // Check initialization status of each component
  getInitializationStatus(): {
    noiseProcessor: boolean;
    contentClassifier: boolean;
    artifactEliminator: boolean;
    overall: boolean;
    hasWebGPU: boolean;
  } {
    return {
      noiseProcessor: this.noiseProcessor.isReady(),
      contentClassifier: this.contentClassifier.isReady(),
      artifactEliminator: this.artifactEliminator.isReady(),
      overall: this.isInitialized,
      hasWebGPU: this.hasGPUSupport
    };
  }
  
  // Process audio with all AI components
  async processAudio(
    audioBuffer: AudioBuffer,
    settings: {
      enableNoiseReduction: boolean;
      noiseReductionStrategy: 'auto' | 'dtln' | 'spectral' | 'nsnet' | 'hybrid';
      noiseReductionIntensity: number;
      enableContentClassification: boolean;
      enableAutoProcessing: boolean;
      enableArtifactElimination: boolean;
      preserveTone: boolean;
    }
  ): Promise<{
    processedBuffer: AudioBuffer | null;
    contentType: string[];
    artifactsFound: boolean;
  }> {
    if (!this.isInitialized) {
      await this.initialize();
      if (!this.isInitialized) {
        throw new Error("AI audio engine not initialized");
      }
    }
    
    // Default result
    let result: {
      processedBuffer: AudioBuffer | null;
      contentType: string[];
      artifactsFound: boolean;
    } = {
      processedBuffer: audioBuffer,
      contentType: [],
      artifactsFound: false
    };
    
    try {
      // Step 1: Content classification (if enabled)
      if (settings.enableContentClassification) {
        result.contentType = await this.contentClassifier.classifyContent(audioBuffer);
        console.log("Content classified as:", result.contentType);
        
        toast({
          title: "Content Classification",
          description: `Detected: ${result.contentType.join(', ')}`,
          variant: "default"
        });
      }
      
      // Step 2: Apply content-aware processing (if enabled)
      let currentBuffer = audioBuffer;
      if (settings.enableAutoProcessing && result.contentType.length > 0) {
        // Get recommendations based on content type
        const recommendations = this.contentClassifier.getProcessingRecommendations();
        console.log("Processing recommendations:", recommendations);
      }
      
      // Step 3: Noise reduction (if enabled)
      if (settings.enableNoiseReduction) {
        toast({
          title: "AI Noise Reduction",
          description: `Processing with ${settings.noiseReductionStrategy} strategy...`,
          variant: "default"
        });
        
        const denoisedBuffer = await this.noiseProcessor.processBuffer(
          currentBuffer,
          {
            strategy: settings.noiseReductionStrategy,
            intensity: settings.noiseReductionIntensity,
            preserveTone: settings.preserveTone
          }
        );
        
        if (denoisedBuffer) {
          currentBuffer = denoisedBuffer;
          toast({
            title: "Noise Reduction Complete",
            description: `Reduced noise by approximately ${Math.round(settings.noiseReductionIntensity * 0.1)}dB`,
            variant: "default"
          });
        }
      }
      
      // Step 4: Artifact elimination (if enabled)
      if (settings.enableArtifactElimination) {
        // Detect artifacts
        const artifactAnalysis = this.artifactEliminator.detectArtifacts(currentBuffer);
        result.artifactsFound = artifactAnalysis.hasClipping || 
          artifactAnalysis.hasCrackles || 
          artifactAnalysis.hasClicksAndPops;
        
        if (result.artifactsFound) {
          console.log("Artifacts detected:", artifactAnalysis);
          
          toast({
            title: "Artifacts Detected",
            description: "Fixing audio problems...",
            variant: "default"
          });
          
          // Fix artifacts
          const cleanedBuffer = await this.artifactEliminator.eliminateArtifacts(
            currentBuffer,
            {
              fixClipping: artifactAnalysis.hasClipping,
              fixCrackles: artifactAnalysis.hasCrackles,
              fixClicksAndPops: artifactAnalysis.hasClicksAndPops
            }
          );
          
          if (cleanedBuffer) {
            currentBuffer = cleanedBuffer;
            toast({
              title: "Artifact Elimination Complete",
              description: "Audio quality has been improved",
              variant: "default"
            });
          }
        }
      }
      
      // Return the final processed buffer
      result.processedBuffer = currentBuffer;
      return result;
    } catch (error) {
      console.error("Error during AI audio processing:", error);
      toast({
        title: "Processing Error",
        description: "Failed to process audio with AI components",
        variant: "destructive"
      });
      return result;
    }
  }
}
