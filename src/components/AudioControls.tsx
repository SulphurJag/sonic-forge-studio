
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, SkipBack, Volume2, Volume1, VolumeX } from "lucide-react";

interface AudioControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onRestart: () => void;
  audioFile?: File;
}

const AudioControls: React.FC<AudioControlsProps> = ({
  isPlaying,
  onPlayPause,
  onRestart,
  audioFile
}) => {
  const [volume, setVolume] = useState([80]);
  
  const VolumeIcon = () => {
    if (volume[0] === 0) return <VolumeX className="h-4 w-4" />;
    if (volume[0] < 50) return <Volume1 className="h-4 w-4" />;
    return <Volume2 className="h-4 w-4" />;
  };
  
  return (
    <div className="w-full flex items-center space-x-2 py-2 px-4 bg-moroder-dark/50 backdrop-blur-sm rounded-lg border border-moroder-primary/10">
      <Button 
        variant="outline" 
        size="sm" 
        className={`rounded-full p-2 h-10 w-10 ${!audioFile ? 'opacity-50 cursor-not-allowed' : ''}`}
        disabled={!audioFile}
        onClick={onRestart}
      >
        <SkipBack className="h-4 w-4" />
      </Button>
      
      <Button 
        variant="outline" 
        size="sm" 
        className={`rounded-full p-2 h-10 w-10 ${!audioFile ? 'opacity-50 cursor-not-allowed' : ''}`}
        disabled={!audioFile}
        onClick={onPlayPause}
      >
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>
      
      {/* Time display */}
      <div className="text-xs text-muted-foreground">
        00:00 / {audioFile ? '00:00' : '--:--'}
      </div>
      
      {/* Progress bar placeholder */}
      <div className="relative w-full h-1.5 bg-muted rounded-full overflow-hidden">
        <div 
          className="absolute top-0 left-0 h-full bg-moroder-primary/70 rounded-full"
          style={{ width: '0%' }}
        />
      </div>
      
      {/* Volume control */}
      <div className="flex items-center space-x-2 min-w-[100px]">
        <VolumeIcon />
        <Slider
          value={volume}
          max={100}
          step={1}
          className="w-20"
          onValueChange={(value) => setVolume(value)}
        />
      </div>
    </div>
  );
};

export default AudioControls;
