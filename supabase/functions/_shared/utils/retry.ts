interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  const { maxRetries, baseDelay, maxDelay } = options;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) throw error;

      // Calculate exponential backoff with jitter
      const delayMs = Math.min(
        baseDelay * Math.pow(2, attempt) + Math.random() * 100,
        maxDelay
      );

      await new Promise<void>(resolve => {
        setTimeout(resolve, delayMs);
      });
    }
  }

  throw new Error('Retry failed');
}