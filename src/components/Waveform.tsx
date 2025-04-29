
import React from 'react';

interface WaveformProps {
  audioFile?: File;
}

const Waveform: React.FC<WaveformProps> = ({ audioFile }) => {
  // This is a placeholder component - in a real implementation, we would use 
  // a library like wavesurfer.js to render the actual audio waveform
  return (
    <div className="w-full h-32 waveform-bg rounded-lg relative overflow-hidden">
      {!audioFile ? (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
          <span>No audio file loaded</span>
        </div>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {/* Audio visualization placeholder */}
          <div className="flex items-end space-x-1 h-16">
            {Array.from({ length: 50 }).map((_, i) => {
              const height = Math.sin(i * 0.2) * 0.5 + 0.5;
              return (
                <div
                  key={i}
                  className="w-1 bg-moroder-primary"
                  style={{
                    height: `${height * 100}%`,
                    opacity: Math.random() * 0.5 + 0.5
                  }}
                />
              );
            })}
          </div>
          <div className="mt-2 text-sm text-white/80">
            {audioFile.name}
          </div>
        </div>
      )}
    </div>
  );
};

export default Waveform;
