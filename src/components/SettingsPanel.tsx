
import React, { useState, useEffect } from 'react';
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

interface SettingsPanelProps {
  disabled?: boolean;
  onSettingsChange?: (settings: {
    mode: string;
    targetLufs: number;
    dryWet: number;
    noiseReduction: number;
    beatQuantization: number;
    swingPreservation: boolean;
    preserveTempo: boolean;
    preserveTone: boolean;
  }) => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ 
  disabled = false,
  onSettingsChange
}) => {
  const [mode, setMode] = useState("music");
  const [targetLufs, setTargetLufs] = useState([-14]);
  const [dryWet, setDryWet] = useState([100]);
  const [beatQuantization, setBeatQuantization] = useState([0]);
  const [swingPreservation, setSwingPreservation] = useState(true);
  const [noiseReduction, setNoiseReduction] = useState([50]);
  const [preserveTempo, setPreserveTempo] = useState(true);
  const [preserveTone, setPreserveTone] = useState(true);

  // Update parent component when settings change
  useEffect(() => {
    if (onSettingsChange) {
      onSettingsChange({
        mode,
        targetLufs: targetLufs[0],
        dryWet: dryWet[0],
        noiseReduction: noiseReduction[0],
        beatQuantization: beatQuantization[0],
        swingPreservation,
        preserveTempo,
        preserveTone
      });
    }
  }, [mode, targetLufs, dryWet, beatQuantization, swingPreservation, noiseReduction, preserveTempo, preserveTone, onSettingsChange]);

  return (
    <div className={`space-y-6 ${disabled ? 'opacity-70' : ''}`}>
      <div className="space-y-2">
        <Label htmlFor="mode">Processing Mode</Label>
        <Select 
          disabled={disabled} 
          value={mode} 
          onValueChange={setMode}
        >
          <SelectTrigger id="mode" className="bg-moroder-dark border border-moroder-primary/20">
            <SelectValue placeholder="Select mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="music">Music</SelectItem>
            <SelectItem value="podcast">Podcast</SelectItem>
            <SelectItem value="vocal">Vocal Stem</SelectItem>
            <SelectItem value="instrumental">Instrumental Stem</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <Separator className="bg-moroder-primary/20" />
      
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="target-lufs">Target Loudness (LUFS)</Label>
            <span className="text-sm text-muted-foreground">{targetLufs[0]} LUFS</span>
          </div>
          <Slider
            id="target-lufs"
            disabled={disabled}
            min={-23}
            max={-5}
            step={0.1}
            value={targetLufs}
            onValueChange={setTargetLufs}
            className="py-2"
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="dry-wet">Dry/Wet Mix</Label>
            <span className="text-sm text-muted-foreground">{dryWet[0]}%</span>
          </div>
          <Slider
            id="dry-wet"
            disabled={disabled}
            min={0}
            max={100}
            step={1}
            value={dryWet}
            onValueChange={setDryWet}
            className="py-2"
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="noise-reduction">Noise Reduction</Label>
            <span className="text-sm text-muted-foreground">{noiseReduction[0]}%</span>
          </div>
          <Slider
            id="noise-reduction"
            disabled={disabled}
            min={0}
            max={100}
            step={1}
            value={noiseReduction}
            onValueChange={setNoiseReduction}
            className="py-2"
          />
        </div>
      </div>
      
      <Separator className="bg-moroder-primary/20" />
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="preserve-tempo" className="cursor-pointer">
            Preserve Tempo & Rhythm
          </Label>
          <Switch
            id="preserve-tempo"
            disabled={disabled}
            checked={preserveTempo}
            onCheckedChange={setPreserveTempo}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="preserve-tone" className="cursor-pointer">
            Preserve Tone & Character
          </Label>
          <Switch
            id="preserve-tone"
            disabled={disabled}
            checked={preserveTone}
            onCheckedChange={setPreserveTone}
          />
        </div>
      </div>
      
      <Separator className="bg-moroder-primary/20" />
      
      {mode === "music" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="beat-quantization">Beat Quantization Strength</Label>
              <span className="text-sm text-muted-foreground">{beatQuantization[0]/100}</span>
            </div>
            <Slider
              id="beat-quantization"
              disabled={disabled}
              min={0}
              max={100}
              step={1}
              value={beatQuantization}
              onValueChange={setBeatQuantization}
              className="py-2"
            />
            {!preserveTempo ? (
              <p className="text-xs text-muted-foreground italic">
                Higher values quantize more strictly but may affect sound quality.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                Tempo preservation is enabled - beat quantization will be applied with sound preservation.
              </p>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="swing-preservation" className="cursor-pointer">
              Swing Preservation
            </Label>
            <Switch
              id="swing-preservation"
              disabled={disabled || beatQuantization[0] === 0}
              checked={swingPreservation}
              onCheckedChange={setSwingPreservation}
            />
          </div>
          <p className="text-xs text-muted-foreground italic">
            When enabled, preserves the groove and feel while applying quantization.
          </p>
        </div>
      )}
    </div>
  );
};

export default SettingsPanel;
