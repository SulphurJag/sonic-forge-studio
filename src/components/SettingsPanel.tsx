
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
import {
  ToggleGroup,
  ToggleGroupItem
} from "@/components/ui/toggle-group";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  
  // Beat correction mode
  const [beatCorrectionMode, setBeatCorrectionMode] = useState("gentle");

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
          <div className="flex items-center space-x-2">
            <Label htmlFor="preserve-tempo" className="cursor-pointer">
              Preserve Tempo & Rhythm
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-moroder-primary/60" />
                </TooltipTrigger>
                <TooltipContent className="max-w-[300px]">
                  Ensures the processed audio maintains its original tempo, time signature, 
                  and rhythmic feel. Essential for preserving the musical integrity.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Switch
            id="preserve-tempo"
            disabled={disabled}
            checked={preserveTempo}
            onCheckedChange={setPreserveTempo}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Label htmlFor="preserve-tone" className="cursor-pointer">
              Preserve Tone & Character
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-moroder-primary/60" />
                </TooltipTrigger>
                <TooltipContent className="max-w-[300px]">
                  Maintains the original tonal qualities and sonic character of the audio 
                  while still applying enhancement. Uses gentler processing techniques.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
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
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Label htmlFor="beat-quantization">Beat Correction Strength</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-moroder-primary/60" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[300px]">
                      Gently aligns off-beat elements to the grid while preserving the 
                      original audio character. Higher values apply stronger correction.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
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
            
            {beatQuantization[0] > 0 && (
              <div className="mt-2 space-y-2">
                <Label className="text-sm">Beat Correction Mode</Label>
                <ToggleGroup 
                  type="single" 
                  variant="outline"
                  value={beatCorrectionMode}
                  onValueChange={(value) => {
                    if (value) setBeatCorrectionMode(value);
                  }}
                  className="justify-start"
                >
                  <ToggleGroupItem value="gentle" className="text-xs">
                    Gentle
                  </ToggleGroupItem>
                  <ToggleGroupItem value="balanced" className="text-xs">
                    Balanced
                  </ToggleGroupItem>
                  <ToggleGroupItem value="precise" className="text-xs">
                    Precise
                  </ToggleGroupItem>
                </ToggleGroup>
                <p className="text-xs text-muted-foreground italic">
                  {beatCorrectionMode === "gentle" && 
                    "Subtle correction that prioritizes preserving the original sound."}
                  {beatCorrectionMode === "balanced" && 
                    "Moderate correction with good sound preservation."}
                  {beatCorrectionMode === "precise" && 
                    "Strong correction that prioritizes rhythmic accuracy."}
                </p>
              </div>
            )}
            
            {preserveTempo ? (
              <p className="text-xs text-muted-foreground italic">
                With Tempo Preservation enabled, beat correction will align elements while 
                maintaining the original feel and timing of the music.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground italic mt-1">
                <span className="text-amber-400">Note:</span> Disabling Tempo Preservation 
                may alter the original timing of the music.
              </p>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Label htmlFor="swing-preservation" className="cursor-pointer">
                Preserve Groove & Swing
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-moroder-primary/60" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[300px]">
                    Maintains the natural groove and swing feel of the music when applying beat 
                    correction. Ensures beats aren't over-quantized to a rigid grid.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Switch
              id="swing-preservation"
              disabled={disabled || beatQuantization[0] === 0}
              checked={swingPreservation}
              onCheckedChange={setSwingPreservation}
            />
          </div>
          <p className="text-xs text-muted-foreground italic">
            Preserves the natural groove and feel of the music while correcting timing issues.
          </p>
        </div>
      )}
    </div>
  );
};

export default SettingsPanel;
