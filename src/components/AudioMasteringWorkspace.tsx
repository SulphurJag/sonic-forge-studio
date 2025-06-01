
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Settings, Download } from "lucide-react";
import Waveform from "./Waveform";
import AudioControls from "./AudioControls";
import SettingsPanel from "./SettingsPanel";
import MeteringDisplay from "./MeteringDisplay";
import ProcessingStatus from "./ProcessingStatus";
import { ProcessingResults } from "@/services/audioProcessing";

interface AudioMasteringWorkspaceProps {
  audioFile: File | undefined;
  processedAudio: File | null;
  isPlaying: boolean;
  currentTime: number;
  audioDuration: number;
  processingStatus: 'idle' | 'loading' | 'processing' | 'completed' | 'error';
  processProgress: number;
  processingResults: ProcessingResults | null;
  onPlayPause: () => void;
  onRestart: () => void;
  onTimeUpdate: (time: number, duration: number) => void;
  onStartProcessing: () => void;
  onDownloadProcessedAudio: () => void;
  onSettingsChange: (settings: any) => void;
}

const AudioMasteringWorkspace: React.FC<AudioMasteringWorkspaceProps> = ({
  audioFile,
  processedAudio,
  isPlaying,
  currentTime,
  audioDuration,
  processingStatus,
  processProgress,
  processingResults,
  onPlayPause,
  onRestart,
  onTimeUpdate,
  onStartProcessing,
  onDownloadProcessedAudio,
  onSettingsChange
}) => {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="md:col-span-2 space-y-6">
        {/* Waveform and Controls */}
        <Card className="bg-moroder-dark/40 border-moroder-primary/20">
          <CardHeader>
            <CardTitle>Audio Waveform</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Waveform 
              audioFile={processedAudio || audioFile} 
              currentTime={currentTime} 
              duration={audioDuration} 
            />
            <AudioControls
              isPlaying={isPlaying}
              onPlayPause={onPlayPause}
              onRestart={onRestart}
              audioFile={audioFile}
              processedAudio={processedAudio}
              onTimeUpdate={onTimeUpdate}
            />
          </CardContent>
        </Card>
        
        {/* Metering Display */}
        <Card className="bg-moroder-dark/40 border-moroder-primary/20">
          <CardHeader className="pb-0">
            <CardTitle>Meters</CardTitle>
          </CardHeader>
          <CardContent>
            <MeteringDisplay isActive={isPlaying} />
          </CardContent>
        </Card>
        
        {/* Processing Status */}
        <ProcessingStatus 
          status={processingStatus} 
          progress={processProgress}
          results={processingResults}
        />
      </div>
      
      <div>
        {/* Settings Panel */}
        <Card className="bg-moroder-dark/40 border-moroder-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Settings</CardTitle>
              <CardDescription>Adjust mastering parameters</CardDescription>
            </div>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <SettingsPanel 
              disabled={processingStatus === 'processing'}
              onSettingsChange={onSettingsChange}
            />
            
            <div className="mt-6 pt-4 border-t border-moroder-primary/10">
              <Button
                className="w-full bg-moroder-primary hover:bg-moroder-primary/90" 
                onClick={onStartProcessing}
                disabled={processingStatus === 'processing' || !audioFile}
              >
                <Play className="h-4 w-4 mr-2" />
                Start Processing
              </Button>
              
              {processingStatus === 'completed' && (
                <Button 
                  variant="outline" 
                  className="w-full mt-2 border-moroder-primary/40 hover:bg-moroder-primary/10"
                  onClick={onDownloadProcessedAudio}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Processed Audio
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AudioMasteringWorkspace;
