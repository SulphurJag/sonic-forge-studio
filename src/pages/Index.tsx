
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Play, Settings } from "lucide-react";

import Header from "@/components/Header";
import AudioUploader from "@/components/AudioUploader";
import Waveform from "@/components/Waveform";
import AudioControls from "@/components/AudioControls";
import SettingsPanel from "@/components/SettingsPanel";
import MeteringDisplay from "@/components/MeteringDisplay";
import ProcessingStatus from "@/components/ProcessingStatus";

const Index = () => {
  const [audioFile, setAudioFile] = useState<File | undefined>(undefined);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState("upload");
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'processing' | 'completed' | 'error'>('idle');
  const [processProgress, setProcessProgress] = useState(0);
  
  const handleFileSelected = (file: File) => {
    setAudioFile(file);
    setActiveTab("master");
  };
  
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };
  
  const handleRestart = () => {
    setIsPlaying(false);
    // In a real implementation, we would reset the audio position
  };
  
  const handleStartProcessing = () => {
    if (!audioFile) return;
    
    toast({
      title: "Processing Started",
      description: `Starting to process ${audioFile.name}`,
    });
    
    setProcessingStatus('processing');
    
    // Simulate processing progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 2 + 1;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        
        setTimeout(() => {
          setProcessingStatus('completed');
          toast({
            title: "Processing Complete",
            description: "Your audio has been mastered successfully.",
          });
        }, 500);
      }
      setProcessProgress(progress);
    }, 200);
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-moroder-dark bg-wave-pattern">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6 max-w-6xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-moroder-dark/40 border border-moroder-primary/10">
            <TabsTrigger value="upload">Upload Audio</TabsTrigger>
            <TabsTrigger value="master" disabled={!audioFile}>Master Audio</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="space-y-6">
            <div className="grid gap-6">
              <Card className="bg-moroder-dark/40 border-moroder-primary/20">
                <CardHeader>
                  <CardTitle>Upload Your Audio</CardTitle>
                  <CardDescription>
                    Upload an audio file to begin the mastering process
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AudioUploader onFileSelected={handleFileSelected} />
                </CardContent>
              </Card>
              
              <Card className="bg-moroder-dark/40 border-moroder-primary/20">
                <CardHeader>
                  <CardTitle>About Moroder Audio Mastering Suite</CardTitle>
                  <CardDescription>
                    Professional audio mastering in your browser
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm">
                    Moroder Audio Mastering Suite provides professional-grade audio mastering with:
                  </p>
                  <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                    <li>EBU R128 Loudness Normalization</li>
                    <li>Multi-Strategy Noise Suppression</li>
                    <li>Content-Aware Processing Engine</li>
                    <li>Phase Coherence Optimization</li>
                    <li>Rhythmic Enhancement & Artifact Elimination</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="master" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="md:col-span-2 space-y-6">
                {/* Waveform and Controls */}
                <Card className="bg-moroder-dark/40 border-moroder-primary/20">
                  <CardHeader>
                    <CardTitle>Audio Waveform</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Waveform audioFile={audioFile} />
                    <AudioControls
                      isPlaying={isPlaying}
                      onPlayPause={handlePlayPause}
                      onRestart={handleRestart}
                      audioFile={audioFile}
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
                  results={
                    processingStatus === 'completed' ? {
                      inputLufs: -18.3,
                      outputLufs: -14.0,
                      inputPeak: -3.2,
                      outputPeak: -1.0,
                      noiseReduction: 4.2
                    } : undefined
                  }
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
                    <SettingsPanel disabled={processingStatus === 'processing'} />
                    
                    <div className="mt-6 pt-4 border-t border-moroder-primary/10">
                      <Button
                        className="w-full bg-moroder-primary hover:bg-moroder-primary/90" 
                        onClick={handleStartProcessing}
                        disabled={processingStatus === 'processing' || !audioFile}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Start Processing
                      </Button>
                      
                      {processingStatus === 'completed' && (
                        <Button 
                          variant="outline" 
                          className="w-full mt-2 border-moroder-primary/40 hover:bg-moroder-primary/10"
                        >
                          Download Processed Audio
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
      
      <footer className="py-4 px-6 border-t border-moroder-primary/10 text-center text-sm text-muted-foreground">
        <p>Moroder Audio Mastering Suite © {new Date().getFullYear()} | MIT License</p>
      </footer>
    </div>
  );
};

export default Index;
