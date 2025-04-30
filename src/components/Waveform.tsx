import React, { useEffect, useRef, useState } from 'react';
import { generateWaveformData } from '@/services/audioVisualization';

interface WaveformProps {
  audioFile?: File;
  currentTime?: number;
  duration?: number;
}

const Waveform: React.FC<WaveformProps> = ({ audioFile, currentTime = 0, duration = 0 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [audioData, setAudioData] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  useEffect(() => {
    if (!audioFile) {
      return;
    }

    setIsLoading(true);
    
    // Process the audio file to extract waveform data
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const audioBuffer = await audioContext.decodeAudioData(e.target?.result as ArrayBuffer);
        
        // Get the audio channel data (using the first channel for mono display)
        const channelData = audioBuffer.getChannelData(0);
        
        // Reduce the data points to a manageable size for display
        const samples = 120; // Number of bars in the waveform
        const blockSize = Math.floor(channelData.length / samples);
        const reducedData = [];
        
        for (let i = 0; i < samples; i++) {
          let sum = 0;
          for (let j = 0; j < blockSize; j++) {
            const index = i * blockSize + j;
            if (index < channelData.length) {
              sum += Math.abs(channelData[index]);
            }
          }
          reducedData.push(sum / blockSize); // Average amplitude for this block
        }
        
        setAudioData(reducedData);
        setIsLoading(false);
        drawWaveform(reducedData);
      } catch (error) {
        console.error("Error decoding audio data:", error);
        setIsLoading(false);
      }
    };
    
    reader.onerror = () => {
      console.error("Error reading audio file");
      setIsLoading(false);
    };
    
    // Start reading the file
    reader.readAsArrayBuffer(audioFile);
  }, [audioFile]);
  
  useEffect(() => {
    if (audioData.length > 0) {
      drawWaveform(audioData);
    }
  }, [currentTime, audioData]);
  
  const drawWaveform = (data: number[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const width = canvas.width;
    const height = canvas.height;
    
    // Find the maximum value to normalize
    const maxValue = Math.max(...data);
    
    // Calculate the playback position
    const playbackPosition = duration > 0 ? (currentTime / duration) * width : 0;
    
    // Set the bar width based on the number of data points
    const barWidth = width / data.length;
    const barGap = 1;
    
    // Draw the waveform
    ctx.fillStyle = 'rgba(155, 135, 245, 0.3)'; // Unplayed part (lighter)
    ctx.strokeStyle = 'rgba(155, 135, 245, 0.6)'; // Border
    
    for (let i = 0; i < data.length; i++) {
      // The x position of this bar
      const x = i * barWidth;
      
      // Normalize the data value to fit in the canvas height
      const barHeight = (data[i] / maxValue) * (height * 0.8);
      
      // Draw the bar centered vertically
      const y = (height - barHeight) / 2;
      
      // Draw the background part
      ctx.beginPath();
      ctx.rect(x, y, barWidth - barGap, barHeight);
      ctx.fill();
      ctx.stroke();
    }
    
    // Draw the played part with a different color
    ctx.fillStyle = 'rgba(155, 135, 245, 0.8)'; // Played part (darker)
    
    for (let i = 0; i < data.length; i++) {
      const x = i * barWidth;
      
      // Only draw until the current playback position
      if (x > playbackPosition) break;
      
      const barHeight = (data[i] / maxValue) * (height * 0.8);
      const y = (height - barHeight) / 2;
      
      ctx.beginPath();
      ctx.rect(x, y, barWidth - barGap, barHeight);
      ctx.fill();
    }
    
    // Draw a playhead line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playbackPosition, 0);
    ctx.lineTo(playbackPosition, height);
    ctx.stroke();
  };
  
  return (
    <div className="w-full h-32 waveform-bg rounded-lg relative overflow-hidden bg-moroder-dark/30 border border-moroder-primary/20">
      {!audioFile ? (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
          <span>No audio file loaded</span>
        </div>
      ) : isLoading ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="animate-pulse flex space-x-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="w-1 h-8 bg-moroder-primary/70 rounded-full"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
          <div className="mt-2 text-sm text-white/80">
            Analyzing audio...
          </div>
        </div>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <canvas 
            ref={canvasRef} 
            width={600} 
            height={120} 
            className="w-full h-full"
          />
          <div className="absolute bottom-0 left-0 right-0 text-sm text-white/80 bg-moroder-dark/50 backdrop-blur-sm px-2 py-1">
            {audioFile.name}
          </div>
        </div>
      )}
    </div>
  );
};

export default Waveform;
