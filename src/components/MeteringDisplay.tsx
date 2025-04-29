
import React, { useEffect, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";

interface MeteringDisplayProps {
  isActive?: boolean;
}

const MeteringDisplay: React.FC<MeteringDisplayProps> = ({ isActive = false }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Simulate frequency analyzer visualization
  useEffect(() => {
    if (!isActive || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions
    const setCanvasDimensions = () => {
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = width * 2; // For high DPI displays
      canvas.height = height * 2;
      ctx.scale(2, 2); // Scale for high DPI
    };
    
    setCanvasDimensions();
    window.addEventListener('resize', setCanvasDimensions);
    
    // Animation variables
    let animationId: number;
    const barCount = 256;
    const barWidth = canvas.width / (2 * barCount);
    const maxBarHeight = canvas.height / 2;
    
    // Create initial data array
    const freqData = new Array(barCount).fill(0).map(() => 
      Math.random() * 0.5 + (isActive ? 0.3 : 0.1)
    );
    
    // Animation function
    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width / 2, canvas.height / 2);
      
      // Update data with slight random variation
      for (let i = 0; i < barCount; i++) {
        // Smoothly update values
        const target = Math.random() * 0.5 + (isActive ? 0.3 : 0.1);
        freqData[i] = freqData[i] * 0.9 + target * 0.1;
        
        // Add frequency distribution (more energy in lows and mids)
        let heightFactor = 1;
        if (i < barCount * 0.2) {
          // Bass frequencies
          heightFactor = 0.8 + Math.sin(i / (barCount * 0.2) * Math.PI) * 0.4;
        } else if (i < barCount * 0.6) {
          // Mid frequencies
          heightFactor = 0.7 + Math.sin((i - barCount * 0.2) / (barCount * 0.4) * Math.PI) * 0.3;
        } else {
          // High frequencies
          heightFactor = 0.5 - (i - barCount * 0.6) / (barCount * 0.4) * 0.3;
        }
        
        const barHeight = freqData[i] * maxBarHeight * heightFactor;
        
        // Create gradient for bars
        const gradient = ctx.createLinearGradient(0, maxBarHeight, 0, maxBarHeight - barHeight);
        gradient.addColorStop(0, 'rgba(155, 135, 245, 0.8)');
        gradient.addColorStop(1, 'rgba(30, 174, 219, 0.4)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(i * barWidth, maxBarHeight - barHeight, barWidth - 1, barHeight);
      }
      
      animationId = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', setCanvasDimensions);
    };
  }, [isActive]);
  
  // VU meter values
  const lufsValue = isActive ? -14.3 : -Infinity;
  const peakValue = isActive ? -1.2 : -Infinity;
  
  return (
    <div className="space-y-4">
      <Card className="bg-moroder-dark border-moroder-primary/20">
        <CardContent className="p-4 space-y-2">
          <h3 className="text-sm font-medium text-moroder-light">Spectrum Analyzer</h3>
          <div className="h-32 bg-moroder-dark/70 rounded-md border border-moroder-primary/10 overflow-hidden">
            <canvas ref={canvasRef} className="w-full h-full" />
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-moroder-dark border-moroder-primary/20">
        <CardContent className="p-4 space-y-4">
          <h3 className="text-sm font-medium text-moroder-light">Loudness Meters</h3>
          
          <div className="flex justify-between items-center mt-2">
            <div className="space-y-1 w-1/2 pr-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">LUFS</span>
                <span className="font-mono">{lufsValue === -Infinity ? '--' : lufsValue.toFixed(1)}</span>
              </div>
              <div className="h-4 bg-moroder-dark/70 rounded-md border border-moroder-primary/10 overflow-hidden relative">
                <div 
                  className={`absolute top-0 left-0 h-full transition-all duration-300 ${
                    lufsValue > -10 ? 'bg-red-500' : 
                    lufsValue > -14 ? 'bg-yellow-500' : 
                    'bg-green-500'
                  }`}
                  style={{ 
                    width: `${lufsValue === -Infinity ? 0 : Math.max(0, Math.min(100, (lufsValue + 23) / 18 * 100))}%` 
                  }}
                />
              </div>
            </div>
            
            <div className="space-y-1 w-1/2 pl-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Peak dBTP</span>
                <span className="font-mono">{peakValue === -Infinity ? '--' : peakValue.toFixed(1)}</span>
              </div>
              <div className="h-4 bg-moroder-dark/70 rounded-md border border-moroder-primary/10 overflow-hidden relative">
                <div 
                  className={`absolute top-0 left-0 h-full transition-all duration-300 ${
                    peakValue > -0.5 ? 'bg-red-500' : 
                    peakValue > -3 ? 'bg-yellow-500' : 
                    'bg-green-500'
                  }`}
                  style={{ 
                    width: `${peakValue === -Infinity ? 0 : Math.max(0, Math.min(100, (peakValue + 40) / 40 * 100))}%` 
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MeteringDisplay;
