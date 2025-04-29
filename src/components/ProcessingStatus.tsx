
import React from 'react';
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

type ProcessingStatus = 'idle' | 'processing' | 'completed' | 'error';

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
            
            <div className="pt-2 text-center text-sm">
              <span className="text-moroder-accent">
                Noise Reduction: {results.noiseReduction.toFixed(1)} dB
              </span>
            </div>
          </div>
        );
      
      case 'error':
        return (
          <div className="flex items-center justify-center space-x-2 text-red-500 py-6">
            <AlertCircle className="h-5 w-5" />
            <span>{error || 'An error occurred during processing'}</span>
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
