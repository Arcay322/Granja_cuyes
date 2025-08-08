import { ExportStatus } from '@prisma/client';
import { ExportJobData } from '../../types/export.types';
import { reportsService } from './reports.service';
import { jobQueueService } from './jobQueue.service';
import { jobLifecycleService } from './jobLifecycle.service';
import logger from '../../utils/logger';

export interface MonitoringConfig {
  timeoutCheckIntervalMs: number;
  healthCheckIntervalMs: number;
  retryDelayMs: number;
  maxRetryAttempts: number;
  jobTimeoutMinutes: number;
  alertThresholds: {
    failureRate: number;
    queueSize: number;
    processingTime: number;
  };
}

export interface HealthStatus {
  isHealthy: boolean;
  timestamp: Date;
  metrics: {
    queueSize: number;
    processingJobs: number;
    failedJobs: number;
    averageProcessingTime: number;
    failureRate: number;
  };
  alerts: Alert[];
}

export interface Alert {
  type: 'WARNING' | 'ERROR' | 'CRITICAL';
  message: string;
  timestamp: Date;
  jobId?: string;
  metric?: string;
  value?: number;
  threshold?: number;
}

export interface RecoveryAction {
  type: 'RETRY_JOB' | 'TIMEOUT_JOB' | 'RESTART_QUEUE' | 'CLEANUP_EXPIRED';
  jobId?: string;
  reason: string;
  timestamp: Date;
  success: boolean;
  error?: string;
}

export class JobMonitoringService {
  private config: MonitoringConfig;
  private isRunning = false;
  private timeoutInterval: NodeJS.Timeout | null = null;
  private healthInterval: NodeJS.Timeout | null = null;
  private alerts: Alert[] = [];
  private recoveryActions: RecoveryAction[] = [];
  private shutdownPromise: Promise<void> | null = null;

  constructor(config?: Partial<MonitoringConfig>) {
    this.config = {
      timeoutCheckIntervalMs: 60000, // 1 minute
      healthCheckIntervalMs: 30000, // 30 seconds
      retryDelayMs: 5000, // 5 seconds
      maxRetryAttempts: 3,
      jobTimeoutMinutes: 10,
      alertThresholds: {
        failureRate: 20, // 20%
        queueSize: 50,
        processingTime: 15 // 15 minutes
      },
      ...config
    };
  }

  /**
   * Start monitoring services
   */
  async startMonitoring(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Job monitoring is already running');
      return;
    }

    try {
      logger.info('Starting job monitoring service');
      this.isRunning = true;

      // Start timeout monitoring
      this.startTimeoutMonitoring();

      // Start health monitoring
      this.startHealthMonitoring();

      // Perform initial recovery check
      await this.performRecoveryCheck();

      logger.info('Job monitoring service started successfully');
    } catch (error) {
      logger.error('Failed to start job monitoring service:', error);
      this.isRunning = false;
      
      // Clear intervals if they were set
      if (this.timeoutInterval) {
        clearInterval(this.timeoutInterval);
        this.timeoutInterval = null;
      }
      if (this.healthInterval) {
        clearInterval(this.healthInterval);
        this.healthInterval = null;
      }
      
      throw error;
    }
  }

  /**
   * Stop monitoring services gracefully
   */
  async stopMonitoring(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    logger.info('Stopping job monitoring service');
    this.isRunning = false;

    // Clear intervals
    if (this.timeoutInterval) {
      clearInterval(this.timeoutInterval);
      this.timeoutInterval = null;
    }

    if (this.healthInterval) {
      clearInterval(this.healthInterval);
      this.healthInterval = null;
    }

    logger.info('Job monitoring service stopped');
  }

  /**
   * Perform graceful shutdown
   */
  async gracefulShutdown(timeoutMs: number = 30000): Promise<void> {
    if (this.shutdownPromise) {
      return this.shutdownPromise;
    }

    this.shutdownPromise = this.performGracefulShutdown(timeoutMs);
    return this.shutdownPromise;
  }

  /**
   * Get current health status
   */
  async getHealthStatus(): Promise<HealthStatus> {
    try {
      const queueStatus = await jobQueueService.getQueueStatus();
      const stats = await jobLifecycleService.getLifecycleStats();

      const metrics = {
        queueSize: queueStatus.pending,
        processingJobs: queueStatus.processing,
        failedJobs: queueStatus.failed,
        averageProcessingTime: stats.averageProcessingTime,
        failureRate: stats.retryRate
      };

      // Check for alerts based on metrics
      this.checkMetricAlerts(metrics);

      // Check health conditions
      const isHealthy = this.evaluateHealth(metrics);

      // Get recent alerts (last 10)
      const recentAlerts = this.alerts.slice(-10);

      return {
        isHealthy,
        timestamp: new Date(),
        metrics,
        alerts: recentAlerts
      };
    } catch (error) {
      logger.error('Failed to get health status:', error);
      
      return {
        isHealthy: false,
        timestamp: new Date(),
        metrics: {
          queueSize: 0,
          processingJobs: 0,
          failedJobs: 0,
          averageProcessingTime: 0,
          failureRate: 0
        },
        alerts: [{
          type: 'CRITICAL',
          message: 'Failed to retrieve health status',
          timestamp: new Date()
        }]
      };
    }
  }

  /**
   * Get recovery actions history
   */
  getRecoveryHistory(limit: number = 50): RecoveryAction[] {
    return this.recoveryActions.slice(-limit);
  }

  /**
   * Get current alerts
   */
  getCurrentAlerts(): Alert[] {
    // Return alerts from last 24 hours
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);
    
    return this.alerts.filter(alert => alert.timestamp > yesterday);
  }

  /**
   * Force timeout check
   */
  async forceTimeoutCheck(): Promise<void> {
    await this.checkTimeoutJobs();
  }

  /**
   * Force health check
   */
  async forceHealthCheck(): Promise<HealthStatus> {
    await this.performHealthCheck();
    return this.getHealthStatus();
  }

  /**
   * Retry specific job
   */
  async retryJob(jobId: string, reason: string = 'Manual retry'): Promise<boolean> {
    try {
      logger.info(`Manual retry requested for job: ${jobId}`);
      
      const success = await jobLifecycleService.retryJob(jobId);
      
      this.recordRecoveryAction({
        type: 'RETRY_JOB',
        jobId,
        reason,
        timestamp: new Date(),
        success
      });

      return success;
    } catch (error) {
      logger.error(`Failed to retry job ${jobId}:`, error);
      
      this.recordRecoveryAction({
        type: 'RETRY_JOB',
        jobId,
        reason,
        timestamp: new Date(),
        success: false,
        error: (error as Error).message
      });

      return false;
    }
  }

  /**
   * Start timeout monitoring
   */
  private startTimeoutMonitoring(): void {
    this.timeoutInterval = setInterval(async () => {
      if (this.isRunning) {
        await this.checkTimeoutJobs();
      }
    }, this.config.timeoutCheckIntervalMs);

    logger.info(`Timeout monitoring started (interval: ${this.config.timeoutCheckIntervalMs}ms)`);
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    this.healthInterval = setInterval(async () => {
      if (this.isRunning) {
        await this.performHealthCheck();
      }
    }, this.config.healthCheckIntervalMs);

    logger.info(`Health monitoring started (interval: ${this.config.healthCheckIntervalMs}ms)`);
  }

  /**
   * Check for timed out jobs
   */
  private async checkTimeoutJobs(): Promise<void> {
    try {
      const timeoutJobs = await reportsService.getTimeoutJobs(this.config.jobTimeoutMinutes);
      
      if (timeoutJobs.length === 0) {
        return;
      }

      logger.warn(`Found ${timeoutJobs.length} timed out jobs`);

      for (const job of timeoutJobs) {
        await this.handleTimeoutJob(job);
      }

      // Mark jobs as timed out in batch
      const jobIds = timeoutJobs.map(job => job.id);
      await reportsService.markJobsAsTimeout(jobIds);

      this.recordRecoveryAction({
        type: 'TIMEOUT_JOB',
        reason: `Handled ${timeoutJobs.length} timed out jobs`,
        timestamp: new Date(),
        success: true
      });

    } catch (error) {
      logger.error('Error checking timeout jobs:', error);
      
      this.addAlert({
        type: 'ERROR',
        message: 'Failed to check timeout jobs',
        timestamp: new Date()
      });
    }
  }

  /**
   * Handle individual timeout job
   */
  private async handleTimeoutJob(job: ExportJobData): Promise<void> {
    try {
      logger.info(`Handling timeout for job: ${job.id}`);

      // Try to handle timeout through lifecycle service
      await jobLifecycleService.handleJobTimeout(job.id);

      this.addAlert({
        type: 'WARNING',
        message: `Job timed out: ${job.id}`,
        timestamp: new Date(),
        jobId: job.id
      });

    } catch (error) {
      logger.error(`Failed to handle timeout for job ${job.id}:`, error);
      
      this.addAlert({
        type: 'ERROR',
        message: `Failed to handle timeout for job: ${job.id}`,
        timestamp: new Date(),
        jobId: job.id
      });
    }
  }

  /**
   * Perform health check
   */
  private async performHealthCheck(): Promise<void> {
    try {
      const healthStatus = await this.getHealthStatus();
      
      // Check for alerts based on metrics
      this.checkMetricAlerts(healthStatus.metrics);

      // Log health status periodically
      if (!healthStatus.isHealthy) {
        logger.warn('System health check failed', { metrics: healthStatus.metrics });
      }

    } catch (error) {
      logger.error('Health check failed:', error);
      
      this.addAlert({
        type: 'CRITICAL',
        message: 'Health check failed',
        timestamp: new Date()
      });
    }
  }

  /**
   * Check metrics for alert conditions
   */
  private checkMetricAlerts(metrics: HealthStatus['metrics']): void {
    const { alertThresholds } = this.config;

    // Check failure rate
    if (metrics.failureRate > alertThresholds.failureRate) {
      this.addAlert({
        type: 'WARNING',
        message: 'High failure rate detected',
        timestamp: new Date(),
        metric: 'failureRate',
        value: metrics.failureRate,
        threshold: alertThresholds.failureRate
      });
    }

    // Check queue size
    if (metrics.queueSize > alertThresholds.queueSize) {
      this.addAlert({
        type: 'WARNING',
        message: 'Queue size threshold exceeded',
        timestamp: new Date(),
        metric: 'queueSize',
        value: metrics.queueSize,
        threshold: alertThresholds.queueSize
      });
    }

    // Check processing time
    if (metrics.averageProcessingTime > alertThresholds.processingTime) {
      this.addAlert({
        type: 'WARNING',
        message: 'Average processing time threshold exceeded',
        timestamp: new Date(),
        metric: 'averageProcessingTime',
        value: metrics.averageProcessingTime,
        threshold: alertThresholds.processingTime
      });
    }
  }

  /**
   * Evaluate overall system health
   */
  private evaluateHealth(metrics: HealthStatus['metrics']): boolean {
    const { alertThresholds } = this.config;

    // System is unhealthy if any critical threshold is exceeded
    if (metrics.failureRate > alertThresholds.failureRate * 2) {
      return false;
    }

    if (metrics.queueSize > alertThresholds.queueSize * 2) {
      return false;
    }

    if (metrics.averageProcessingTime > alertThresholds.processingTime * 2) {
      return false;
    }

    return true;
  }

  /**
   * Perform initial recovery check
   */
  private async performRecoveryCheck(): Promise<void> {
    try {
      logger.info('Performing initial recovery check');

      // Check for stuck jobs
      await this.checkTimeoutJobs();

      // Clean up expired files
      const cleanupResult = await jobLifecycleService.cleanupCompletedJobs(24);
      
      if (cleanupResult.cleanedFiles > 0) {
        this.recordRecoveryAction({
          type: 'CLEANUP_EXPIRED',
          reason: `Cleaned up ${cleanupResult.cleanedFiles} expired files`,
          timestamp: new Date(),
          success: true
        });
      }

      logger.info('Initial recovery check completed');
    } catch (error) {
      logger.error('Initial recovery check failed:', error);
      // Re-throw error to fail startup if critical
      throw error;
    }
  }

  /**
   * Perform graceful shutdown
   */
  private async performGracefulShutdown(timeoutMs: number): Promise<void> {
    logger.info('Starting graceful shutdown');

    try {
      // Stop monitoring first
      await this.stopMonitoring();

      // Stop job queue processing
      await jobQueueService.stopProcessing();

      // Wait for current jobs to complete or timeout
      const startTime = Date.now();
      while (Date.now() - startTime < timeoutMs) {
        const queueStatus = await jobQueueService.getQueueStatus();
        if (queueStatus.processing === 0) {
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Final cleanup
      await this.performFinalCleanup();

      logger.info('Graceful shutdown completed');
    } catch (error) {
      logger.error('Error during graceful shutdown:', error);
      throw error;
    }
  }

  /**
   * Perform final cleanup
   */
  private async performFinalCleanup(): Promise<void> {
    try {
      // Handle any remaining timeout jobs
      await this.checkTimeoutJobs();

      // Clear alerts and recovery actions to free memory
      this.alerts = [];
      this.recoveryActions = [];

      logger.info('Final cleanup completed');
    } catch (error) {
      logger.error('Error during final cleanup:', error);
    }
  }

  /**
   * Add alert to the system
   */
  private addAlert(alert: Alert): void {
    this.alerts.push(alert);
    
    // Keep only last 1000 alerts to prevent memory issues
    if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(-1000);
    }

    // Log alert
    const logLevel = alert.type === 'CRITICAL' ? 'error' : 
                    alert.type === 'ERROR' ? 'error' : 'warn';
    
    logger[logLevel](`Alert: ${alert.message}`, {
      type: alert.type,
      jobId: alert.jobId,
      metric: alert.metric,
      value: alert.value,
      threshold: alert.threshold
    });
  }

  /**
   * Record recovery action
   */
  private recordRecoveryAction(action: RecoveryAction): void {
    this.recoveryActions.push(action);
    
    // Keep only last 500 actions to prevent memory issues
    if (this.recoveryActions.length > 500) {
      this.recoveryActions = this.recoveryActions.slice(-500);
    }

    logger.info(`Recovery action: ${action.type}`, {
      jobId: action.jobId,
      reason: action.reason,
      success: action.success,
      error: action.error
    });
  }

  /**
   * Get monitoring statistics
   */
  getMonitoringStats(): {
    isRunning: boolean;
    alertCount: number;
    recoveryActionCount: number;
    config: MonitoringConfig;
  } {
    return {
      isRunning: this.isRunning,
      alertCount: this.alerts.length,
      recoveryActionCount: this.recoveryActions.length,
      config: this.config
    };
  }
}

export const jobMonitoringService = new JobMonitoringService();