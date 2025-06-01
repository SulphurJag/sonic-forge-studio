
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProcessingQueue from "./ProcessingQueue";
import SupabaseProcessingQueue from "./SupabaseProcessingQueue";
import { ProcessingJob } from '@/services/redis';

interface ProcessingQueueSectionProps {
  queuedJobs: ProcessingJob[];
  completedJobs: ProcessingJob[];
  isQueueLoading: boolean;
}

const ProcessingQueueSection: React.FC<ProcessingQueueSectionProps> = ({
  queuedJobs,
  completedJobs,
  isQueueLoading
}) => {
  return (
    <Tabs defaultValue="local">
      <TabsList className="mb-4">
        <TabsTrigger value="local">Local Queue</TabsTrigger>
        <TabsTrigger value="supabase">Supabase Queue</TabsTrigger>
      </TabsList>
      
      <TabsContent value="local">
        <ProcessingQueue 
          queuedJobs={queuedJobs}
          completedJobs={completedJobs}
          isLoading={isQueueLoading}
        />
      </TabsContent>
      
      <TabsContent value="supabase">
        <SupabaseProcessingQueue />
      </TabsContent>
    </Tabs>
  );
};

export default ProcessingQueueSection;
