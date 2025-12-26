export interface AppError {
  message: string;
  code?: string;
  details?: unknown;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class TimeTrackerError extends Error {
  public readonly code?: string;
  public readonly details?: unknown;
  public readonly severity: AppError['severity'];

  constructor(
    message: string,
    options?: {
      code?: string;
      details?: unknown;
      severity?: AppError['severity'];
    },
  ) {
    super(message);
    this.name = 'TimeTrackerError';
    this.code = options?.code;
    this.details = options?.details;
    this.severity = options?.severity || 'medium';
  }
}

export const createError = (
  message: string,
  options?: {
    code?: string;
    details?: unknown;
    severity?: AppError['severity'];
  },
): TimeTrackerError => {
  return new TimeTrackerError(message, options);
};

export const handleAsyncError = async <T>(
  operation: () => Promise<T>,
  context: string,
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    const timeTrackerError = createError(`Failed to ${context}`, {
      code: 'ASYNC_OPERATION_FAILED',
      details: error,
      severity: 'high',
    });
    console.error(`Error in ${context}:`, timeTrackerError);
    throw timeTrackerError;
  }
};

export const logError = (error: unknown, context?: string): void => {
  const prefix = context ? `[${context}]` : '';

  if (error instanceof TimeTrackerError) {
    console.error(`${prefix} TimeTracker Error:`, {
      message: error.message,
      code: error.code,
      severity: error.severity,
      details: error.details,
    });
  } else if (error instanceof Error) {
    console.error(`${prefix} Error:`, error.message, error.stack);
  } else {
    console.error(`${prefix} Unknown error:`, error);
  }
};
