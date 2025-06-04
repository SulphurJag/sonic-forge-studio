
import { modelManager } from '../models';
import { ProcessingMode } from '../models/modelTypes';
import { AIAudioProcessingSettings, AIAudioProcessingResult, AIInitializationStatus } from './types';
import { toast } from "@/hooks/use-toast";

// Main AI Audio Processing Engine with robust model management
export class AIAudioMasteringEngine {
  private isInitialized: boolean = false;
  private isInitializing: boolean = false;
  private initializationResult: { success: boolean; loadedModels: string[] } = { success: false, loadedModels: [] };
  
  constructor() {
    // Auto-initialize in background
    this.initialize().catch(error => {
      console.warn("Background AI initialization failed:", error);
    });
  }
  
  // Initialize all AI components
  async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }
    
    if (this.isInitializing) {
      // Wait for existing initialization to complete
      let attempts = 0;
      while (this.isInitializing && attempts < 100) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      return this.isInitialized;
    }
    
    this.isInitializing = true;
    
    try {
      console.log("Initializing AI Audio Mastering Engine...");
      
      // Initialize all models
      this.initializationResult = await modelManager.initializeAllModels();
      
      // Consider initialization successful if at least one model loaded
      this.isInitialized = this.initializationResult.success;
      
      if (this.isInitialized) {
        toast({
          title: "AI Engine Ready",
          description: `Loaded ${this.initializationResult.loadedModels.length} AI models`,
          variant: "default"
        });
        console.log("AI Audio Mastering Engine initialized successfully");
      } else {
        // Still mark as initialized to allow fallback processing
        this.isInitialized = true;
        console.log("AI Engine initialized with fallback processing");
      }
      
      this.isInitializing = false;
      return this.isInitialized;
    } catch (error) {
      console.error('AI engine initialization failed:', error);
      this.isInitializing = false;
      // Always fall back to basic processing
      this.isInitialized = true;
      return true;
    }
  }
  
  // Check if the engine is ready for processing
  isReady(): boolean {
    return this.isInitialized;
  }
  
  // Get the current processing mode
  getProcessingMode(): ProcessingMode {
    return modelManager.getPreferredProcessingMode();
  }
  
  // Set the processing mode explicitly
  setProcessingMode(mode: ProcessingMode): void {
    modelManager.setProcessingMode(mode);
  }
  
  // Check initialization status of each component
  getInitializationStatus(): AIInitializationStatus {
    const status = modelManager.getModelStatusSummary();
    
    return {
      noiseProcessor: status.noiseSuppressor,
      contentClassifier: status.contentClassifier,
      artifactEliminator: status.artifactDetector,
      overall: this.isInitialized,
      hasWebGPU: status.processingMode === ProcessingMode.LOCAL_WEBGPU,
      processingMode: status.processingMode
    };
  }
  
  // Process audio with all AI components
  async processAudio(
    audioBuffer: AudioBuffer,
    settings: AIAudioProcessingSettings
  ): Promise<AIAudioProcessingResult> {
    // Ensure initialization
    if (!this.isInitialized) {
      console.log('AI engine not initialized, attempting to initialize...');
      const initialized = await this.initialize();
      if (!initialized) {
        console.warn('AI engine initialization failed, returning original buffer');
        return {
          processedBuffer: audioBuffer,
          contentType: [],
          artifactsFound: false
        };
      }
    }
    
    let processedBuffer = audioBuffer;
    let contentType: string[] = [];
    let artifactsFound = false;
    
    try {
      // Step 1: Content classification
      if (settings.enableContentClassification) {
        const classifier = modelManager.getContentClassifier();
        if (classifier.isReady()) {
          try {
            contentType = await classifier.processAudio(audioBuffer);
            console.log("Content classified as:", contentType);
            
            toast({
              title: "Content Analysis Complete",
              description: `Detected: ${contentType.join(', ')}`,
              variant: "default"
            });
          } catch (error) {
            console.warn("Content classification failed:", error);
            contentType = ['audio']; // fallback
          }
        }
      }
      
      // Step 2: Noise reduction
      if (settings.enableNoiseReduction) {
        const noiseSuppressor = modelManager.getNoiseSuppressor();
        if (noiseSuppressor.isReady()) {
          try {
            toast({
              title: "Noise Reduction Active",
              description: `Using ${settings.noiseReductionStrategy} strategy`,
              variant: "default"
            });
            
            // Map strategy types to match the model's expected types
            let mappedStrategy: 'auto' | 'rnnoise' | 'spectral' | 'wiener' = 'auto';
            switch (settings.noiseReductionStrategy) {
              case 'dtln':
                mappedStrategy = 'rnnoise'; // Map DTLN to RNNoise
                break;
              case 'nsnet':
                mappedStrategy = 'spectral'; // Map NSNet to spectral
                break;
              case 'hybrid':
                mappedStrategy = 'wiener'; // Map hybrid to Wiener
                break;
              default:
                mappedStrategy = settings.noiseReductionStrategy as 'auto' | 'spectral';
            }
            
            processedBuffer = await noiseSuppressor.processAudio(processedBuffer, {
              strategy: mappedStrategy,
              intensity: settings.noiseReductionIntensity || 50,
              preserveTone: settings.preserveTone || true
            });
            
            toast({
              title: "Noise Reduction Complete",
              description: `Applied ${settings.noiseReductionIntensity}% intensity`,
              variant: "default"
            });
          } catch (error) {
            console.warn("Noise reduction failed:", error);
          }
        }
      }
      
      // Step 3: Artifact elimination
      if (settings.enableArtifactElimination) {
        const artifactDetector = modelManager.getArtifactDetector();
        if (artifactDetector.isReady()) {
          try {
            const analysis = await artifactDetector.detectArtifacts(processedBuffer);
            artifactsFound = analysis.hasClipping || analysis.hasCrackles || analysis.hasClicksAndPops;
            
            if (artifactsFound) {
              console.log("Artifacts detected:", analysis);
              
              toast({
                title: "Artifacts Detected",
                description: "Applying automatic corrections",
                variant: "default"
              });
              
              processedBuffer = await artifactDetector.fixArtifacts(processedBuffer, {
                fixClipping: analysis.hasClipping,
                fixCrackles: analysis.hasCrackles,
                fixClicksAndPops: analysis.hasClicksAndPops,
                fixDistortion: analysis.hasDistortion || false
              });
              
              toast({
                title: "Artifacts Fixed",
                description: "Audio artifacts have been corrected",
                variant: "default"
              });
            }
          } catch (error) {
            console.warn("Artifact detection/fixing failed:", error);
          }
        }
      }
      
      return {
        processedBuffer,
        contentType,
        artifactsFound
      };
    } catch (error) {
      console.error("Error during AI audio processing:", error);
      
      toast({
        title: "Processing Error",
        description: "AI processing encountered an error",
        variant: "destructive"
      });
      
      return {
        processedBuffer: audioBuffer,
        contentType: contentType || [],
        artifactsFound: false
      };
    }
  }
  
  // Get loaded models info
  getLoadedModels(): string[] {
    return this.initializationResult.loadedModels;
  }
  
  // Dispose of resources
  dispose(): void {
    this.isInitialized = false;
    this.isInitializing = false;
    modelManager.dispose();
    console.log("AI Audio Mastering Engine disposed");
  }
}
