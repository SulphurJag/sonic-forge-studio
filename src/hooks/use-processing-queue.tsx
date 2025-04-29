
import { useCallback, useEffect, useState } from 'react';
import { 
  ProcessingJob, 
  addToProcessingQueue,
  getProcessingQueue,
  getJobById,
  getRecentCompletedJobs,
} from '@/services/redis';
import { toast } from '@/hooks/use-toast';

export const useProcessingQueue = () => {
  const [queuedJobs, setQueuedJobs] = useState<ProcessingJob[]>([]);
  const [completedJobs, setCompletedJobs] = useState<ProcessingJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all jobs in queue
  const fetchQueue = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const jobs = await getProcessingQueue();
      setQueuedJobs(jobs);
      
      const recentCompleted = await getRecentCompletedJobs();
      setCompletedJobs(recentCompleted);
    } catch (err) {
      setError('Failed to fetch processing queue');
      toast({
        title: "Error",
        description: "Failed to fetch processing queue",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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
    }
  ) => {
    try {
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
      fetchQueue();
      return jobId;
    } catch (err) {
      setError('Failed to add job to queue');
      toast({
        title: "Error",
        description: "Failed to add job to processing queue",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [fetchQueue]);

  // Get a specific job
  const getJob = useCallback(async (jobId: string) => {
    try {
      setIsLoading(true);
      const job = await getJobById(jobId);
      return job;
    } catch (err) {
      setError('Failed to get job details');
      return null;
    } finally {
      setIsLoading(false);
    }
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
