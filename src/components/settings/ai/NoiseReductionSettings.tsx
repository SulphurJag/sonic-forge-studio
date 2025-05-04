
import React from 'react';
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SliderWithLabel from '../SliderWithLabel';

interface NoiseReductionSettingsProps {
  noiseReductionStrategy: 'auto' | 'dtln' | 'spectral' | 'nsnet' | 'hybrid';
  setNoiseReductionStrategy: (value: 'auto' | 'dtln' | 'spectral' | 'nsnet' | 'hybrid') => void;
  noiseReductionIntensity: number[];
  setNoiseReductionIntensity: (value: number[]) => void;
  disabled?: boolean;
}

const NoiseReductionSettings: React.FC<NoiseReductionSettingsProps> = ({
  noiseReductionStrategy,
  setNoiseReductionStrategy,
  noiseReductionIntensity,
  setNoiseReductionIntensity,
  disabled = false
}) => {
  return (
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
  );
};

export default NoiseReductionSettings;
