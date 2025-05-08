
import React from 'react';
import { useSupabaseProcessingQueue } from '@/hooks/use-processing-queue-supabase';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { format } from 'date-fns';

const SupabaseProcessingQueue: React.FC = () => {
  const { 
    queuedJobs, 
    completedJobs, 
    isLoading
  } = useSupabaseProcessingQueue();
  
  if (isLoading) {
    return (
      <Card className="bg-moroder-dark/40 border-moroder-primary/20">
        <CardHeader>
          <CardTitle>Processing Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading processing jobs...</div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Queued Jobs */}
      <Card className="bg-moroder-dark/40 border-moroder-primary/20">
        <CardHeader>
          <CardTitle>Current Processing Queue</CardTitle>
        </CardHeader>
        <CardContent>
          {queuedJobs.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No jobs currently in queue
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File Name</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Added</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {queuedJobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">{job.file_name}</TableCell>
                    <TableCell>{(job.file_size / (1024 * 1024)).toFixed(2)} MB</TableCell>
                    <TableCell>{job.settings?.mode || 'Standard'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="inline-block w-2 h-2 rounded-full bg-yellow-500"></span>
                        {job.status}
                      </div>
                    </TableCell>
                    <TableCell>{job.created_at ? format(new Date(job.created_at), 'MMM d, h:mm a') : 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      <Separator className="bg-moroder-primary/10" />
      
      {/* Completed Jobs */}
      <Card className="bg-moroder-dark/40 border-moroder-primary/20">
        <CardHeader>
          <CardTitle>Completed Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          {completedJobs.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No completed jobs found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File Name</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Processing Time</TableHead>
                  <TableHead>Completed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {completedJobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">{job.file_name}</TableCell>
                    <TableCell>{(job.file_size / (1024 * 1024)).toFixed(2)} MB</TableCell>
                    <TableCell>{job.settings?.mode || 'Standard'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={`inline-block w-2 h-2 rounded-full ${
                          job.status === 'completed' ? 'bg-green-500' : 'bg-red-500'
                        }`}></span>
                        {job.status}
                      </div>
                    </TableCell>
                    <TableCell>{job.processing_time ? `${job.processing_time.toFixed(2)}s` : 'N/A'}</TableCell>
                    <TableCell>{job.created_at ? format(new Date(job.created_at), 'MMM d, h:mm a') : 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SupabaseProcessingQueue;
