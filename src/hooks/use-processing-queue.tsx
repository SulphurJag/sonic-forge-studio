
import { useCallback, useEffect, useState } from 'react';
import { 
  BrowserProcessingJob, 
  addToProcessingQueue,
  getProcessingQueue,
  getJobById,
  getRecentCompletedJobs,
} from '@/services/browserQueue';
import { toast } from '@/hooks/use-toast';
import { errorHandler } from '@/services/errorHandler';

export const useProcessingQueue = () => {
  const [queuedJobs, setQueuedJobs] = useState<BrowserProcessingJob[]>([]);
  const [completedJobs, setCompletedJobs] = useState<BrowserProcessingJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all jobs in queue
  const fetchQueue = useCallback(async () => {
    const result = await errorHandler.withErrorHandling(async () => {
      setIsLoading(true);
      setError(null);
      
      const jobs = await getProcessingQueue();
      setQueuedJobs(jobs);
      
      const recentCompleted = await getRecentCompletedJobs();
      setCompletedJobs(recentCompleted);
      
      return true;
    }, 'Fetching processing queue');

    if (!result) {
      setError('Failed to fetch processing queue');
    }
    
    setIsLoading(false);
  }, []);

  // Add a new job to the queue
  const addJob = useCallback(async (
    file: File,
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
    }
  ) => {
    const result = await errorHandler.withErrorHandling(async () => {
      setIsLoading(true);
      
      const jobData = {
        fileName: file.name,
        fileSize: file.size,
        settings,
      };
      
      const jobId = await addToProcessingQueue(jobData);
      
      toast({
        title: "File Added to Queue",
        description: `${file.name} has been added to the processing queue`,
      });
      
      // Refresh queue after adding
      await fetchQueue();
      return jobId;
    }, 'Adding job to queue');

    setIsLoading(false);
    return result;
  }, [fetchQueue]);

  // Get a specific job
  const getJob = useCallback(async (jobId: string) => {
    return await errorHandler.withErrorHandling(async () => {
      setIsLoading(true);
      const job = await getJobById(jobId);
      setIsLoading(false);
      return job;
    }, 'Getting job details');
  }, []);

  // Load queue on component mount
  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  // Set up polling for job status updates
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (queuedJobs.length > 0) {
        fetchQueue();
      }
    }, 3000);

    return () => clearInterval(intervalId);
  }, [queuedJobs.length, fetchQueue]);

  return {
    queuedJobs,
    completedJobs,
    isLoading,
    error,
    addJob,
    getJob,
    refreshQueue: fetchQueue,
  };
};
