
import { toast } from '@/hooks/use-toast';

// Type definitions for the processing job
export type ProcessingJob = {
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

// In-memory storage for browser environment
class BrowserRedisClient {
  private queuedJobs: ProcessingJob[] = [];
  private completedJobs: ProcessingJob[] = [];
  private jobsById: Record<string, ProcessingJob> = {};

  // Simulating Redis connection events
  constructor() {
    console.log('Browser Redis client initialized');
    
    // Simulate processing of queued jobs
    setInterval(() => {
      this.processJobs();
    }, 2000);
  }

  // Process jobs in queue
  private processJobs() {
    this.queuedJobs.forEach((job) => {
      if (job.status === 'queued') {
        // Start processing
        job.status = 'processing';
        job.progress = 0;
        
        // Simulate processing progress
        const progressInterval = setInterval(() => {
          if (job.status !== 'processing') {
            clearInterval(progressInterval);
            return;
          }
          
          job.progress += Math.random() * 5 + 3; // Random progress increment
          
          if (job.progress >= 100) {
            job.progress = 100;
            job.status = 'completed';
            job.endTime = Date.now();
            
            // Generate mock results
            job.results = {
              inputLufs: Math.random() * -10 - 10, // Between -20 and -10
              outputLufs: -14.0,
              inputPeak: Math.random() * -5, // Between -5 and 0
              outputPeak: -1.0,
              noiseReduction: Math.random() * 6 + 2, // Between 2 and 8
            };
            
            // Move to completed jobs
            this.completedJobs.push({...job});
            this.queuedJobs = this.queuedJobs.filter(j => j.id !== job.id);
            
            clearInterval(progressInterval);
            
            toast({
              title: "Processing Complete",
              description: `${job.fileName} has been processed successfully`,
            });
          }
        }, 1000);
      }
    });
  }

  // Add job to queue
  async rpush(key: string, value: string) {
    const job = JSON.parse(value);
    this.queuedJobs.push(job);
    this.jobsById[job.id] = job;
    return Promise.resolve(this.queuedJobs.length);
  }

  // Set job data
  async hset(key: string, field: string | object, value?: any) {
    const jobId = key.replace('job:', '');
    if (typeof field === 'object') {
      // When updating with an object, ensure we have the required properties
      const existingJob = this.jobsById[jobId] || {} as ProcessingJob;
      this.jobsById[jobId] = { 
        ...existingJob, 
        ...field,
        // Ensure required properties have values
        id: (field as any).id || existingJob.id || jobId,
        fileName: (field as any).fileName || existingJob.fileName || '',
        fileSize: (field as any).fileSize || existingJob.fileSize || 0,
        status: (field as any).status || existingJob.status || 'queued',
        progress: (field as any).progress || existingJob.progress || 0,
        settings: {
          ...(existingJob.settings || {}),
          ...((field as any).settings || {}),
          // Ensure required settings have values
          mode: (field as any).settings?.mode || existingJob.settings?.mode || 'music',
          targetLufs: (field as any).settings?.targetLufs || existingJob.settings?.targetLufs || -14,
          dryWet: (field as any).settings?.dryWet || existingJob.settings?.dryWet || 100,
          noiseReduction: (field as any).settings?.noiseReduction || existingJob.settings?.noiseReduction || 50
        }
      };
    } else {
      // Handle single key-value pair setting
      if (!this.jobsById[jobId]) {
        // Create a new job with required properties if it doesn't exist
        this.jobsById[jobId] = {
          id: jobId,
          fileName: '',
          fileSize: 0,
          status: 'queued',
          progress: 0,
          settings: {
            mode: 'music',
            targetLufs: -14,
            dryWet: 100,
            noiseReduction: 50
          }
        };
      }
      (this.jobsById[jobId] as any)[field] = value;
    }
    return Promise.resolve(1);
  }

  // Get all from list
  async llen(key: string) {
    if (key.includes('queue')) {
      return Promise.resolve(this.queuedJobs.length);
    } else {
      return Promise.resolve(this.completedJobs.length);
    }
  }

  // Get items from list
  async lrange(key: string, start: number, end: number) {
    let list: ProcessingJob[] = [];
    if (key.includes('queue')) {
      list = this.queuedJobs;
    } else {
      list = this.completedJobs;
    }
    
    const result = list.slice(start, end + 1).map(job => JSON.stringify(job));
    return Promise.resolve(result);
  }

  // Get job by ID
  async hgetall(key: string) {
    const jobId = key.replace('job:', '');
    const job = this.jobsById[jobId];
    return Promise.resolve(job || null);
  }

  // Remove from list
  async lrem(key: string, count: number, value: string) {
    const jobToRemove = JSON.parse(value);
    if (key.includes('queue')) {
      this.queuedJobs = this.queuedJobs.filter(job => job.id !== jobToRemove.id);
    } else {
      this.completedJobs = this.completedJobs.filter(job => job.id !== jobToRemove.id);
    }
    return Promise.resolve(1);
  }

  // For connection status simulation
  on(event: string, callback: Function) {
    if (event === 'connect') {
      setTimeout(() => callback(), 100); // Simulate connection success
    }
    return this;
  }
}

// Create a browser-compatible Redis client
const redisClient = new BrowserRedisClient();

// Queue names
const PROCESSING_QUEUE = 'moroder:processing:queue';
const PROCESSING_RESULTS = 'moroder:processing:results';

// Add a job to the processing queue
export const addToProcessingQueue = async (job: Omit<ProcessingJob, 'id' | 'status' | 'progress'>) => {
  const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const processingJob: ProcessingJob = {
    ...job,
    id: jobId,
    status: 'queued',
    progress: 0,
    startTime: Date.now()
  };
  
  try {
    await redisClient.rpush(PROCESSING_QUEUE, JSON.stringify(processingJob));
    await redisClient.hset(`job:${jobId}`, processingJob);
    return jobId;
  } catch (error) {
    console.error('Error adding job to queue:', error);
    toast({
      title: "Queue Error",
      description: "Failed to add audio to processing queue.",
      variant: "destructive"
    });
    throw error;
  }
};

// Get all jobs in the queue
export const getProcessingQueue = async (): Promise<ProcessingJob[]> => {
  try {
    const queueLength = await redisClient.llen(PROCESSING_QUEUE);
    const jobsJson = await redisClient.lrange(PROCESSING_QUEUE, 0, queueLength - 1);
    return jobsJson.map(job => JSON.parse(job));
  } catch (error) {
    console.error('Error getting processing queue:', error);
    return [];
  }
};

// Get a specific job by ID
export const getJobById = async (jobId: string): Promise<ProcessingJob | null> => {
  try {
    const jobData = await redisClient.hgetall(`job:${jobId}`);
    return jobData ? (jobData as unknown as ProcessingJob) : null;
  } catch (error) {
    console.error('Error getting job:', error);
    return null;
  }
};

// Update job progress
export const updateJobProgress = async (jobId: string, progress: number) => {
  try {
    await redisClient.hset(`job:${jobId}`, 'progress', progress);
    if (progress >= 100) {
      await redisClient.hset(`job:${jobId}`, 'status', 'completed');
      await redisClient.hset(`job:${jobId}`, 'endTime', Date.now());
    }
  } catch (error) {
    console.error('Error updating job progress:', error);
  }
};

// Mark job as completed with results
export const completeJob = async (jobId: string, results: ProcessingJob['results']) => {
  try {
    await redisClient.hset(`job:${jobId}`, {
      status: 'completed',
      progress: 100,
      endTime: Date.now(),
      results: JSON.stringify(results)
    });
    
    // Move from queue to results
    const jobJson = await redisClient.hgetall(`job:${jobId}`);
    await redisClient.rpush(PROCESSING_RESULTS, JSON.stringify(jobJson));
    
    // Remove from processing queue
    const queueLength = await redisClient.llen(PROCESSING_QUEUE);
    const jobs = await redisClient.lrange(PROCESSING_QUEUE, 0, queueLength - 1);
    for (let i = 0; i < jobs.length; i++) {
      const job = JSON.parse(jobs[i]);
      if (job.id === jobId) {
        await redisClient.lrem(PROCESSING_QUEUE, 1, jobs[i]);
        break;
      }
    }
  } catch (error) {
    console.error('Error completing job:', error);
  }
};

// Mark job as failed
export const failJob = async (jobId: string, error: string) => {
  try {
    await redisClient.hset(`job:${jobId}`, {
      status: 'error',
      endTime: Date.now(),
      error
    });
  } catch (err) {
    console.error('Error marking job as failed:', err);
  }
};

// Get recent completed jobs
export const getRecentCompletedJobs = async (limit: number = 10): Promise<ProcessingJob[]> => {
  try {
    const jobsLength = await redisClient.llen(PROCESSING_RESULTS);
    const jobsJson = await redisClient.lrange(PROCESSING_RESULTS, Math.max(0, jobsLength - limit), jobsLength - 1);
    return jobsJson.map(job => JSON.parse(job));
  } catch (error) {
    console.error('Error getting completed jobs:', error);
    return [];
  }
};

export default redisClient;
