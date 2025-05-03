
import React from 'react';
import { Cpu, Zap, Wand2, AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import SwitchWithLabel from './SwitchWithLabel';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SliderWithLabel from './SliderWithLabel';
import { aiAudioProcessor } from '@/services/aiAudioProcessing';

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
    overall: false
  });

  // Check initialization status when the component mounts
  React.useEffect(() => {
    const status = aiAudioProcessor.getInitializationStatus();
    setInitStatus(status);
  }, []);

  // Initialize AI processor if needed
  const handleEnableAI = async (value: boolean) => {
    if (value && !initStatus.overall) {
      const initialized = await aiAudioProcessor.initialize();
      setInitStatus(aiAudioProcessor.getInitializationStatus());
      setEnableAI(initialized);
    } else {
      setEnableAI(value);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Cpu className="h-4 w-4" /> AI Audio Processing
            <span className="inline-flex items-center rounded-md bg-moroder-accent/20 px-2 py-0.5 text-xs font-medium text-moroder-accent">
              Beta
            </span>
          </h3>
          <p className="text-xs text-muted-foreground max-w-[300px] mt-1">
            Advanced AI-powered processing for superior audio quality
          </p>
        </div>
        <Switch
          id="enable-ai"
          disabled={disabled}
          checked={enableAI}
          onCheckedChange={handleEnableAI}
        />
      </div>
      
      {enableAI && (
        <div className="space-y-4 pl-1 border-l-2 border-moroder-primary/20 ml-2">
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
            <div className="space-y-4 ml-4">
              <div className="space-y-2">
                <Label htmlFor="noise-strategy" className="text-xs">Suppression Strategy</Label>
                <Select 
                  disabled={disabled} 
                  value={noiseReductionStrategy} 
                  onValueChange={(v) => setNoiseReductionStrategy(v as any)}
                >
                  <SelectTrigger id="noise-strategy" className="bg-moroder-dark border border-moroder-primary/20 h-8 text-sm">
                    <SelectValue placeholder="Select strategy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto-detect</SelectItem>
                    <SelectItem value="dtln">DTLN (Deep filtering)</SelectItem>
                    <SelectItem value="spectral">Spectral Gating</SelectItem>
                    <SelectItem value="nsnet">NSNet RNN</SelectItem>
                    <SelectItem value="hybrid">Hybrid Blend</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <SliderWithLabel
                label="Suppression Intensity"
                value={noiseReductionIntensity}
                onValueChange={setNoiseReductionIntensity}
                min={0}
                max={100}
                step={1}
                disabled={disabled}
                tooltip="Controls how aggressively noise is reduced. Higher values remove more noise but may affect audio quality."
                valueLabel={`${noiseReductionIntensity[0]}%`}
              />
            </div>
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
                <strong>YAMNet Classification:</strong> Identifies the audio content type to enable 
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
                clicks, pops, clipping and digital distortion using GANs.
              </>
            }
            beta={true}
          />
          
          {!initStatus.overall && enableAI && (
            <div className="rounded-md bg-yellow-500/10 p-3 text-xs text-yellow-600">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5" />
                <span>
                  AI Models are still initializing. Some features may be temporarily disabled. 
                  This can take a few seconds on the first use.
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIProcessingSettings;
