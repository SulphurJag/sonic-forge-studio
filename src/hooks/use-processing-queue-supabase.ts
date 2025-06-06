
import { useEffect, useState } from 'react';
import { toast } from './use-toast';
import { supabase, ProcessingJob, isSupabaseConfigured } from '../services/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const useSupabaseProcessingQueue = () => {
  const queryClient = useQueryClient();
  
  // Fetch processing jobs
  const fetchJobs = async () => {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase is not properly configured. Please set the environment variables.');
      return {
        queuedJobs: [],
        completedJobs: []
      };
    }
    
    const { data: queuedJobs, error: queuedError } = await supabase!
      .from('processing_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .eq('status', 'pending');
      
    const { data: completedJobs, error: completedError } = await supabase!
      .from('processing_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .in('status', ['completed', 'failed'])
      .limit(20);
      
    if (queuedError || completedError) {
      toast({
        title: "Error fetching jobs",
        description: queuedError?.message || completedError?.message,
        variant: "destructive"
      });
      throw queuedError || completedError;
    }
    
    return {
      queuedJobs: queuedJobs || [],
      completedJobs: completedJobs || []
    };
  };
  
  // Query for jobs
  const { 
    data, 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['processingJobs'],
    queryFn: fetchJobs,
    // Don't attempt to fetch if Supabase is not configured
    enabled: isSupabaseConfigured()
  });
  
  // Mutation for adding a job
  const addJobMutation = useMutation({
    mutationFn: async ({ file, settings }: { file: File, settings: any }) => {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase is not properly configured');
      }
      
      const newJob: ProcessingJob = {
        file_name: file.name,
        file_size: file.size,
        settings,
        status: 'pending'
      };
      
      const { data, error } = await supabase!
        .from('processing_jobs')
        .insert([newJob])
        .select();
        
      if (error) {
        toast({
          title: "Failed to add job",
          description: error.message,
          variant: "destructive"
        });
        throw error;
      }
      
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['processingJobs'] });
      toast({
        title: "Job added successfully",
        description: "Your audio processing job has been added to the queue."
      });
    }
  });
  
  // Add a new job to the queue
  const addJob = async (file: File, settings: any) => {
    if (!isSupabaseConfigured()) {
      toast({
        title: "Supabase Not Configured",
        description: "Please set the Supabase URL and Anonymous Key environment variables.",
        variant: "destructive"
      });
      return;
    }
    return addJobMutation.mutate({ file, settings });
  };
  
  // Set up real-time updates
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    
    const channel = supabase!
      .channel('processing_jobs_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'processing_jobs' 
        }, 
        () => {
          // Refresh the jobs data when changes occur
          refetch();
        }
      )
      .subscribe();
      
    return () => {
      if (isSupabaseConfigured()) {
        supabase!.removeChannel(channel);
      }
    };
  }, [refetch]);
  
  return {
    queuedJobs: data?.queuedJobs || [],
    completedJobs: data?.completedJobs || [],
    isLoading,
    error,
    addJob,
    isSupabaseConfigured: isSupabaseConfigured()
  };
};
