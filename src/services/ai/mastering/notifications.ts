
import { toast } from "@/hooks/use-toast";

// Helper functions for notifications
export const showInitSuccessNotification = (hasGPUSupport: boolean): void => {
  toast({
    title: "AI Engine Ready",
    description: hasGPUSupport ? 
      "Audio processing AI features are now available" :
      "Using simplified AI processing (WebGPU not supported)",
    variant: "default"
  });
};

export const showPartialInitNotification = (): void => {
  toast({
    title: "Partial Initialization",
    description: "Some AI models could not be loaded. Limited functionality available.",
    variant: "destructive"
  });
};

export const showInitErrorNotification = (): void => {
  toast({
    title: "Initialization Error",
    description: "Failed to initialize AI audio processing engine",
    variant: "destructive"
  });
};

export const showNoiseReductionNotification = (strategy: string): void => {
  toast({
    title: "AI Noise Reduction",
    description: `Processing with ${strategy} strategy...`,
    variant: "default"
  });
};

export const showNoiseReductionCompleteNotification = (intensity: number): void => {
  toast({
    title: "Noise Reduction Complete",
    description: `Reduced noise by approximately ${Math.round(intensity * 0.1)}dB`,
    variant: "default"
  });
};

export const showArtifactDetectedNotification = (): void => {
  toast({
    title: "Artifacts Detected",
    description: "Fixing audio problems...",
    variant: "default"
  });
};

export const showArtifactFixedNotification = (): void => {
  toast({
    title: "Artifact Elimination Complete",
    description: "Audio quality has been improved",
    variant: "default"
  });
};

export const showContentClassificationNotification = (contentTypes: string[]): void => {
  toast({
    title: "Content Classification",
    description: `Detected: ${contentTypes.join(', ')}`,
    variant: "default"
  });
};

export const showProcessingErrorNotification = (): void => {
  toast({
    title: "Processing Error",
    description: "Failed to process audio with AI components",
    variant: "destructive"
  });
};

export const showWebGPUNotSupportedNotification = (): void => {
  toast({
    title: "WebGPU Not Supported",
    description: "Your browser doesn't support WebGPU. Using simplified AI processing.",
    variant: "default"
  });
};
