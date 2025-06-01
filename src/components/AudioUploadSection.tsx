
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AudioUploader from "./AudioUploader";
import SupabaseConfigHelper from "./SupabaseConfigHelper";

interface AudioUploadSectionProps {
  onFileSelected: (file: File) => void;
}

const AudioUploadSection: React.FC<AudioUploadSectionProps> = ({ onFileSelected }) => {
  return (
    <div className="grid gap-6">
      <Card className="bg-moroder-dark/40 border-moroder-primary/20">
        <CardHeader>
          <CardTitle>Upload Your Audio</CardTitle>
          <CardDescription>
            Upload an audio file to begin the mastering process
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AudioUploader onFileSelected={onFileSelected} />
        </CardContent>
      </Card>
      
      {/* Supabase Configuration Helper Card */}
      <SupabaseConfigHelper />
      
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
            <li>Original Character Preservation</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default AudioUploadSection;
