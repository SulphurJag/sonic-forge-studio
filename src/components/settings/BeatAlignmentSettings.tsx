
import React from 'react';
import SliderWithLabel from './SliderWithLabel';
import SwitchWithLabel from './SwitchWithLabel';
import BeatCorrectionMode from './BeatCorrectionMode';
import AdvancedRhythmControls from './AdvancedRhythmControls';

interface BeatAlignmentSettingsProps {
  beatQuantization: number[];
  setBeatQuantization: (value: number[]) => void;
  swingPreservation: boolean;
  setSwingPreservation: (value: boolean) => void;
  preserveTempo: boolean;
  beatCorrectionMode: string;
  setBeatCorrectionMode: (value: string) => void;
  advancedRhythmOptions: boolean;
  setAdvancedRhythmOptions: (value: boolean) => void;
  beatAnalysisIntensity: number[];
  setBeatAnalysisIntensity: (value: number[]) => void;
  transientPreservation: boolean;
  setTransientPreservation: (value: boolean) => void;
  phaseAlignment: boolean;
  setPhaseAlignment: (value: boolean) => void;
  disabled?: boolean;
}

const BeatAlignmentSettings: React.FC<BeatAlignmentSettingsProps> = ({
  beatQuantization,
  setBeatQuantization,
  swingPreservation,
  setSwingPreservation,
  preserveTempo,
  beatCorrectionMode,
  setBeatCorrectionMode,
  advancedRhythmOptions,
  setAdvancedRhythmOptions,
  beatAnalysisIntensity,
  setBeatAnalysisIntensity,
  transientPreservation,
  setTransientPreservation,
  phaseAlignment,
  setPhaseAlignment,
  disabled = false
}) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <SliderWithLabel
          id="beat-quantization"
          label="Beat Alignment Strength"
          value={beatQuantization}
          onValueChange={setBeatQuantization}
          min={0}
          max={100}
          step={1}
          disabled={disabled}
          tooltip={
            <>
              Intelligently aligns off-beat elements to the grid while preserving the 
              original audio character. Higher values apply stronger correction without changing
              the song's fundamental structure or feel.
            </>
          }
        />
        
        {beatQuantization[0] > 0 && (
          <BeatCorrectionMode
            value={beatCorrectionMode}
            onValueChange={setBeatCorrectionMode}
          />
        )}
        
        {preserveTempo ? (
          <p className="text-xs text-muted-foreground italic">
            With Tempo Preservation enabled, beat alignment will correct timing issues while 
            maintaining the original feel, groove, and timing structure of the music.
          </p>
        ) : (
          <p className="text-xs text-amber-400/90 italic mt-1 font-medium">
            Warning: Disabling Tempo Preservation with beat alignment may significantly alter 
            the original timing and feel of the music.
          </p>
        )}
      </div>
      
      <SwitchWithLabel
        id="swing-preservation"
        label="Preserve Groove & Swing"
        checked={swingPreservation}
        onCheckedChange={setSwingPreservation}
        disabled={disabled || beatQuantization[0] === 0}
        tooltip={
          <>
            <strong>Critical Setting:</strong> Maintains the natural groove, feel and swing of the music when applying beat 
            alignment. Ensures beats aren't over-quantized to a rigid grid, preserving the human feel.
          </>
        }
      />
      
      {beatQuantization[0] > 25 && (
        <SwitchWithLabel
          id="advanced-options"
          label="Advanced Rhythm Controls"
          checked={advancedRhythmOptions}
          onCheckedChange={setAdvancedRhythmOptions}
          disabled={disabled}
          tooltip={
            <>
              Unlock professional-grade controls for fine-tuning beat alignment behavior. These settings help ensure
              perfect timing while maintaining the sonic integrity of the original recording.
            </>
          }
        />
      )}
      
      {advancedRhythmOptions && beatQuantization[0] > 0 && (
        <AdvancedRhythmControls
          beatAnalysisIntensity={beatAnalysisIntensity}
          setBeatAnalysisIntensity={setBeatAnalysisIntensity}
          transientPreservation={transientPreservation}
          setTransientPreservation={setTransientPreservation}
          phaseAlignment={phaseAlignment}
          setPhaseAlignment={setPhaseAlignment}
          disabled={disabled}
        />
      )}
      
      <p className="text-xs text-muted-foreground italic">
        {beatQuantization[0] > 0 ? (
          <>
            Beat alignment intelligently corrects timing while preserving the musical essence.
            {beatCorrectionMode === "surgical" && " Surgical mode applies advanced spectral analysis for perfect timing correction without artifacts."}
          </>
        ) : (
          "Beat alignment is currently disabled. Increase the value to enable intelligent beat correction."  
        )}
      </p>
    </div>
  );
};

export default BeatAlignmentSettings;
