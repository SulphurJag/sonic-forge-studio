
import React, { useState, useCallback } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { Upload, File } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AudioUploaderProps {
  onFileSelected: (file: File) => void;
}

const AudioUploader: React.FC<AudioUploaderProps> = ({ onFileSelected }) => {
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();
  
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length) {
      validateAndProcessFile(files[0]);
    }
  }, []);
  
  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndProcessFile(e.target.files[0]);
    }
  }, []);
  
  const validateAndProcessFile = (file: File) => {
    const validTypes = ['audio/wav', 'audio/flac', 'audio/aiff', 'audio/mp3', 'audio/mpeg'];
    
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Unsupported File Format",
        description: "Please upload WAV, FLAC, AIFF, or MP3 files only.",
        variant: "destructive"
      });
      return;
    }
    
    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      toast({
        title: "File Too Large",
        description: "Maximum file size is 50MB.",
        variant: "destructive"
      });
      return;
    }
    
    onFileSelected(file);
    toast({
      title: "File Uploaded Successfully",
      description: `${file.name} is ready for processing.`
    });
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-10 text-center transition-all ${
        isDragging ? 'border-moroder-primary bg-moroder-primary/10' : 'border-moroder-primary/20 hover:border-moroder-primary/40'
      }`}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="bg-moroder-primary/20 p-4 rounded-full">
          <Upload className="h-8 w-8 text-moroder-primary" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-medium">
            {isDragging ? "Drop Your Audio File Here" : "Drag & Drop Your Audio File"}
          </h3>
          <p className="text-sm text-muted-foreground">
            Supports WAV, FLAC, AIFF, or MP3 (max 50MB)
          </p>
        </div>
        <div className="flex items-center justify-center">
          <label htmlFor="file-upload">
            <input
              id="file-upload"
              type="file"
              className="hidden"
              accept=".wav,.flac,.aiff,.mp3"
              onChange={handleFileInput}
            />
            <Button 
              variant="outline" 
              className="border-moroder-primary/40 hover:bg-moroder-primary/10 hover:text-moroder-primary"
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <File className="h-4 w-4 mr-2" />
              Browse Files
            </Button>
          </label>
        </div>
      </div>
    </div>
  );
};

export default AudioUploader;
