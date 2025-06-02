
import { BrowserProcessingJob } from './types';
import { BrowserQueueManager } from './manager';

// Re-export types for convenience
export type { BrowserProcessingJob } from './types';

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
