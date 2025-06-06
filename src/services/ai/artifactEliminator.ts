
import { modelManager, ProcessingMode } from './models';
import { RealArtifactDetectionModel, ArtifactAnalysis } from './models/realArtifactDetectionModel';
import { toast } from "@/hooks/use-toast";

// Class for AI-Powered Artifact Elimination
export class AIArtifactEliminator {
  private artifactDetectionModel: RealArtifactDetectionModel;
  private isInitialized: boolean = false;
  private hasGPUSupport: boolean = false;
  
  constructor() {
    this.artifactDetectionModel = new RealArtifactDetectionModel();
  }
  
  // Initialize the artifact elimination models
  async initialize(): Promise<boolean> {
    try {
      this.hasGPUSupport = await modelManager.checkWebGPUSupport();
      
      const processingMode = modelManager.getPreferredProcessingMode();
      console.log("Initializing artifact eliminator with mode:", processingMode);
      
      // Initialize the real artifact detection model
      const modelLoaded = await this.artifactDetectionModel.loadModel();
      
      this.isInitialized = modelLoaded;
      
      if (this.isInitialized) {
        console.log("Artifact eliminator initialized successfully");
        toast({
          title: "Artifact Eliminator Ready",
          description: "AI artifact detection and fixing is now available",
          variant: "default"
        });
      } else {
        console.warn("Artifact eliminator failed to initialize");
      }
      
      return this.isInitialized;
    } catch (error) {
      console.error("Failed to initialize artifact eliminator:", error);
      // Still mark as initialized to allow algorithmic processing
      this.isInitialized = true;
      return true;
    }
  }
  
  // Check if models are ready
  isReady(): boolean {
    return this.isInitialized && this.artifactDetectionModel.isReady();
  }
  
  // Detect artifacts in audio
  async detectArtifacts(audioBuffer: AudioBuffer): Promise<ArtifactAnalysis> {
    if (!this.isInitialized) {
      console.warn("Artifact eliminator not initialized");
      return {
        hasClipping: false,
        hasCrackles: false,
        hasClicksAndPops: false,
        hasDistortion: false,
        hasDropouts: false,
        problematicSegments: []
      };
    }
    
    try {
      console.log("Detecting artifacts in audio");
      return await this.artifactDetectionModel.detectArtifacts(audioBuffer);
    } catch (error) {
      console.error("Error during artifact detection:", error);
      return {
        hasClipping: false,
        hasCrackles: false,
        hasClicksAndPops: false,
        hasDistortion: false,
        hasDropouts: false,
        problematicSegments: []
      };
    }
  }
  
  // Process audio buffer to fix artifacts
  async processBuffer(audioBuffer: AudioBuffer, options: {
    fixClipping: boolean;
    fixCrackles: boolean;
    fixClicksAndPops: boolean;
    fixDistortion: boolean;
  }): Promise<AudioBuffer | null> {
    if (!this.isInitialized) {
      console.warn("Artifact eliminator not initialized");
      return null;
    }
    
    try {
      console.log("Fixing artifacts in audio", options);
      
      // Use the real artifact detection model to fix artifacts
      const processedBuffer = await this.artifactDetectionModel.fixArtifacts(audioBuffer, {
        ...options,
        fixDropouts: true // Always try to fix dropouts
      });
      
      return processedBuffer;
    } catch (error) {
      console.error("Error during artifact elimination:", error);
      toast({
        title: "Processing Error",
        description: "Failed to eliminate artifacts",
        variant: "destructive"
      });
      return null;
    }
  }
  
  dispose(): void {
    if (this.artifactDetectionModel) {
      this.artifactDetectionModel.dispose();
    }
    this.isInitialized = false;
  }
}
