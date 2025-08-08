import { DatabaseErrorHandler } from '../utils/database';

describe('DatabaseErrorHandler', () => {
  describe('isConnectionError', () => {
    it('should identify connection errors', () => {
      const connectionError = { code: 'P1001' };
      expect(DatabaseErrorHandler.isConnectionError(connectionError)).toBe(true);
      
      const otherError = { code: 'P2002' };
      expect(DatabaseErrorHandler.isConnectionError(otherError)).toBe(false);
    });

    it('should identify connection errors by message', () => {
      const connectionError = { message: 'connection failed' };
      expect(DatabaseErrorHandler.isConnectionError(connectionError)).toBe(true);
      
      const otherError = { message: 'validation failed' };
      expect(DatabaseErrorHandler.isConnectionError(otherError)).toBe(false);
    });
  });

  describe('isConstraintError', () => {
    it('should identify constraint errors', () => {
      const constraintError = { code: 'P2002' };
      expect(DatabaseErrorHandler.isConstraintError(constraintError)).toBe(true);
      
      const otherError = { code: 'P1001' };
      expect(DatabaseErrorHandler.isConstraintError(otherError)).toBe(false);
    });

    it('should identify unique constraint violations', () => {
      const uniqueError = { code: 'P2002' };
      expect(DatabaseErrorHandler.isConstraintError(uniqueError)).toBe(true);
    });

    it('should identify foreign key constraint violations', () => {
      const fkError = { code: 'P2003' };
      expect(DatabaseErrorHandler.isConstraintError(fkError)).toBe(true);
    });
  });

  describe('isTimeoutError', () => {
    it('should identify timeout errors', () => {
      const timeoutError = { code: 'P1008' };
      expect(DatabaseErrorHandler.isTimeoutError(timeoutError)).toBe(true);
      
      const otherError = { code: 'P2002' };
      expect(DatabaseErrorHandler.isTimeoutError(otherError)).toBe(false);
    });

    it('should identify timeout errors by message', () => {
      const timeoutError = { message: 'operation timeout' };
      expect(DatabaseErrorHandler.isTimeoutError(timeoutError)).toBe(true);
      
      const otherError = { message: 'validation failed' };
      expect(DatabaseErrorHandler.isTimeoutError(otherError)).toBe(false);
    });
  });

  describe('getRetryableError', () => {
    it('should identify retryable connection errors', () => {
      const connectionError = { code: 'P1001' };
      expect(DatabaseErrorHandler.getRetryableError(connectionError)).toBe(true);
    });

    it('should identify retryable timeout errors', () => {
      const timeoutError = { code: 'P1008' };
      expect(DatabaseErrorHandler.getRetryableError(timeoutError)).toBe(true);
    });

    it('should not identify constraint errors as retryable', () => {
      const constraintError = { code: 'P2002' };
      expect(DatabaseErrorHandler.getRetryableError(constraintError)).toBe(false);
    });
  });

  describe('getUserFriendlyMessage', () => {
    it('should return appropriate message for connection errors', () => {
      const connectionError = { code: 'P1001' };
      const message = DatabaseErrorHandler.getUserFriendlyMessage(connectionError);
      expect(message).toBe('Database connection error. Please try again.');
    });

    it('should return appropriate message for constraint errors', () => {
      const constraintError = { code: 'P2002' };
      const message = DatabaseErrorHandler.getUserFriendlyMessage(constraintError);
      expect(message).toBe('Data validation error. Please check your input.');
    });

    it('should return appropriate message for timeout errors', () => {
      const timeoutError = { code: 'P1008' };
      const message = DatabaseErrorHandler.getUserFriendlyMessage(timeoutError);
      expect(message).toBe('Operation timed out. Please try again.');
    });

    it('should return generic message for unknown errors', () => {
      const unknownError = { code: 'UNKNOWN' };
      const message = DatabaseErrorHandler.getUserFriendlyMessage(unknownError);
      expect(message).toBe('An unexpected database error occurred.');
    });
  });
});