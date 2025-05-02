
import React, { useState, useEffect } from 'react';
import { Separator } from "@/components/ui/separator";
import ModeSelector from './settings/ModeSelector';
import AudioQualitySettings from './settings/AudioQualitySettings';
import PreservationSettings from './settings/PreservationSettings';
import BeatAlignmentSettings from './settings/BeatAlignmentSettings';

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
    beatCorrectionMode?: string;
    beatAnalysisIntensity?: number;
    transientPreservation?: boolean;
    phaseAlignment?: boolean;
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
  
  // Advanced rhythm correction options
  const [advancedRhythmOptions, setAdvancedRhythmOptions] = useState(false);
  const [transientPreservation, setTransientPreservation] = useState(true);
  const [phaseAlignment, setPhaseAlignment] = useState(true);
  const [beatAnalysisIntensity, setBeatAnalysisIntensity] = useState([75]);

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
        preserveTone,
        beatCorrectionMode,
        beatAnalysisIntensity: beatAnalysisIntensity[0],
        transientPreservation,
        phaseAlignment
      });
    }
  }, [
    mode, 
    targetLufs, 
    dryWet, 
    beatQuantization, 
    swingPreservation, 
    noiseReduction, 
    preserveTempo, 
    preserveTone, 
    beatCorrectionMode, 
    beatAnalysisIntensity,
    transientPreservation,
    phaseAlignment,
    onSettingsChange
  ]);

  return (
    <div className={`space-y-6 ${disabled ? 'opacity-70' : ''}`}>
      <ModeSelector 
        mode={mode} 
        onModeChange={setMode} 
        disabled={disabled} 
      />
      
      <Separator className="bg-moroder-primary/20" />
      
      <AudioQualitySettings
        targetLufs={targetLufs}
        setTargetLufs={setTargetLufs}
        dryWet={dryWet}
        setDryWet={setDryWet}
        noiseReduction={noiseReduction}
        setNoiseReduction={setNoiseReduction}
        disabled={disabled}
      />
      
      <Separator className="bg-moroder-primary/20" />
      
      <PreservationSettings
        preserveTempo={preserveTempo}
        setPreserveTempo={setPreserveTempo}
        preserveTone={preserveTone}
        setPreserveTone={setPreserveTone}
        disabled={disabled}
      />
      
      <Separator className="bg-moroder-primary/20" />
      
      {mode === "music" && (
        <BeatAlignmentSettings
          beatQuantization={beatQuantization}
          setBeatQuantization={setBeatQuantization}
          swingPreservation={swingPreservation}
          setSwingPreservation={setSwingPreservation}
          preserveTempo={preserveTempo}
          beatCorrectionMode={beatCorrectionMode}
          setBeatCorrectionMode={setBeatCorrectionMode}
          advancedRhythmOptions={advancedRhythmOptions}
          setAdvancedRhythmOptions={setAdvancedRhythmOptions}
          beatAnalysisIntensity={beatAnalysisIntensity}
          setBeatAnalysisIntensity={setBeatAnalysisIntensity}
          transientPreservation={transientPreservation}
          setTransientPreservation={setTransientPreservation}
          phaseAlignment={phaseAlignment}
          setPhaseAlignment={setPhaseAlignment}
          disabled={disabled}
        />
      )}
    </div>
  );
};

export default SettingsPanel;
