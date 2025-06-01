import { toast } from '@/hooks/use-toast';

// Type definitions for the processing job
export type BrowserProcessingJob = {
  id: string;
  fileName: string;
  fileSize: number;
  status: 'queued' | 'processing' | 'completed' | 'error';
  progress: number;
  startTime?: number;
  endTime?: number;
  settings: {
    mode: string;
    targetLufs: number;
    dryWet: number;
    noiseReduction: number;
    beatQuantization?: number;
    swingPreservation?: boolean;
    preserveTempo?: boolean;
    preserveTone?: boolean;
    beatCorrectionMode?: string;
  };
  results?: {
    inputLufs: number;
    outputLufs: number;
    inputPeak: number;
    outputPeak: number;
    noiseReduction: number;
  };
  error?: string;
};

// Browser-compatible queue management using localStorage and memory
class BrowserQueueManager {
  private static instance: BrowserQueueManager;
  private queuedJobs: BrowserProcessingJob[] = [];
  private completedJobs: BrowserProcessingJob[] = [];
  private isProcessing = false;

  private constructor() {
    this.loadFromStorage();
    this.startProcessingLoop();
  }

  static getInstance(): BrowserQueueManager {
    if (!BrowserQueueManager.instance) {
      BrowserQueueManager.instance = new BrowserQueueManager();
    }
    return BrowserQueueManager.instance;
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem('moroder_processing_queue');
      if (stored) {
        const data = JSON.parse(stored);
        this.queuedJobs = data.queued || [];
        this.completedJobs = data.completed || [];
      }
    } catch (error) {
      console.warn('Failed to load queue from storage:', error);
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem('moroder_processing_queue', JSON.stringify({
        queued: this.queuedJobs,
        completed: this.completedJobs
      }));
    } catch (error) {
      console.warn('Failed to save queue to storage:', error);
    }
  }

  private startProcessingLoop() {
    setInterval(() => {
      this.processNextJob();
    }, 2000);
  }

  private async processNextJob() {
    if (this.isProcessing || this.queuedJobs.length === 0) return;

    const job = this.queuedJobs.find(j => j.status === 'queued');
    if (!job) return;

    this.isProcessing = true;
    job.status = 'processing';
    job.progress = 0;
    job.startTime = Date.now();

    // Simulate processing with gradual progress updates
    const progressInterval = setInterval(() => {
      if (job.status !== 'processing') {
        clearInterval(progressInterval);
        return;
      }

      job.progress += Math.random() * 8 + 2;
      
      if (job.progress >= 100) {
        job.progress = 100;
        job.status = 'completed';
        job.endTime = Date.now();
        
        // Generate mock results
        job.results = {
          inputLufs: Math.random() * -10 - 10,
          outputLufs: job.settings.targetLufs,
          inputPeak: Math.random() * -3,
          outputPeak: -1.0,
          noiseReduction: job.settings.noiseReduction / 10,
        };

        // Move to completed jobs
        this.completedJobs.unshift(job);
        this.queuedJobs = this.queuedJobs.filter(j => j.id !== job.id);
        
        // Keep only last 20 completed jobs
        if (this.completedJobs.length > 20) {
          this.completedJobs = this.completedJobs.slice(0, 20);
        }

        this.saveToStorage();
        this.isProcessing = false;
        
        toast({
          title: "Processing Complete",
          description: `${job.fileName} has been processed successfully`,
        });
        
        clearInterval(progressInterval);
      }
    }, 1000);
  }

  addJob(jobData: Omit<BrowserProcessingJob, 'id' | 'status' | 'progress'>): string {
    const job: BrowserProcessingJob = {
      ...jobData,
      id: `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      status: 'queued',
      progress: 0,
      startTime: Date.now()
    };

    this.queuedJobs.push(job);
    this.saveToStorage();
    
    return job.id;
  }

  getQueuedJobs(): BrowserProcessingJob[] {
    return [...this.queuedJobs];
  }

  getCompletedJobs(): BrowserProcessingJob[] {
    return [...this.completedJobs];
  }

  getJobById(id: string): BrowserProcessingJob | null {
    return this.queuedJobs.find(j => j.id === id) || 
           this.completedJobs.find(j => j.id === id) || 
           null;
  }

  removeJob(id: string): boolean {
    const queuedIndex = this.queuedJobs.findIndex(j => j.id === id);
    const completedIndex = this.completedJobs.findIndex(j => j.id === id);
    
    if (queuedIndex !== -1) {
      this.queuedJobs.splice(queuedIndex, 1);
      this.saveToStorage();
      return true;
    }
    
    if (completedIndex !== -1) {
      this.completedJobs.splice(completedIndex, 1);
      this.saveToStorage();
      return true;
    }
    
    return false;
  }
}

// Export the queue manager instance
export const browserQueue = BrowserQueueManager.getInstance();

// Helper functions for compatibility with existing code
export const addToProcessingQueue = async (job: Omit<BrowserProcessingJob, 'id' | 'status' | 'progress'>) => {
  return browserQueue.addJob(job);
};

export const getProcessingQueue = async (): Promise<BrowserProcessingJob[]> => {
  return browserQueue.getQueuedJobs();
};

export const getJobById = async (jobId: string): Promise<BrowserProcessingJob | null> => {
  return browserQueue.getJobById(jobId);
};

export const getRecentCompletedJobs = async (limit: number = 10): Promise<BrowserProcessingJob[]> => {
  const completed = browserQueue.getCompletedJobs();
  return completed.slice(0, limit);
};

export const updateJobProgress = async (jobId: string, progress: number) => {
  const job = browserQueue.getJobById(jobId);
  if (job) {
    job.progress = progress;
  }
};

export const completeJob = async (jobId: string, results: BrowserProcessingJob['results']) => {
  const job = browserQueue.getJobById(jobId);
  if (job) {
    job.status = 'completed';
    job.progress = 100;
    job.endTime = Date.now();
    job.results = results;
  }
};

export const failJob = async (jobId: string, error: string) => {
  const job = browserQueue.getJobById(jobId);
  if (job) {
    job.status = 'error';
    job.endTime = Date.now();
    job.error = error;
  }
};
