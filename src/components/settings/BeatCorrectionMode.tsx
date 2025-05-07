
import React from 'react';
import { Label } from "@/components/ui/label";
import {
  ToggleGroup,
  ToggleGroupItem
} from "@/components/ui/toggle-group";

interface BeatCorrectionModeProps {
  value: string;
  onValueChange: (value: string) => void;
}

const BeatCorrectionMode: React.FC<BeatCorrectionModeProps> = ({
  value,
  onValueChange
}) => {
  // Ensure non-empty value is passed to toggle group
  const handleValueChange = (val: string) => {
    if (val) onValueChange(val);
  };

  return (
    <div className="mt-2 space-y-2">
      <Label>Beat Alignment Mode</Label>
      <ToggleGroup 
        type="single" 
        variant="outline"
        value={value}
        onValueChange={handleValueChange}
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
        <ToggleGroupItem value="surgical" className="text-xs">
          Surgical
        </ToggleGroupItem>
      </ToggleGroup>
      <p className="text-xs text-muted-foreground italic">
        {value === "gentle" && 
          "Subtle alignment that prioritizes preserving the original sound and feel of the music."}
        {value === "balanced" && 
          "Moderate alignment with excellent sound preservation and noticeable timing improvements."}
        {value === "precise" && 
          "Strong alignment that delivers professional-grade timing accuracy while maintaining character."}
        {value === "surgical" && 
          "Maximum precision alignment using advanced AI spectral analysis for perfect timing."}
      </p>
    </div>
  );
};

export default BeatCorrectionMode;
