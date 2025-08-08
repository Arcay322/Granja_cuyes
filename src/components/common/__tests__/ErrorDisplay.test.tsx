import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ErrorDisplay, { ErrorInfo } from '../ErrorDisplay';

// Mock Material-UI components for testing
jest.mock('@mui/material', () => ({
  ...jest.requireActual('@mui/material'),
  Alert: ({ children, severity, onClose, ...props }: any) => (
    <div data-testid="alert" data-severity={severity} {...props}>
      {onClose && <button onClick={onClose} data-testid="close-button">×</button>}
      {children}
    </div>
  ),
  AlertTitle: ({ children }: any) => <div data-testid="alert-title">{children}</div>,
  Box: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Button: ({ children, onClick, startIcon, ...props }: any) => (
    <button onClick={onClick} data-testid={props['data-testid'] || 'button'} {...props}>
      {startIcon && <span data-testid="button-icon">{startIcon}</span>}
      {children}
    </button>
  ),
  Typography: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  Chip: ({ label, ...props }: any) => <span data-testid="chip" {...props}>{label}</span>,
  Stack: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  IconButton: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} data-testid="icon-button" {...props}>{children}</button>
  ),
  Collapse: ({ children, in: isOpen }: any) => isOpen ? <div>{children}</div> : null
}));

describe('ErrorDisplay', () => {
  const mockError: ErrorInfo = {
    type: 'network',
    code: 'NETWORK_ERROR',
    message: 'Failed to connect to server',
    details: 'Connection timeout after 5000ms',
    timestamp: new Date('2024-01-01T12:00:00Z'),
    retryable: true,
    retryCount: 1,
    maxRetries: 3,
    context: { url: '/api/test' }
  };

  const mockOnRetry = jest.fn();
  const mockOnReport = jest.fn();
  const mockOnDismiss = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders error message correctly', () => {
    render(<ErrorDisplay error={mockError} />);
    
    expect(screen.getByText('Failed to connect to server')).toBeInTheDocument();
    expect(screen.getByText('Error de Conexión')).toBeInTheDocument();
  });

  it('displays error code when provided', () => {
    render(<ErrorDisplay error={mockError} />);
    
    expect(screen.getByTestId('chip')).toHaveTextContent('NETWORK_ERROR');
  });

  it('shows retry count when available', () => {
    render(<ErrorDisplay error={mockError} />);
    
    expect(screen.getByText('Intento 1/3')).toBeInTheDocument();
  });

  it('displays appropriate severity based on error type', () => {
    render(<ErrorDisplay error={mockError} />);
    
    expect(screen.getByTestId('alert')).toHaveAttribute('data-severity', 'error');
  });

  it('shows retry button when error is retryable and callback provided', () => {
    render(<ErrorDisplay error={mockError} onRetry={mockOnRetry} />);
    
    const retryButton = screen.getByText('Reintentar');
    expect(retryButton).toBeInTheDocument();
    
    fireEvent.click(retryButton);
    expect(mockOnRetry).toHaveBeenCalledTimes(1);
  });

  it('hides retry button when max retries reached', () => {
    const maxRetriesError = { ...mockError, retryCount: 3, maxRetries: 3 };
    render(<ErrorDisplay error={maxRetriesError} onRetry={mockOnRetry} />);
    
    expect(screen.queryByText('Reintentar')).not.toBeInTheDocument();
  });

  it('shows report button when callback provided', () => {
    render(<ErrorDisplay error={mockError} onReport={mockOnReport} />);
    
    const reportButton = screen.getByText('Reportar Error');
    expect(reportButton).toBeInTheDocument();
    
    fireEvent.click(reportButton);
    expect(mockOnReport).toHaveBeenCalledWith(mockError);
  });

  it('handles dismiss functionality', () => {
    render(<ErrorDisplay error={mockError} onDismiss={mockOnDismiss} />);
    
    const closeButton = screen.getByTestId('close-button');
    fireEvent.click(closeButton);
    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
  });

  it('expands and collapses details section', () => {
    render(<ErrorDisplay error={mockError} />);
    
    // Initially collapsed
    expect(screen.queryByText('Connection timeout after 5000ms')).not.toBeInTheDocument();
    
    // Click to expand
    const expandButton = screen.getByText('Ver detalles técnicos');
    fireEvent.click(expandButton);
    
    expect(screen.getByText('Connection timeout after 5000ms')).toBeInTheDocument();
    
    // Click to collapse
    const collapseButton = screen.getByText('Ocultar detalles');
    fireEvent.click(collapseButton);
    
    expect(screen.queryByText('Connection timeout after 5000ms')).not.toBeInTheDocument();
  });

  it('renders in compact mode', () => {
    render(<ErrorDisplay error={mockError} compact={true} />);
    
    // Should not show detailed recovery actions in compact mode
    expect(screen.queryByText('Acciones recomendadas:')).not.toBeInTheDocument();
    expect(screen.getByText('Failed to connect to server')).toBeInTheDocument();
  });

  it('displays appropriate recovery actions for different error types', () => {
    const validationError: ErrorInfo = {
      ...mockError,
      type: 'validation',
      message: 'Invalid input data'
    };
    
    render(<ErrorDisplay error={validationError} />);
    
    expect(screen.getByText('Revisa los datos ingresados')).toBeInTheDocument();
  });

  it('shows context information in details', () => {
    render(<ErrorDisplay error={mockError} showDetails={true} />);
    
    // Expand details
    const expandButton = screen.getByTestId('icon-button');
    fireEvent.click(expandButton);
    
    expect(screen.getByText(/url.*\/api\/test/)).toBeInTheDocument();
  });

  it('handles different error types correctly', () => {
    const errorTypes: Array<{ type: ErrorInfo['type'], expectedTitle: string, expectedSeverity: string }> = [
      { type: 'validation', expectedTitle: 'Error de Validación', expectedSeverity: 'warning' },
      { type: 'network', expectedTitle: 'Error de Conexión', expectedSeverity: 'error' },
      { type: 'server', expectedTitle: 'Error del Servidor', expectedSeverity: 'error' },
      { type: 'timeout', expectedTitle: 'Tiempo de Espera Agotado', expectedSeverity: 'error' },
      { type: 'permission', expectedTitle: 'Permisos Insuficientes', expectedSeverity: 'warning' },
      { type: 'storage', expectedTitle: 'Error de Almacenamiento', expectedSeverity: 'error' },
      { type: 'unknown', expectedTitle: 'Error Desconocido', expectedSeverity: 'error' }
    ];

    errorTypes.forEach(({ type, expectedTitle, expectedSeverity }) => {
      const { unmount } = render(
        <ErrorDisplay error={{ ...mockError, type }} />
      );
      
      expect(screen.getByText(expectedTitle)).toBeInTheDocument();
      expect(screen.getByTestId('alert')).toHaveAttribute('data-severity', expectedSeverity);
      
      unmount();
    });
  });

  it('formats timestamp correctly', () => {
    render(<ErrorDisplay error={mockError} showDetails={true} />);
    
    // Expand details
    const expandButton = screen.getByTestId('icon-button');
    fireEvent.click(expandButton);
    
    expect(screen.getByText(/Timestamp:/)).toBeInTheDocument();
  });
});

describe('ErrorDisplay Edge Cases', () => {
  it('handles error without details', () => {
    const errorWithoutDetails: ErrorInfo = {
      type: 'network',
      message: 'Simple error',
      timestamp: new Date(),
      retryable: false
    };
    
    render(<ErrorDisplay error={errorWithoutDetails} />);
    
    expect(screen.getByText('Simple error')).toBeInTheDocument();
    expect(screen.queryByText('Ver detalles técnicos')).not.toBeInTheDocument();
  });

  it('handles error without code', () => {
    const errorWithoutCode: ErrorInfo = {
      type: 'network',
      message: 'Error without code',
      timestamp: new Date(),
      retryable: false
    };
    
    render(<ErrorDisplay error={errorWithoutCode} />);
    
    expect(screen.queryByTestId('chip')).not.toBeInTheDocument();
  });

  it('handles non-retryable errors', () => {
    const nonRetryableError: ErrorInfo = {
      type: 'validation',
      message: 'Validation failed',
      timestamp: new Date(),
      retryable: false
    };
    
    render(<ErrorDisplay error={nonRetryableError} onRetry={jest.fn()} />);
    
    expect(screen.queryByText('Reintentar')).not.toBeInTheDocument();
  });
});