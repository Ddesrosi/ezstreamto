// Error types
export class APIError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'APIError';
  }
}

export class CacheError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CacheError';
  }
}

// Error handling utilities
export function handleError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  
  if (typeof error === 'string') {
    return new Error(error);
  }
  
  return new Error('An unknown error occurred');
}

// Logging utilities
export function logError(error: unknown, context?: string): void {
  const formattedError = handleError(error);
  
  if (context) {
    console.error(`[${context}]:`, formattedError.message, formattedError);
  } else {
    console.error(formattedError.message, formattedError);
  }
}

// API error handling
export function handleAPIError(error: unknown, fallbackMessage: string): Error {
  const err = handleError(error);
  
  if (err instanceof APIError) {
    return err;
  }
  
  return new Error(fallbackMessage);
}