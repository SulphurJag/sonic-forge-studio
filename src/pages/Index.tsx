import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Play, Settings, Download } from "lucide-react";

import Header from "@/components/Header";
import AudioUploader from "@/components/AudioUploader";
import Waveform from "@/components/Waveform";
import AudioControls from "@/components/AudioControls";
import SettingsPanel from "@/components/SettingsPanel";
import MeteringDisplay from "@/components/MeteringDisplay";
import ProcessingStatus from "@/components/ProcessingStatus";
import ProcessingQueue from "@/components/ProcessingQueue";
import { useProcessingQueue } from "@/hooks/use-processing-queue";
import { audioProcessor, ProcessingResults } from "@/services/audioProcessing";

const Index = () => {
  const location = useLocation();
  const [audioFile, setAudioFile] = useState<File | undefined>(undefined);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState("upload");
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'loading' | 'processing' | 'completed' | 'error'>('idle');
  const [processProgress, setProcessProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [processingSettings, setProcessingSettings] = useState({
    mode: "music",
    targetLufs: -14,
    dryWet: 100,
    noiseReduction: 50,
    beatQuantization: 0,
    swingPreservation: true
  });
  
  // Processed audio file reference
  const [processedAudio, setProcessedAudio] = useState<File | null>(null);
  
  // Processing results
  const [processingResults, setProcessingResults] = useState<ProcessingResults | null>(null);
  
  // Redis processing queue hook
  const { 
    queuedJobs, 
    completedJobs, 
    isLoading: isQueueLoading,
    addJob
  } = useProcessingQueue();

  // Initialize audio processor
  useEffect(() => {
    audioProcessor.initialize();
    
    return () => {
      audioProcessor.dispose();
    };
  }, []);

  // Handle tab changes from URL parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');
    
    if (tabParam === 'queue') {
      setActiveTab('queue');
    } else if (tabParam === 'settings' && audioFile) {
      setActiveTab('master');
    } else if (audioFile) {
      setActiveTab('master');
    }
  }, [location.search, audioFile]);
  
  const handleFileSelected = (file: File) => {
    setAudioFile(file);
    setIsPlaying(false);
    setProcessingStatus('loading');
    setProcessProgress(0);
    setProcessedAudio(null);
    setProcessingResults(null);
    setActiveTab("master");
    setCurrentTime(0);
    setAudioDuration(0);
    
    // Load the audio file into the processor
    console.log("Loading audio file:", file.name);
    audioProcessor.loadAudio(file)
      .then(() => {
        console.log("Audio loaded successfully");
        setProcessingStatus('idle');
        toast({
          title: "Audio Loaded",
          description: "Audio file is ready for processing",
        });
      })
      .catch(error => {
        console.error("Error loading audio:", error);
        setProcessingStatus('error');
        toast({
          title: "Audio Loading Error",
          description: error instanceof Error ? error.message : "Failed to load the audio file",
          variant: "destructive"
        });
      });
  };
  
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };
  
  const handleRestart = () => {
    setIsPlaying(false);
    // The actual audio position reset is handled in AudioControls
  };
  
  const handleTimeUpdate = (time: number, duration: number) => {
    setCurrentTime(time);
    setAudioDuration(duration);
  };
  
  const handleStartProcessing = async () => {
    if (!audioFile) return;
    
    // Check if audio is loaded and ready for processing
    if (!audioProcessor.isAudioLoaded()) {
      toast({
        title: "Audio Not Ready",
        description: "Please wait for the audio file to finish loading before processing",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "Starting Audio Processing",
      description: `${audioFile.name} is being mastered`,
    });
    
    setProcessingStatus('processing');
    
    try {
      console.log("Starting audio processing with settings:", processingSettings);
      
      // Add the file to the Redis processing queue for tracking
      await addJob(audioFile, processingSettings);
      
      // Process progress simulation
      const progressInterval = setInterval(() => {
        setProcessProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return prev + (Math.random() * 5 + 1);
        });
      }, 200);
      
      // Actual audio processing
      console.log("Calling audioProcessor.processAudio()");
      const results = await audioProcessor.processAudio(processingSettings);
      console.log("Processing complete with results:", results);
      
      // Get the processed file
      console.log("Getting processed audio file");
      const processedFile = await audioProcessor.getProcessedFile(audioFile);
      console.log("Processed file created:", processedFile.name);
      
      // Complete the progress and update the status
      clearInterval(progressInterval);
      setProcessProgress(100);
      
      // Delay a bit to show 100% completion
      setTimeout(() => {
        setProcessingStatus('completed');
        setProcessingResults(results);
        setProcessedAudio(processedFile);
        
        toast({
          title: "Processing Complete",
          description: "Your audio has been mastered successfully.",
        });
      }, 500);
    } catch (error) {
      console.error("Error processing audio:", error);
      setProcessingStatus('error');
      toast({
        title: "Processing Error",
        description: error instanceof Error ? error.message : "Failed to process audio",
        variant: "destructive"
      });
    }
  };
  
  // Handle download of processed audio
  const handleDownloadProcessedAudio = () => {
    if (!processedAudio) return;
    
    const url = URL.createObjectURL(processedAudio);
    const a = document.createElement('a');
    a.href = url;
    a.download = processedAudio.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Download Started",
      description: `${processedAudio.name} is being downloaded`
    });
  };
  
  // Handler for settings panel changes
  const handleSettingsChange = (settings: any) => {
    setProcessingSettings(settings);
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-moroder-dark bg-wave-pattern">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6 max-w-6xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-moroder-dark/40 border border-moroder-primary/10">
            <TabsTrigger value="upload">Upload Audio</TabsTrigger>
            <TabsTrigger value="master" disabled={!audioFile}>Master Audio</TabsTrigger>
            <TabsTrigger value="queue">Processing Queue</TabsTrigger>
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
                    <Waveform 
                      audioFile={processedAudio || audioFile} 
                      currentTime={currentTime} 
                      duration={audioDuration} 
                    />
                    <AudioControls
                      isPlaying={isPlaying}
                      onPlayPause={handlePlayPause}
                      onRestart={handleRestart}
                      audioFile={audioFile}
                      processedAudio={processedAudio}
                      onTimeUpdate={handleTimeUpdate}
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
                      onSettingsChange={handleSettingsChange}
                    />
                    
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
                          onClick={handleDownloadProcessedAudio}
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
          </TabsContent>

          <TabsContent value="queue" className="space-y-6">
            <ProcessingQueue 
              queuedJobs={queuedJobs}
              completedJobs={completedJobs}
              isLoading={isQueueLoading}
            />
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
