
import React from 'react';
import { Circle, Zap } from "lucide-react";
import SwitchWithLabel from './SwitchWithLabel';

interface PreservationSettingsProps {
  preserveTempo: boolean;
  setPreserveTempo: (value: boolean) => void;
  preserveTone: boolean;
  setPreserveTone: (value: boolean) => void;
  disabled?: boolean;
}

const PreservationSettings: React.FC<PreservationSettingsProps> = ({
  preserveTempo,
  setPreserveTempo,
  preserveTone,
  setPreserveTone,
  disabled = false
}) => {
  return (
    <div className="space-y-4">
      <SwitchWithLabel
        id="preserve-tempo"
        label="Preserve Tempo & Rhythm"
        checked={preserveTempo}
        onCheckedChange={setPreserveTempo}
        disabled={disabled}
        icon={<Zap className="h-4 w-4 text-moroder-primary/60" />}
        tooltip={
          <>
            <strong>Critical Setting:</strong> Guarantees the processed audio maintains its original tempo, time signature, 
            and rhythmic feel while still allowing beat alignment. Strongly recommended to keep enabled.
          </>
        }
      />
      
      <SwitchWithLabel
        id="preserve-tone"
        label="Preserve Tone & Character"
        checked={preserveTone}
        onCheckedChange={setPreserveTone}
        disabled={disabled}
        icon={<Circle className="h-4 w-4 text-moroder-primary/60" />}
        tooltip={
          <>
            <strong>Critical Setting:</strong> Maintains the original tonal qualities, harmonics, and sonic character of the audio 
            while still applying enhancement. Uses advanced spectral processing to ensure pristine sound quality.
          </>
        }
      />
    </div>
  );
};

export default PreservationSettings;
