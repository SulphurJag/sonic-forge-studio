
import React, { useState, useRef, useEffect } from 'react';
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
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioSrcRef = useRef<string | null>(null);
  
  // Create or update audio element when audioFile changes
  useEffect(() => {
    if (!audioFile) {
      return;
    }
    
    // Revoke previous URL if it exists
    if (audioSrcRef.current) {
      URL.revokeObjectURL(audioSrcRef.current);
    }
    
    // Create new audio element
    if (!audioRef.current) {
      audioRef.current = new Audio();
      
      // Set up audio event listeners
      audioRef.current.addEventListener('loadedmetadata', () => {
        setDuration(audioRef.current?.duration || 0);
      });
      
      audioRef.current.addEventListener('timeupdate', () => {
        setCurrentTime(audioRef.current?.currentTime || 0);
      });
      
      audioRef.current.addEventListener('ended', () => {
        onPlayPause(); // This will set isPlaying to false
      });
    }
    
    // Create object URL for the audio file
    audioSrcRef.current = URL.createObjectURL(audioFile);
    audioRef.current.src = audioSrcRef.current;
    audioRef.current.load();
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (audioSrcRef.current) {
        URL.revokeObjectURL(audioSrcRef.current);
        audioSrcRef.current = null;
      }
    };
  }, [audioFile]);
  
  // Handle play/pause state changes
  useEffect(() => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.play().catch(error => {
        console.error("Audio play error:", error);
        onPlayPause(); // Set isPlaying back to false on error
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, onPlayPause]);
  
  // Handle volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume[0] / 100;
    }
  }, [volume]);
  
  // Handle restart
  const handleRestart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      onRestart();
    }
  };
  
  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
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
        onClick={handleRestart}
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
        {formatTime(currentTime)} / {audioFile ? formatTime(duration) : '--:--'}
      </div>
      
      {/* Progress bar */}
      <div className="relative w-full h-1.5 bg-muted rounded-full overflow-hidden cursor-pointer"
        onClick={(e) => {
          if (!audioRef.current || !audioFile) return;
          
          const rect = e.currentTarget.getBoundingClientRect();
          const pos = (e.clientX - rect.left) / rect.width;
          const newTime = pos * duration;
          
          audioRef.current.currentTime = newTime;
          setCurrentTime(newTime);
        }}
      >
        <div 
          className="absolute top-0 left-0 h-full bg-moroder-primary/70 rounded-full"
          style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
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
