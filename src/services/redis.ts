
import { Redis } from 'ioredis';
import { toast } from '@/hooks/use-toast';

// Create a Redis client
const redisClient = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

// Handle Redis connection events
redisClient.on('error', (err) => {
  console.error('Redis connection error:', err);
  toast({
    title: "Redis Connection Error",
    description: "Could not connect to the processing queue. Please try again later.",
    variant: "destructive"
  });
});

redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

// Processing queue functions
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
