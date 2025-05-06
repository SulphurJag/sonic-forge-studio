
import React from 'react';
import { Loader2, CheckCircle, AlertCircle, Cpu, Cloud } from "lucide-react";
import { ProcessingMode } from '@/services/ai/models/modelTypes';

interface AIInitializationStatusProps {
  isInitializing: boolean;
  initStatus: {
    noiseProcessor: boolean;
    contentClassifier: boolean;
    artifactEliminator: boolean;
    overall: boolean;
    hasWebGPU: boolean;
    processingMode?: ProcessingMode;
  };
  enableAI: boolean;
}

const AIInitializationStatus: React.FC<AIInitializationStatusProps> = ({
  isInitializing,
  initStatus,
  enableAI
}) => {
  const renderStatusIcon = (isReady: boolean) => {
    if (isReady) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    return <AlertCircle className="h-4 w-4 text-amber-500" />;
  };

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center space-x-2 py-2 text-moroder-primary">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Initializing AI models...</span>
      </div>
    );
  }

  if (!enableAI) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Noise Processor:</span>
        <div className="flex items-center space-x-1">
          {renderStatusIcon(initStatus.noiseProcessor)}
          <span>{initStatus.noiseProcessor ? 'Ready' : 'Not Ready'}</span>
        </div>
      </div>
      
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Content Classifier:</span>
        <div className="flex items-center space-x-1">
          {renderStatusIcon(initStatus.contentClassifier)}
          <span>{initStatus.contentClassifier ? 'Ready' : 'Not Ready'}</span>
        </div>
      </div>
      
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Artifact Eliminator:</span>
        <div className="flex items-center space-x-1">
          {renderStatusIcon(initStatus.artifactEliminator)}
          <span>{initStatus.artifactEliminator ? 'Ready' : 'Not Ready'}</span>
        </div>
      </div>
      
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Hardware Acceleration:</span>
        <div className="flex items-center space-x-1">
          {initStatus.hasWebGPU ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <AlertCircle className="h-4 w-4 text-amber-500" />
          )}
          <span>{initStatus.hasWebGPU ? 'WebGPU Active' : 'CPU Only'}</span>
        </div>
      </div>
      
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Processing Mode:</span>
        <div className="flex items-center space-x-1">
          {initStatus.processingMode === ProcessingMode.LOCAL_WEBGPU ? (
            <>
              <Cpu className="h-4 w-4 text-blue-500" />
              <span>Local WebGPU</span>
            </>
          ) : initStatus.processingMode === ProcessingMode.LOCAL_LIGHTWEIGHT ? (
            <>
              <Cpu className="h-4 w-4 text-purple-500" />
              <span>Local Lightweight</span>
            </>
          ) : (
            <>
              <Cloud className="h-4 w-4 text-green-500" />
              <span>Hugging Face Spaces API</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIInitializationStatus;
