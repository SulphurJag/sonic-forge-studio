
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
import { AlertTriangle } from 'lucide-react';
import { Button } from "@/components/ui/button";

const SupabaseProcessingQueue: React.FC = () => {
  const { 
    queuedJobs, 
    completedJobs, 
    isLoading,
    isSupabaseConfigured
  } = useSupabaseProcessingQueue();
  
  if (!isSupabaseConfigured) {
    return (
      <Card className="bg-moroder-dark/40 border-moroder-primary/20">
        <CardHeader>
          <CardTitle>Processing Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center p-6 space-y-4 text-center">
            <AlertTriangle className="h-12 w-12 text-amber-500" />
            <h3 className="text-xl font-medium">Supabase Connection Error</h3>
            <p className="text-muted-foreground">
              Supabase URL or Anonymous Key is missing. Please set the environment variables to enable the Supabase processing queue.
            </p>
            <div className="bg-slate-800/50 p-4 rounded-md w-full max-w-md">
              <p className="text-sm font-mono mb-2">To enable Supabase, set these variables:</p>
              <p className="text-xs font-mono text-amber-300">VITE_SUPABASE_URL=your_supabase_url</p>
              <p className="text-xs font-mono text-amber-300">VITE_SUPABASE_ANON_KEY=your_supabase_anon_key</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
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
