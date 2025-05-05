import React from 'react';
import { ProcessingJob } from '@/services/redis';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatDistanceToNow } from 'date-fns';
import { Loader2, CheckCircle, AlertCircle, Clock } from "lucide-react";

interface ProcessingQueueProps {
  queuedJobs: ProcessingJob[];
  completedJobs: ProcessingJob[];
  isLoading: boolean;
}

const ProcessingQueue: React.FC<ProcessingQueueProps> = ({ 
  queuedJobs, 
  completedJobs,
  isLoading 
}) => {
  const renderJobStatus = (job: ProcessingJob) => {
    switch (job.status) {
      case 'queued':
        return (
          <div className="flex items-center text-amber-400">
            <Clock className="h-4 w-4 mr-2" />
            <span>Queued</span>
          </div>
        );
      case 'processing':
        return (
          <div className="flex flex-col space-y-2">
            <div className="flex items-center text-moroder-primary">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span>Processing</span>
            </div>
            <Progress value={job.progress} className="h-2 bg-moroder-primary/20" />
            <p className="text-xs text-muted-foreground">{job.progress.toFixed(0)}% completed</p>
          </div>
        );
      case 'completed':
        return (
          <div className="flex items-center text-green-500">
            <CheckCircle className="h-4 w-4 mr-2" />
            <span>Completed</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center text-red-500">
            <AlertCircle className="h-4 w-4 mr-2" />
            <span>{job.error || 'Error'}</span>
          </div>
        );
      default:
        return null;
    }
  };

  const renderTimestamp = (timestamp?: number) => {
    if (!timestamp) return null;
    
    return (
      <span className="text-xs text-muted-foreground">
        {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
      </span>
    );
  };
  
  return (
    <Card className="bg-moroder-dark/40 border-moroder-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Processing Queue</span>
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {queuedJobs.length === 0 && completedJobs.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <p>No files in processing queue</p>
          </div>
        ) : (
          <>
            {queuedJobs.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-moroder-light">In Queue</h3>
                {queuedJobs.map((job) => (
                  <div 
                    key={job.id} 
                    className="bg-moroder-dark/60 p-3 rounded-md border border-moroder-primary/10"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium text-sm">{job.fileName}</h4>
                        <p className="text-xs text-muted-foreground">
                          {(job.fileSize / (1024 * 1024)).toFixed(2)} MB • {job.settings.mode}
                        </p>
                      </div>
                      {renderTimestamp(job.startTime)}
                    </div>
                    {renderJobStatus(job)}
                  </div>
                ))}
              </div>
            )}

            {completedJobs.length > 0 && (
              <div className="space-y-4 mt-6">
                <h3 className="text-sm font-medium text-moroder-light">Recently Completed</h3>
                {completedJobs.map((job) => (
                  <div 
                    key={job.id} 
                    className="bg-moroder-dark/60 p-3 rounded-md border border-moroder-primary/10"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium text-sm">{job.fileName}</h4>
                        <p className="text-xs text-muted-foreground">
                          {(job.fileSize / (1024 * 1024)).toFixed(2)} MB • {job.settings.mode}
                        </p>
                      </div>
                      {renderTimestamp(job.endTime)}
                    </div>
                    {renderJobStatus(job)}
                    
                    {job.results && (
                      <div className="mt-3 pt-3 border-t border-moroder-primary/10 grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="text-muted-foreground">Input LUFS: <span className="font-mono">{job.results.inputLufs.toFixed(1)}</span></p>
                          <p className="text-muted-foreground">Input Peak: <span className="font-mono">{job.results.inputPeak.toFixed(1)}</span></p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Output LUFS: <span className="font-mono">{job.results.outputLufs.toFixed(1)}</span></p>
                          <p className="text-muted-foreground">Output Peak: <span className="font-mono">{job.results.outputPeak.toFixed(1)}</span></p>
                        </div>
                        <div className="col-span-2 text-center text-moroder-accent">
                          Noise Reduction: {job.results.noiseReduction.toFixed(1)} dB
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ProcessingQueue;
