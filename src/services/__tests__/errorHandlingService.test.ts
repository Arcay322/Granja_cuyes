import ErrorHandlingService from '../errorHandlingService';
import { ErrorInfo } from '../../components/common/ErrorDisplay';

// Mock fetch for testing
global.fetch = jest.fn();

// Mock console methods
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
const mockConsoleGroup = jest.spyOn(console, 'group').mockImplementation();
const mockConsoleGroupEnd = jest.spyOn(console, 'groupEnd').mockImplementation();

// Mock localStorage and sessionStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });
Object.defineProperty(window, 'sessionStorage', { value: mockSessionStorage });

describe('ErrorHandlingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ErrorHandlingService.clearErrorHistory();
    (fetch as jest.Mock).mockClear();
  });

  describe('createErrorInfo', () => {
    it('creates ErrorInfo from string', () => {
      const errorInfo = ErrorHandlingService.createErrorInfo('Test error message');
      
      expect(errorInfo).toMatchObject({
        type: 'unknown',
        message: 'Test error message',
        retryable: false
      });
      expect(errorInfo.timestamp).toBeInstanceOf(Date);
    });

    it('creates ErrorInfo from Error object', () => {
      const error = new Error('Test error');
      error.stack = 'Error stack trace';
      
      const errorInfo = ErrorHandlingService.createErrorInfo(error);
      
      expect(errorInfo).toMatchObject({
        type: 'unknown',
        message: 'Test error',
        details: 'Error stack trace',
        retryable: false
      });
    });

    it('creates ErrorInfo from Axios error with network failure', () => {
      const axiosError = {
        code: 'ECONNABORTED',
        message: 'timeout of 5000ms exceeded',
        response: undefined
      };
      
      const errorInfo = ErrorHandlingService.createErrorInfo(axiosError);
      
      expect(errorInfo).toMatchObject({
        type: 'timeout',
        message: 'La operación tardó más de lo esperado',
        retryable: true,
        code: 'ECONNABORTED'
      });
    });

    it('creates ErrorInfo from Axios error with 400 status', () => {
      const axiosError = {
        response: {
          status: 400,
          statusText: 'Bad Request',
          data: { message: 'Invalid input data' }
        },
        config: {
          method: 'POST',
          url: '/api/test'
        }
      };
      
      const errorInfo = ErrorHandlingService.createErrorInfo(axiosError);
      
      expect(errorInfo).toMatchObject({
        type: 'validation',
        message: 'Invalid input data',
        retryable: false,
        code: '400'
      });
    });

    it('creates ErrorInfo from Axios error with 500 status', () => {
      const axiosError = {
        response: {
          status: 500,
          statusText: 'Internal Server Error',
          data: { message: 'Server error' }
        }
      };
      
      const errorInfo = ErrorHandlingService.createErrorInfo(axiosError);
      
      expect(errorInfo).toMatchObject({
        type: 'server',
        message: 'Server error',
        retryable: true,
        code: '500'
      });
    });

    it('includes context in ErrorInfo', () => {
      const context = { userId: '123', action: 'test' };
      const errorInfo = ErrorHandlingService.createErrorInfo('Test error', context);
      
      expect(errorInfo.context).toEqual(context);
    });
  });

  describe('executeWithRetry', () => {
    it('executes operation successfully on first try', async () => {
      const mockOperation = jest.fn().mockResolvedValue('success');
      
      const result = await ErrorHandlingService.executeWithRetry(mockOperation);
      
      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('retries operation on failure', async () => {
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockRejectedValueOnce(new Error('Second failure'))
        .mockResolvedValue('success');
      
      const result = await ErrorHandlingService.executeWithRetry(mockOperation, {
        maxRetries: 3,
        baseDelay: 10 // Short delay for testing
      });
      
      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(3);
    });

    it('throws error after max retries exceeded', async () => {
      const mockOperation = jest.fn().mockRejectedValue(new Error('Persistent failure'));
      
      await expect(
        ErrorHandlingService.executeWithRetry(mockOperation, {
          maxRetries: 2,
          baseDelay: 10
        })
      ).rejects.toThrow('Persistent failure');
      
      expect(mockOperation).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('does not retry non-retryable errors', async () => {
      const axiosError = {
        response: {
          status: 400,
          data: { message: 'Bad request' }
        }
      };
      
      const mockOperation = jest.fn().mockRejectedValue(axiosError);
      
      await expect(
        ErrorHandlingService.executeWithRetry(mockOperation, {
          maxRetries: 3,
          baseDelay: 10
        })
      ).rejects.toEqual(axiosError);
      
      expect(mockOperation).toHaveBeenCalledTimes(1); // No retries for validation errors
    });

    it('applies exponential backoff with jitter', async () => {
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockRejectedValueOnce(new Error('Second failure'))
        .mockResolvedValue('success');
      
      const startTime = Date.now();
      
      await ErrorHandlingService.executeWithRetry(mockOperation, {
        maxRetries: 2,
        baseDelay: 100,
        backoffMultiplier: 2,
        jitter: false // Disable jitter for predictable timing
      });
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      // Should have waited at least 100ms + 200ms = 300ms
      expect(totalTime).toBeGreaterThan(250);
    });
  });

  describe('logError', () => {
    it('logs error to console in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const errorInfo: ErrorInfo = {
        type: 'network',
        message: 'Test error',
        timestamp: new Date(),
        retryable: true
      };
      
      ErrorHandlingService.logError(errorInfo);
      
      expect(mockConsoleGroup).toHaveBeenCalledWith('🚨 Error: NETWORK');
      expect(mockConsoleError).toHaveBeenCalledWith('Message:', 'Test error');
      expect(mockConsoleGroupEnd).toHaveBeenCalled();
      
      process.env.NODE_ENV = originalEnv;
    });

    it('sends error to logging service in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const errorInfo: ErrorInfo = {
        type: 'server',
        message: 'Production error',
        timestamp: new Date(),
        retryable: false
      };
      
      ErrorHandlingService.logError(errorInfo);
      
      expect(fetch).toHaveBeenCalledWith('/api/errors/log', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('Production error')
      }));
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('reportError', () => {
    it('creates and sends error report', async () => {
      (fetch as jest.Mock).mockResolvedValue({ ok: true });
      mockLocalStorage.getItem.mockReturnValue('user123');
      mockSessionStorage.getItem.mockReturnValue('session456');
      
      const errorInfo: ErrorInfo = {
        type: 'network',
        message: 'Network error',
        timestamp: new Date(),
        retryable: true
      };
      
      await ErrorHandlingService.reportError(errorInfo, { additionalData: 'test' });
      
      expect(fetch).toHaveBeenCalledWith('/api/errors/report', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }));
      
      const callArgs = (fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);
      
      expect(requestBody).toMatchObject({
        error: errorInfo,
        userId: 'user123',
        sessionId: 'session456',
        additionalInfo: { additionalData: 'test' }
      });
    });

    it('handles reporting failure gracefully', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Network failure'));
      
      const errorInfo: ErrorInfo = {
        type: 'server',
        message: 'Server error',
        timestamp: new Date(),
        retryable: false
      };
      
      // Should not throw
      await expect(
        ErrorHandlingService.reportError(errorInfo)
      ).resolves.toBeUndefined();
      
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Failed to send error report:',
        expect.any(Error)
      );
    });
  });

  describe('getErrorStats', () => {
    it('returns correct error statistics', async () => {
      // Add some test errors
      const errors = [
        { type: 'network' as const, message: 'Network 1', timestamp: new Date(), retryable: true },
        { type: 'network' as const, message: 'Network 2', timestamp: new Date(), retryable: true },
        { type: 'server' as const, message: 'Server 1', timestamp: new Date(), retryable: false }
      ];
      
      for (const error of errors) {
        await ErrorHandlingService.reportError(error);
      }
      
      const stats = ErrorHandlingService.getErrorStats();
      
      expect(stats.totalErrors).toBe(3);
      expect(stats.errorsByType).toEqual({
        network: 2,
        server: 1
      });
      expect(stats.recentErrors).toHaveLength(3);
    });

    it('limits recent errors to 10', async () => {
      // Add 15 errors
      for (let i = 0; i < 15; i++) {
        await ErrorHandlingService.reportError({
          type: 'network',
          message: `Error ${i}`,
          timestamp: new Date(),
          retryable: true
        });
      }
      
      const stats = ErrorHandlingService.getErrorStats();
      
      expect(stats.totalErrors).toBe(15);
      expect(stats.recentErrors).toHaveLength(10);
    });
  });

  describe('clearErrorHistory', () => {
    it('clears all error history', async () => {
      // Add some errors
      await ErrorHandlingService.reportError({
        type: 'network',
        message: 'Test error',
        timestamp: new Date(),
        retryable: true
      });
      
      let stats = ErrorHandlingService.getErrorStats();
      expect(stats.totalErrors).toBe(1);
      
      ErrorHandlingService.clearErrorHistory();
      
      stats = ErrorHandlingService.getErrorStats();
      expect(stats.totalErrors).toBe(0);
      expect(stats.recentErrors).toHaveLength(0);
    });
  });
});