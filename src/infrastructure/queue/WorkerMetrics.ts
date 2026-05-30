/**
 * Shared WorkerMetrics type for BullMQ queues
 *
 * Used by EmailQueue, NotificationQueue, and InboundEmailQueue
 * to report worker processing statistics to the admin dashboard.
 *
 * @packageDocumentation
 */

export interface WorkerMetrics {
  /** Failure rate as percentage (0–100) */
  failureRate: number;
  /** Average processing time in milliseconds */
  avgProcessingTime: number;
  /** Total completed jobs tracked */
  jobsCompleted: number;
  /** Total failed jobs tracked */
  jobsFailed: number;
  /** Number of jobs completed in the last hour */
  throughput1h: number;
  /** Breakdown by job type (name) */
  byType: Record<
    string,
    {
      completed: number;
      failed: number;
      avgProcessingTime: number;
    }
  >;
}
