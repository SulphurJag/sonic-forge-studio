import { toast } from '@/hooks/use-toast';

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface AppError {
  message: string;
  severity: ErrorSeverity;
  context?: string;
  originalError?: Error;
  timestamp: number;
}

class ErrorHandlerService {
  private static instance: ErrorHandlerService;
  private errors: AppError[] = [];
  private maxErrors = 50;

  private constructor() {}

  static getInstance(): ErrorHandlerService {
    if (!ErrorHandlerService.instance) {
      ErrorHandlerService.instance = new ErrorHandlerService();
    }
    return ErrorHandlerService.instance;
  }

  handleError(error: Error | string, severity: ErrorSeverity = 'medium', context?: string): void {
    const appError: AppError = {
      message: error instanceof Error ? error.message : error,
      severity,
      context,
      originalError: error instanceof Error ? error : undefined,
      timestamp: Date.now()
    };

    this.errors.unshift(appError);
    
    // Keep only the most recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    // Log to console for debugging
    console.error(`[${severity.toUpperCase()}] ${appError.message}`, {
      context,
      originalError: appError.originalError
    });

    // Show toast for medium or higher severity errors
    if (severity !== 'low') {
      toast({
        title: this.getSeverityTitle(severity),
        description: appError.message,
        variant: severity === 'critical' ? 'destructive' : 'default'
      });
    }
  }

  private getSeverityTitle(severity: ErrorSeverity): string {
    switch (severity) {
      case 'low': return 'Notice';
      case 'medium': return 'Warning';
      case 'high': return 'Error';
      case 'critical': return 'Critical Error';
      default: return 'Error';
    }
  }

  getRecentErrors(limit: number = 10): AppError[] {
    return this.errors.slice(0, limit);
  }

  clearErrors(): void {
    this.errors = [];
  }

  // Wrapper for async operations
  async withErrorHandling<T>(
    operation: () => Promise<T>,
    context: string,
    severity: ErrorSeverity = 'medium'
  ): Promise<T | null> {
    try {
      return await operation();
    } catch (error) {
      this.handleError(error as Error, severity, context);
      return null;
    }
  }
}

export const errorHandler = ErrorHandlerService.getInstance();

// Global error handler
window.addEventListener('error', (event) => {
  errorHandler.handleError(event.error, 'high', 'Global error handler');
});

window.addEventListener('unhandledrejection', (event) => {
  errorHandler.handleError(
    new Error(event.reason), 
    'high', 
    'Unhandled promise rejection'
  );
});
