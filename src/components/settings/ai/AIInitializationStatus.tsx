
import React from 'react';
import { AlertCircle, Loader2, MonitorSmartphone } from "lucide-react";

interface AIInitializationStatusProps {
  isInitializing: boolean;
  initStatus: {
    noiseProcessor: boolean;
    contentClassifier: boolean;
    artifactEliminator: boolean;
    overall: boolean;
    hasWebGPU: boolean;
  };
  enableAI: boolean;
}

const AIInitializationStatus: React.FC<AIInitializationStatusProps> = ({
  isInitializing,
  initStatus,
  enableAI
}) => {
  if (isInitializing) {
    return (
      <div className="flex items-center space-x-2 text-sm text-moroder-primary">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Initializing AI models...</span>
      </div>
    );
  }
  
  if (!initStatus.overall && enableAI && !isInitializing) {
    return (
      <div className="rounded-md bg-yellow-500/10 p-3 text-xs text-yellow-600">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5" />
          <span>
            Using simulated AI processing since models are not fully loaded.
          </span>
        </div>
      </div>
    );
  }
  
  if (!initStatus.hasWebGPU && enableAI && !isInitializing && initStatus.overall) {
    return (
      <div className="rounded-md bg-blue-500/10 p-3 text-xs text-blue-600">
        <div className="flex items-start gap-2">
          <MonitorSmartphone className="h-4 w-4 mt-0.5" />
          <span>
            Using simplified AI processing because WebGPU is not supported in your browser.
            For full AI capabilities, try Chrome 113+ or Edge 113+.
          </span>
        </div>
      </div>
    );
  }
  
  return null;
};

export default AIInitializationStatus;
