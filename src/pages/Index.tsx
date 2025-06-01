
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";

import Header from "@/components/Header";
import AudioUploadSection from "@/components/AudioUploadSection";
import AudioMasteringWorkspace from "@/components/AudioMasteringWorkspace";
import ProcessingQueueSection from "@/components/ProcessingQueueSection";
import { useProcessingQueue } from "@/hooks/use-processing-queue";
import { useSupabaseProcessingQueue } from "@/hooks/use-processing-queue-supabase";
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
  
  // Updated processing settings with preservation options and beat correction mode
  const [processingSettings, setProcessingSettings] = useState({
    mode: "music",
    targetLufs: -14,
    dryWet: 100,
    noiseReduction: 50,
    beatQuantization: 0,
    swingPreservation: true,
    preserveTempo: true,
    preserveTone: true,
    beatCorrectionMode: "gentle"
  });
  
  // Processed audio file reference
  const [processedAudio, setProcessedAudio] = useState<File | null>(null);
  
  // Processing results
  const [processingResults, setProcessingResults] = useState<ProcessingResults | null>(null);
  
  // Use both Redis and Supabase processing queue hooks
  const { 
    queuedJobs, 
    completedJobs, 
    isLoading: isQueueLoading,
    addJob
  } = useProcessingQueue();
  
  const {
    addJob: addSupabaseJob
  } = useSupabaseProcessingQueue();

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
      
      // Add the file to both the Redis processing queue and Supabase for tracking
      await addJob(audioFile, processingSettings);
      await addSupabaseJob(audioFile, processingSettings);
      
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
    const updatedSettings = {
      ...settings,
      beatCorrectionMode: settings.beatCorrectionMode || processingSettings.beatCorrectionMode
    };
    setProcessingSettings(updatedSettings);
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
            <AudioUploadSection onFileSelected={handleFileSelected} />
          </TabsContent>
          
          <TabsContent value="master" className="space-y-6">
            <AudioMasteringWorkspace
              audioFile={audioFile}
              processedAudio={processedAudio}
              isPlaying={isPlaying}
              currentTime={currentTime}
              audioDuration={audioDuration}
              processingStatus={processingStatus}
              processProgress={processProgress}
              processingResults={processingResults}
              onPlayPause={handlePlayPause}
              onRestart={handleRestart}
              onTimeUpdate={handleTimeUpdate}
              onStartProcessing={handleStartProcessing}
              onDownloadProcessedAudio={handleDownloadProcessedAudio}
              onSettingsChange={handleSettingsChange}
            />
          </TabsContent>

          <TabsContent value="queue" className="space-y-6">
            <ProcessingQueueSection
              queuedJobs={queuedJobs}
              completedJobs={completedJobs}
              isQueueLoading={isQueueLoading}
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
