
import React from 'react';
import { Zap, Wand2, AlertCircle } from "lucide-react";
import SwitchWithLabel from './SwitchWithLabel';
import { aiAudioProcessor } from '@/services/ai';
import { toast } from "@/hooks/use-toast";
import AIMainControl from './ai/AIMainControl';
import NoiseReductionSettings from './ai/NoiseReductionSettings';
import AIInitializationStatus from './ai/AIInitializationStatus';

interface AIProcessingSettingsProps {
  enableAI: boolean;
  setEnableAI: (value: boolean) => void;
  aiNoiseReduction: boolean;
  setAiNoiseReduction: (value: boolean) => void;
  noiseReductionStrategy: 'auto' | 'dtln' | 'spectral' | 'nsnet' | 'hybrid';
  setNoiseReductionStrategy: (value: 'auto' | 'dtln' | 'spectral' | 'nsnet' | 'hybrid') => void;
  noiseReductionIntensity: number[];
  setNoiseReductionIntensity: (value: number[]) => void;
  contentClassification: boolean;
  setContentClassification: (value: boolean) => void;
  autoProcessing: boolean;
  setAutoProcessing: (value: boolean) => void;
  artifactElimination: boolean;
  setArtifactElimination: (value: boolean) => void;
  disabled?: boolean;
}

const AIProcessingSettings: React.FC<AIProcessingSettingsProps> = ({
  enableAI,
  setEnableAI,
  aiNoiseReduction,
  setAiNoiseReduction,
  noiseReductionStrategy,
  setNoiseReductionStrategy,
  noiseReductionIntensity,
  setNoiseReductionIntensity,
  contentClassification,
  setContentClassification,
  autoProcessing,
  setAutoProcessing,
  artifactElimination,
  setArtifactElimination,
  disabled = false
}) => {
  const [initStatus, setInitStatus] = React.useState({
    noiseProcessor: false,
    contentClassifier: false,
    artifactEliminator: false,
    overall: false,
    hasWebGPU: false,
    processingMode: undefined
  });
  
  const [isInitializing, setIsInitializing] = React.useState(false);

  // Check initialization status when the component mounts
  React.useEffect(() => {
    const status = aiAudioProcessor.getInitializationStatus();
    setInitStatus(status);
  }, []);

  // Initialize AI processor if needed
  const handleEnableAI = async (value: boolean) => {
    if (value && !initStatus.overall) {
      setIsInitializing(true);
      toast({
        title: "Initializing AI Models",
        description: "Please wait while AI models are being loaded...",
        variant: "default"
      });
      
      try {
        const initialized = await aiAudioProcessor.initialize();
        const newStatus = aiAudioProcessor.getInitializationStatus();
        setInitStatus(newStatus);
        setEnableAI(initialized);
        
        if (initialized) {
          toast({
            title: "AI Models Ready",
            description: newStatus.hasWebGPU 
              ? "AI audio processing features are now available" 
              : "Using simplified AI processing (WebGPU not supported)",
            variant: "default"
          });
        } else {
          toast({
            title: "Initialization Problem",
            description: "Some AI models couldn't be loaded. Limited functionality available.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error("Error initializing AI models:", error);
        toast({
          title: "Initialization Failed",
          description: "Could not initialize AI models. Please try again.",
          variant: "destructive"
        });
        setEnableAI(false);
      } finally {
        setIsInitializing(false);
      }
    } else {
      setEnableAI(value);
    }
  };

  return (
    <div className="space-y-5">
      <AIMainControl 
        enableAI={enableAI}
        handleEnableAI={handleEnableAI}
        disabled={disabled}
        isInitializing={isInitializing}
      />
      
      {enableAI && (
        <div className="space-y-4 pl-1 border-l-2 border-moroder-primary/20 ml-2">
          <AIInitializationStatus 
            isInitializing={isInitializing}
            initStatus={initStatus}
            enableAI={enableAI}
          />
          
          {!isInitializing && (
            <>
              <SwitchWithLabel
                id="ai-noise-reduction"
                label="AI Noise Suppression"
                checked={aiNoiseReduction}
                onCheckedChange={setAiNoiseReduction}
                disabled={disabled || !initStatus.noiseProcessor}
                icon={<Zap />}
                iconColor="text-green-500/70"
                tooltip={
                  <>
                    <strong>Advanced Noise Suppression:</strong> Uses neural networks to intelligently 
                    remove background noise while preserving audio fidelity.
                  </>
                }
                beta={true}
              />
              
              {aiNoiseReduction && (
                <NoiseReductionSettings
                  noiseReductionStrategy={noiseReductionStrategy}
                  setNoiseReductionStrategy={setNoiseReductionStrategy}
                  noiseReductionIntensity={noiseReductionIntensity}
                  setNoiseReductionIntensity={setNoiseReductionIntensity}
                  disabled={disabled}
                />
              )}
              
              <SwitchWithLabel
                id="content-classification"
                label="Content Classification"
                checked={contentClassification}
                onCheckedChange={setContentClassification}
                disabled={disabled || !initStatus.contentClassifier}
                icon={<Wand2 />}
                iconColor="text-purple-500/70"
                tooltip={
                  <>
                    <strong>Content Classifier:</strong> Identifies the audio content type to enable 
                    genre-specific optimizations and processing.
                  </>
                }
                beta={true}
              />
              
              {contentClassification && (
                <div className="ml-4">
                  <SwitchWithLabel
                    id="auto-processing"
                    label="Auto-Optimize Processing"
                    checked={autoProcessing}
                    onCheckedChange={setAutoProcessing}
                    disabled={disabled}
                    tooltip="Automatically adjusts processing parameters based on the identified content type."
                  />
                </div>
              )}
              
              <SwitchWithLabel
                id="artifact-elimination"
                label="Artifact Elimination"
                checked={artifactElimination}
                onCheckedChange={setArtifactElimination}
                disabled={disabled || !initStatus.artifactEliminator}
                icon={<AlertCircle />}
                iconColor="text-amber-500/70"
                tooltip={
                  <>
                    <strong>Advanced Reconstruction:</strong> Detects and fixes audio artifacts like 
                    clicks, pops, clipping and digital distortion.
                  </>
                }
                beta={true}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AIProcessingSettings;
