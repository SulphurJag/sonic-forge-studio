
export type BrowserProcessingJob = {
  id: string;
  fileName: string;
  fileSize: number;
  status: 'queued' | 'processing' | 'completed' | 'error';
  progress: number;
  startTime?: number;
  endTime?: number;
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
  };
  results?: {
    inputLufs: number;
    outputLufs: number;
    inputPeak: number;
    outputPeak: number;
    noiseReduction: number;
  };
  error?: string;
};
