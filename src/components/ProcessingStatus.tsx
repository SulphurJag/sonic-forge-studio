
import React from 'react';
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle, AlertCircle, AlertTriangle, Wand2, Lightbulb, Music } from "lucide-react";

type ProcessingStatus = 'idle' | 'loading' | 'processing' | 'completed' | 'error';

interface ProcessingStatusProps {
  status: ProcessingStatus;
  progress?: number;
  error?: string;
  results?: {
    inputLufs: number;
    outputLufs: number;
    inputPeak: number;
    outputPeak: number;
    noiseReduction: number;
    contentType?: string[];
    artifactsEliminated?: boolean;
  };
}

const ProcessingStatus: React.FC<ProcessingStatusProps> = ({
  status,
  progress = 0,
  error = '',
  results
}) => {
  const statusDisplay = () => {
    switch (status) {
      case 'idle':
        return (
          <div className="text-center py-6 text-muted-foreground">
            <p>Ready to process audio</p>
          </div>
        );
      
      case 'loading':
        return (
          <div className="flex items-center justify-center space-x-2 text-amber-500 py-6">
            <AlertTriangle className="h-5 w-5" />
            <span>Loading audio file...</span>
          </div>
        );
      
      case 'processing':
        return (
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-center space-x-2 text-moroder-primary">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Processing audio...</span>
            </div>
            <Progress value={progress} className="h-2 bg-moroder-primary/20" />
            <p className="text-center text-sm text-muted-foreground">
              {progress.toFixed(0)}% completed
            </p>
          </div>
        );
      
      case 'completed':
        if (!results) return null;
        return (
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-center space-x-2 text-green-500">
              <CheckCircle className="h-5 w-5" />
              <span>Processing complete</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-moroder-light">Before</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">LUFS:</span>
                    <span className="font-mono">{results.inputLufs.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Peak:</span>
                    <span className="font-mono">{results.inputPeak.toFixed(1)} dB</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-moroder-light">After</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">LUFS:</span>
                    <span className="font-mono">{results.outputLufs.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Peak:</span>
                    <span className="font-mono">{results.outputPeak.toFixed(1)} dB</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-center space-x-1 pt-2 text-center text-sm">
              <Wand2 className="h-4 w-4 text-moroder-accent" />
              <span className="text-moroder-accent">
                Noise Reduction: {results.noiseReduction.toFixed(1)} dB
              </span>
            </div>
            
            {results.contentType && results.contentType.length > 0 && (
              <div className="flex items-center justify-center space-x-1 pt-1 text-center text-sm">
                <Music className="h-4 w-4 text-purple-400" />
                <span className="text-purple-400">
                  Content Type: {results.contentType.join(', ')}
                </span>
              </div>
            )}
            
            {results.artifactsEliminated && (
              <div className="flex items-center justify-center space-x-1 pt-1 text-center text-sm">
                <Lightbulb className="h-4 w-4 text-amber-400" />
                <span className="text-amber-400">
                  Audio artifacts detected and fixed
                </span>
              </div>
            )}
            
            <p className="text-xs text-center text-muted-foreground italic mt-2">
              All original sonic characteristics have been preserved while enhancing audio quality
            </p>
          </div>
        );
      
      case 'error':
        return (
          <div className="flex flex-col items-center justify-center space-y-2 text-red-500 py-6">
            <AlertCircle className="h-5 w-5" />
            <span>{error || 'An error occurred during processing'}</span>
            {error?.includes('Audio context or buffer not initialized') && (
              <p className="text-sm text-center max-w-md">
                Please make sure the audio file is fully loaded before processing. 
                Try uploading the file again and wait for it to load completely.
              </p>
            )}
          </div>
        );
    }
  };

  return (
    <div className="bg-moroder-dark/60 backdrop-blur-sm rounded-lg border border-moroder-primary/20 p-4">
      <h3 className="text-sm font-medium mb-2 text-moroder-light">Processing Status</h3>
      {statusDisplay()}
    </div>
  );
};

export default ProcessingStatus;
