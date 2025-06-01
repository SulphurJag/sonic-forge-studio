
// Browser-compatible Redis-like service
// This file maintains compatibility with existing imports while using browser-safe implementations

import { 
  BrowserProcessingJob,
  addToProcessingQueue as browserAddToQueue,
  getProcessingQueue as browserGetQueue,
  getJobById as browserGetJob,
  getRecentCompletedJobs as browserGetCompleted,
  updateJobProgress as browserUpdateProgress,
  completeJob as browserCompleteJob,
  failJob as browserFailJob
} from './browserQueue';

// Re-export types for compatibility
export type ProcessingJob = BrowserProcessingJob;

// Re-export functions with Redis-like names for compatibility
export const addToProcessingQueue = browserAddToQueue;
export const getProcessingQueue = browserGetQueue;
export const getJobById = browserGetJob;
export const getRecentCompletedJobs = browserGetCompleted;
export const updateJobProgress = browserUpdateProgress;
export const completeJob = browserCompleteJob;
export const failJob = browserFailJob;

// Mock Redis client for compatibility
const mockRedisClient = {
  on: (event: string, callback: Function) => {
    if (event === 'connect') {
      setTimeout(() => callback(), 100);
    }
    return mockRedisClient;
  }
};

export default mockRedisClient;
