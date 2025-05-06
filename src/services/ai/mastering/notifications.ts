
import { toast } from "@/hooks/use-toast";

// Display notifications for AI initialization and processing

// Success notification when all AI models are initialized
export function showInitSuccessNotification(hasGPUSupport: boolean): void {
  toast({
    title: "AI Engine Ready",
    description: hasGPUSupport 
      ? "All AI audio processing models initialized with GPU acceleration" 
      : "All AI audio processing models initialized with CPU mode",
    variant: "default",
    duration: 5000
  });
}

// Partial initialization notification
export function showPartialInitNotification(): void {
  toast({
    title: "Limited AI Functionality",
    description: "Some AI features may be unavailable due to partial initialization",
    variant: "default"
  });
}

// Error notification when AI initialization fails
export function showInitErrorNotification(): void {
  toast({
    title: "AI Initialization Failed",
    description: "Failed to initialize AI audio processing. Please try again.",
    variant: "destructive"
  });
}

// Notification for when WebGPU is not supported
export function showWebGPUNotSupportedNotification(): void {
  toast({
    title: "Hardware Acceleration Unavailable",
    description: "Your device doesn't support WebGPU. Using cloud processing instead.",
    variant: "default",
    duration: 5000
  });
}

// Notification for when remote API is active
export function showRemoteAPIActiveNotification(): void {
  toast({
    title: "Cloud Processing Active",
    description: "Using Hugging Face Spaces for AI audio processing",
    variant: "default",
    duration: 5000
  });
}

// Content classification notification
export function showContentClassificationNotification(contentTypes: string[]): void {
  toast({
    title: "Content Classified",
    description: `Detected content types: ${contentTypes.join(", ")}`,
    variant: "default"
  });
}

// Noise reduction notification
export function showNoiseReductionNotification(strategy: string): void {
  toast({
    title: "Processing Audio",
    description: `Applying ${strategy} noise reduction...`,
    variant: "default"
  });
}

// Noise reduction complete notification
export function showNoiseReductionCompleteNotification(intensity: number): void {
  toast({
    title: "Noise Reduction Complete",
    description: `Applied noise reduction with ${intensity}% intensity`,
    variant: "default"
  });
}

// Artifact detected notification
export function showArtifactDetectedNotification(): void {
  toast({
    title: "Artifacts Detected",
    description: "Found audio issues that need correction",
    variant: "default"
  });
}

// Artifact fixed notification
export function showArtifactFixedNotification(): void {
  toast({
    title: "Audio Fixed",
    description: "Successfully removed audio artifacts",
    variant: "default"
  });
}

// Processing error notification
export function showProcessingErrorNotification(): void {
  toast({
    title: "Processing Error",
    description: "Failed to process audio. Please try again.",
    variant: "destructive"
  });
}
