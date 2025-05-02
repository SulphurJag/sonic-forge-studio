
import React from 'react';
import SliderWithLabel from './SliderWithLabel';

interface AudioQualitySettingsProps {
  targetLufs: number[];
  setTargetLufs: (value: number[]) => void;
  dryWet: number[];
  setDryWet: (value: number[]) => void;
  noiseReduction: number[];
  setNoiseReduction: (value: number[]) => void;
  disabled?: boolean;
}

const AudioQualitySettings: React.FC<AudioQualitySettingsProps> = ({
  targetLufs,
  setTargetLufs,
  dryWet,
  setDryWet,
  noiseReduction,
  setNoiseReduction,
  disabled = false
}) => {
  return (
    <div className="space-y-4">
      <SliderWithLabel
        id="target-lufs"
        label="Target Loudness (LUFS)"
        value={targetLufs}
        onValueChange={setTargetLufs}
        min={-23}
        max={-5}
        step={0.1}
        disabled={disabled}
        unit=" LUFS"
        tooltip={
          <>
            Sets the integrated loudness target for mastering. Industry standards: Music streaming: -14 LUFS, 
            Podcasts: -16 LUFS, Cinema: -23 LUFS.
          </>
        }
      />
      
      <SliderWithLabel
        id="dry-wet"
        label="Dry/Wet Mix"
        value={dryWet}
        onValueChange={setDryWet}
        min={0}
        max={100}
        step={1}
        disabled={disabled}
        unit="%"
      />
      
      <SliderWithLabel
        id="noise-reduction"
        label="Noise Reduction"
        value={noiseReduction}
        onValueChange={setNoiseReduction}
        min={0}
        max={100}
        step={1}
        disabled={disabled}
        unit="%"
        tooltip={
          <>
            Advanced spectral noise reduction that preserves musical details. Higher values provide stronger reduction
            but may affect audio quality if set too high.
          </>
        }
      />
    </div>
  );
};

export default AudioQualitySettings;
