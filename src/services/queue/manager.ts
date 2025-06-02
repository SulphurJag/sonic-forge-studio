import { BrowserProcessingJob } from './types';
import { QueueStorage } from './storage';
import { JobProcessor } from './processor';

export class BrowserQueueManager {
  private static instance: BrowserQueueManager;
  private queuedJobs: BrowserProcessingJob[] = [];
  private completedJobs: BrowserProcessingJob[] = [];
  private processor: JobProcessor;

  private constructor() {
    this.processor = JobProcessor.getInstance();
    this.loadFromStorage();
    this.startProcessingLoop();
  }

  static getInstance(): BrowserQueueManager {
    if (!BrowserQueueManager.instance) {
      BrowserQueueManager.instance = new BrowserQueueManager();
    }
    return BrowserQueueManager.instance;
  }

  private loadFromStorage() {
    const data = QueueStorage.load();
    this.queuedJobs = data.queued;
    this.completedJobs = data.completed;
  }

  private saveToStorage() {
    QueueStorage.save(this.queuedJobs, this.completedJobs);
  }

  private startProcessingLoop() {
    this.processor.startProcessingLoop(
      () => this.queuedJobs,
      (jobId, updates) => this.updateJob(jobId, updates),
      (job) => this.moveToCompleted(job)
    );
  }

  private updateJob(jobId: string, updates: Partial<BrowserProcessingJob>) {
    const job = this.queuedJobs.find(j => j.id === jobId);
    if (job) {
      Object.assign(job, updates);
      this.saveToStorage();
    }
  }

  private moveToCompleted(job: BrowserProcessingJob) {
    this.completedJobs.unshift(job);
    this.queuedJobs = this.queuedJobs.filter(j => j.id !== job.id);
    
    // Keep only last 20 completed jobs
    if (this.completedJobs.length > 20) {
      this.completedJobs = this.completedJobs.slice(0, 20);
    }
    
    this.saveToStorage();
  }

  addJob(jobData: Omit<BrowserProcessingJob, 'id' | 'status' | 'progress'>): string {
    const job: BrowserProcessingJob = {
      ...jobData,
      id: `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      status: 'queued',
      progress: 0,
      startTime: Date.now()
    };

    this.queuedJobs.push(job);
    this.saveToStorage();
    
    return job.id;
  }

  getQueuedJobs(): BrowserProcessingJob[] {
    return [...this.queuedJobs];
  }

  getCompletedJobs(): BrowserProcessingJob[] {
    return [...this.completedJobs];
  }

  getJobById(id: string): BrowserProcessingJob | null {
    return this.queuedJobs.find(j => j.id === id) || 
           this.completedJobs.find(j => j.id === id) || 
           null;
  }

  removeJob(id: string): boolean {
    const queuedIndex = this.queuedJobs.findIndex(j => j.id === id);
    const completedIndex = this.completedJobs.findIndex(j => j.id === id);
    
    if (queuedIndex !== -1) {
      this.queuedJobs.splice(queuedIndex, 1);
      this.saveToStorage();
      return true;
    }
    
    if (completedIndex !== -1) {
      this.completedJobs.splice(completedIndex, 1);
      this.saveToStorage();
      return true;
    }
    
    return false;
  }
}
