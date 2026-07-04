export interface QueueJobOptions {
  id?: string;
  priority?: number;
  retryLimit?: number;
  delay?: number;
  // ponytail: fixed delay, upgrade to exponential+jitter when metrics show thundering herd
  backoff?: { type: 'fixed' | 'exponential'; delay: number };
}

export interface QueueCronJobOptions extends QueueJobOptions {
  repeat: {
    every?: number;
    pattern?: string;
    limit?: number;
  };
}
