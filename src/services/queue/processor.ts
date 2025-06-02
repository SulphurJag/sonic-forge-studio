
import { BrowserProcessingJob } from './types';
import { toast } from '@/hooks/use-toast';

export class JobProcessor {
  private static instance: JobProcessor;
  private isProcessing = false;
  private processingInterval?: number;

  private constructor() {}

  static getInstance(): JobProcessor {
    if (!JobProcessor.instance) {
      JobProcessor.instance = new JobProcessor();
    }
    return JobProcessor.instance;
  }

  startProcessingLoop(
    getQueuedJobs: () => BrowserProcessingJob[],
    onJobUpdate: (jobId: string, updates: Partial<BrowserProcessingJob>) => void,
    onJobComplete: (job: BrowserProcessingJob) => void
  ) {
    if (this.processingInterval) return;

    this.processingInterval = window.setInterval(() => {
      this.processNextJob(getQueuedJobs, onJobUpdate, onJobComplete);
    }, 2000);
  }

  stopProcessingLoop() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = undefined;
    }
  }

  private async processNextJob(
    getQueuedJobs: () => BrowserProcessingJob[],
    onJobUpdate: (jobId: string, updates: Partial<BrowserProcessingJob>) => void,
    onJobComplete: (job: BrowserProcessingJob) => void
  ) {
    if (this.isProcessing) return;

    const queuedJobs = getQueuedJobs();
    const job = queuedJobs.find(j => j.status === 'queued');
    if (!job) return;

    this.isProcessing = true;
    
    onJobUpdate(job.id, {
      status: 'processing',
      progress: 0,
      startTime: Date.now()
    });

    // Simulate processing with gradual progress updates
    const progressInterval = setInterval(() => {
      if (job.status !== 'processing') {
        clearInterval(progressInterval);
        return;
      }

      job.progress += Math.random() * 8 + 2;
      onJobUpdate(job.id, { progress: job.progress });
      
      if (job.progress >= 100) {
        const completedJob = {
          ...job,
          progress: 100,
          status: 'completed' as const,
          endTime: Date.now(),
          results: {
            inputLufs: Math.random() * -10 - 10,
            outputLufs: job.settings.targetLufs,
            inputPeak: Math.random() * -3,
            outputPeak: -1.0,
            noiseReduction: job.settings.noiseReduction / 10,
          }
        };

        onJobComplete(completedJob);
        this.isProcessing = false;
        
        toast({
          title: "Processing Complete",
          description: `${job.fileName} has been processed successfully`,
        });
        
        clearInterval(progressInterval);
      }
    }, 1000);
  }
}
