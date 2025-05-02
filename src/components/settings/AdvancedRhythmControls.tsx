
import React from 'react';
import SliderWithLabel from './SliderWithLabel';
import SwitchWithLabel from './SwitchWithLabel';

interface AdvancedRhythmControlsProps {
  beatAnalysisIntensity: number[];
  setBeatAnalysisIntensity: (value: number[]) => void;
  transientPreservation: boolean;
  setTransientPreservation: (value: boolean) => void;
  phaseAlignment: boolean;
  setPhaseAlignment: (value: boolean) => void;
  disabled?: boolean;
}

const AdvancedRhythmControls: React.FC<AdvancedRhythmControlsProps> = ({
  beatAnalysisIntensity,
  setBeatAnalysisIntensity,
  transientPreservation,
  setTransientPreservation,
  phaseAlignment,
  setPhaseAlignment,
  disabled = false
}) => {
  return (
    <div className="space-y-4 px-3 py-3 border border-moroder-primary/10 rounded-md bg-moroder-dark/20">
      <SliderWithLabel
        id="beat-analysis"
        label="Beat Analysis Precision"
        value={beatAnalysisIntensity}
        onValueChange={setBeatAnalysisIntensity}
        min={25}
        max={100}
        step={1}
        disabled={disabled}
        unit="%"
        tooltip={
          <>
            Controls how thoroughly the algorithm analyzes the audio to detect beats. Higher values provide more accurate 
            beat detection while still maintaining the original sonic character.
          </>
        }
      />
      <p className="text-xs text-muted-foreground">
        Higher values provide more detailed temporal analysis without over-correcting 
        intentional timing variations.
      </p>
      
      <SwitchWithLabel
        id="transient-preservation"
        label="Preserve Transients"
        checked={transientPreservation}
        onCheckedChange={setTransientPreservation}
        disabled={disabled}
        tooltip={
          <>
            Maintains the attack characteristics and dynamic impact of percussive elements even when
            their timing is adjusted. Essential for preserving the punch and clarity of drums, percussion, and other
            transient-rich sounds.
          </>
        }
      />
      
      <SwitchWithLabel
        id="phase-alignment"
        label="Phase Coherence"
        checked={phaseAlignment}
        onCheckedChange={setPhaseAlignment}
        disabled={disabled}
        tooltip={
          <>
            Ensures phase coherence is maintained when aligning beats, preventing 
            artifacts and maintaining clarity. Critical for preserving spatial image and preventing
            frequency cancellation during timing adjustments.
          </>
        }
      />
    </div>
  );
};

export default AdvancedRhythmControls;
