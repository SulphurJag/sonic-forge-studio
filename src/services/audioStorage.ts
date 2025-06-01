
// Audio file storage service for browser environment
export class AudioStorageService {
  private static instance: AudioStorageService;
  private audioFiles: Map<string, File> = new Map();
  private processedFiles: Map<string, File> = new Map();

  private constructor() {}

  static getInstance(): AudioStorageService {
    if (!AudioStorageService.instance) {
      AudioStorageService.instance = new AudioStorageService();
    }
    return AudioStorageService.instance;
  }

  // Store original audio file
  storeAudioFile(id: string, file: File): void {
    this.audioFiles.set(id, file);
  }

  // Get original audio file
  getAudioFile(id: string): File | null {
    return this.audioFiles.get(id) || null;
  }

  // Store processed audio file
  storeProcessedFile(id: string, file: File): void {
    this.processedFiles.set(id, file);
  }

  // Get processed audio file
  getProcessedFile(id: string): File | null {
    return this.processedFiles.get(id) || null;
  }

  // Create a download URL for a file
  createDownloadUrl(file: File): string {
    return URL.createObjectURL(file);
  }

  // Clean up URLs to prevent memory leaks
  revokeUrl(url: string): void {
    URL.revokeObjectURL(url);
  }

  // Clear all stored files
  clear(): void {
    this.audioFiles.clear();
    this.processedFiles.clear();
  }

  // Get storage stats
  getStorageStats(): { audioFiles: number; processedFiles: number } {
    return {
      audioFiles: this.audioFiles.size,
      processedFiles: this.processedFiles.size
    };
  }
}

export const audioStorage = AudioStorageService.getInstance();
