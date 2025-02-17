export class RateLimiter {
  private queue: { timestamp: number }[] = [];
  private limit: number;
  private window: number;

  constructor(limit: number, windowMs: number) {
    this.limit = limit;
    this.window = windowMs;
  }

  async acquire(): Promise<void> {
    const now = Date.now();
    
    // Remove expired timestamps
    while (this.queue.length > 0 && now - this.queue[0].timestamp > this.window) {
      this.queue.shift();
    }

    if (this.queue.length >= this.limit) {
      const oldestRequest = this.queue[0].timestamp;
      const waitTime = this.window - (now - oldestRequest);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.acquire();
    }

    this.queue.push({ timestamp: now });
  }

  reset(): void {
    this.queue = [];
  }
}