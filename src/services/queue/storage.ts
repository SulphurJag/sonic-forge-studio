
import { BrowserProcessingJob } from './types';

export class QueueStorage {
  private static readonly STORAGE_KEY = 'moroder_processing_queue';

  static load(): { queued: BrowserProcessingJob[], completed: BrowserProcessingJob[] } {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        return {
          queued: data.queued || [],
          completed: data.completed || []
        };
      }
    } catch (error) {
      console.warn('Failed to load queue from storage:', error);
    }
    return { queued: [], completed: [] };
  }

  static save(queuedJobs: BrowserProcessingJob[], completedJobs: BrowserProcessingJob[]) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
        queued: queuedJobs,
        completed: completedJobs
      }));
    } catch (error) {
      console.warn('Failed to save queue to storage:', error);
    }
  }
}
