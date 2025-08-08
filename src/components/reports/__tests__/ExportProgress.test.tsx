import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ExportProgress, { ExportJob } from '../ExportProgress';

// Mock MUI components
jest.mock('../../../utils/mui', () => ({
  Box: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Typography: ({ children, variant, ...props }: any) => <span {...props} data-variant={variant}>{children}</span>,
  LinearProgress: ({ value, ...props }: any) => <div {...props} data-progress={value}>Progress: {value}%</div>,
  Button: ({ children, onClick, ...props }: any) => <button onClick={onClick} {...props}>{children}</button>,
  Chip: ({ label, color, ...props }: any) => <span {...props} data-color={color}>{label}</span>,
  Alert: ({ children, severity, ...props }: any) => <div {...props} data-severity={severity}>{children}</div>,
  IconButton: ({ children, onClick, ...props }: any) => <button onClick={onClick} {...props}>{children}</button>,
  Tooltip: ({ children, title }: any) => <div title={title}>{children}</div>,
  CircularProgress: (props: any) => <div {...props}>Loading...</div>
}));

// Mock icons
jest.mock('@mui/icons-material', () => ({
  Cancel: () => <span>CancelIcon</span>,
  Refresh: () => <span>RetryIcon</span>,
  Download: () => <span>DownloadIcon</span>,
  CheckCircle: () => <span>SuccessIcon</span>,
  Error: () => <span>ErrorIcon</span>,
  Schedule: () => <span>PendingIcon</span>,
  PlayArrow: () => <span>ProcessingIcon</span>
}));

describe('ExportProgress', () => {
  const mockJob: ExportJob = {
    id: 'job-123',
    templateId: 'reproductive',
    format: 'PDF',
    status: 'PENDING',
    progress: 0,
    createdAt: '2024-01-15T10:00:00Z'
  };

  const mockHandlers = {
    onCancel: jest.fn(),
    onRetry: jest.fn(),
    onDownload: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders pending job correctly', () => {
      render(<ExportProgress job={mockJob} {...mockHandlers} />);
      
      expect(screen.getByText('reproductive')).toBeInTheDocument();
      expect(screen.getByText('Formato: PDF')).toBeInTheDocument();
      expect(screen.getByText('En cola')).toBeInTheDocument();
      expect(screen.getByText('PendingIcon')).toBeInTheDocument();
    });

    it('renders processing job with progress', () => {
      const processingJob: ExportJob = {
        ...mockJob,
        status: 'PROCESSING',
        progress: 45,
        startedAt: '2024-01-15T10:01:00Z'
      };

      render(<ExportProgress job={processingJob} {...mockHandlers} />);
      
      expect(screen.getByText('Procesando')).toBeInTheDocument();
      expect(screen.getByText('45%')).toBeInTheDocument();
      expect(screen.getByText('ProcessingIcon')).toBeInTheDocument();
      expect(screen.getByText('Progreso')).toBeInTheDocument();
    });

    it('renders completed job with download buttons', () => {
      const completedJob: ExportJob = {
        ...mockJob,
        status: 'COMPLETED',
        progress: 100,
        completedAt: '2024-01-15T10:05:00Z',
        files: [
          {
            id: 'file-1',
            fileName: 'report.pdf',
            fileSize: '2048',
            downloadCount: 3
          }
        ]
      };

      render(<ExportProgress job={completedJob} {...mockHandlers} />);
      
      expect(screen.getByText('Completado')).toBeInTheDocument();
      expect(screen.getByText('SuccessIcon')).toBeInTheDocument();
      expect(screen.getByText('Archivos disponibles:')).toBeInTheDocument();
      expect(screen.getByText(/report\.pdf/)).toBeInTheDocument();
      expect(screen.getByText(/2\.0 KB/)).toBeInTheDocument();
    });

    it('renders failed job with error message', () => {
      const failedJob: ExportJob = {
        ...mockJob,
        status: 'FAILED',
        errorMessage: 'Database connection failed'
      };

      render(<ExportProgress job={failedJob} {...mockHandlers} />);
      
      expect(screen.getByText('Falló')).toBeInTheDocument();
      expect(screen.getByText('ErrorIcon')).toBeInTheDocument();
      expect(screen.getByText('Database connection failed')).toBeInTheDocument();
    });
  });

  describe('Compact Mode', () => {
    it('renders compact version correctly', () => {
      render(<ExportProgress job={mockJob} compact={true} {...mockHandlers} />);
      
      expect(screen.getByText('reproductive - PDF')).toBeInTheDocument();
      expect(screen.getByText('En cola')).toBeInTheDocument();
      
      // Should not show detailed information in compact mode
      expect(screen.queryByText('Formato: PDF')).not.toBeInTheDocument();
    });

    it('shows progress bar in compact mode for processing jobs', () => {
      const processingJob: ExportJob = {
        ...mockJob,
        status: 'PROCESSING',
        progress: 30
      };

      render(<ExportProgress job={processingJob} compact={true} {...mockHandlers} />);
      
      expect(screen.getByText('reproductive - PDF')).toBeInTheDocument();
      expect(screen.getByText('Procesando')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('calls onCancel when cancel button is clicked', () => {
      const processingJob: ExportJob = {
        ...mockJob,
        status: 'PROCESSING',
        progress: 30
      };

      render(<ExportProgress job={processingJob} {...mockHandlers} />);
      
      const cancelButton = screen.getByTitle('Cancelar exportación');
      fireEvent.click(cancelButton);
      
      expect(mockHandlers.onCancel).toHaveBeenCalledWith('job-123');
    });

    it('calls onRetry when retry button is clicked', () => {
      const failedJob: ExportJob = {
        ...mockJob,
        status: 'FAILED',
        errorMessage: 'Something went wrong'
      };

      render(<ExportProgress job={failedJob} {...mockHandlers} />);
      
      const retryButton = screen.getByTitle('Reintentar exportación');
      fireEvent.click(retryButton);
      
      expect(mockHandlers.onRetry).toHaveBeenCalledWith('job-123');
    });

    it('calls onDownload when download button is clicked', () => {
      const completedJob: ExportJob = {
        ...mockJob,
        status: 'COMPLETED',
        progress: 100,
        files: [
          {
            id: 'file-1',
            fileName: 'report.pdf',
            fileSize: '2048',
            downloadCount: 0
          }
        ]
      };

      render(<ExportProgress job={completedJob} {...mockHandlers} />);
      
      const downloadButton = screen.getByText(/report\.pdf/);
      fireEvent.click(downloadButton);
      
      expect(mockHandlers.onDownload).toHaveBeenCalledWith('job-123', 'file-1', 'report.pdf');
    });
  });

  describe('Status Display', () => {
    const statusTests = [
      { status: 'PENDING' as const, expectedText: 'En cola', expectedIcon: 'PendingIcon' },
      { status: 'PROCESSING' as const, expectedText: 'Procesando', expectedIcon: 'ProcessingIcon' },
      { status: 'COMPLETED' as const, expectedText: 'Completado', expectedIcon: 'SuccessIcon' },
      { status: 'FAILED' as const, expectedText: 'Falló', expectedIcon: 'ErrorIcon' },
      { status: 'TIMEOUT' as const, expectedText: 'Tiempo agotado', expectedIcon: 'ErrorIcon' }
    ];

    statusTests.forEach(({ status, expectedText, expectedIcon }) => {
      it(`displays correct status for ${status}`, () => {
        const job: ExportJob = { ...mockJob, status };
        render(<ExportProgress job={job} {...mockHandlers} />);
        
        expect(screen.getByText(expectedText)).toBeInTheDocument();
        expect(screen.getByText(expectedIcon)).toBeInTheDocument();
      });
    });
  });

  describe('File Size Formatting', () => {
    it('formats file sizes correctly', () => {
      const completedJob: ExportJob = {
        ...mockJob,
        status: 'COMPLETED',
        files: [
          { id: '1', fileName: 'small.pdf', fileSize: '512', downloadCount: 0 },
          { id: '2', fileName: 'medium.pdf', fileSize: '2048', downloadCount: 0 },
          { id: '3', fileName: 'large.pdf', fileSize: '2097152', downloadCount: 0 }
        ]
      };

      render(<ExportProgress job={completedJob} {...mockHandlers} />);
      
      expect(screen.getByText(/512 B/)).toBeInTheDocument();
      expect(screen.getByText(/2\.0 KB/)).toBeInTheDocument();
      expect(screen.getByText(/2\.0 MB/)).toBeInTheDocument();
    });
  });

  describe('Time Estimation', () => {
    it('shows estimated time remaining for processing jobs', async () => {
      // Mock Date.now to control time calculations
      const mockNow = jest.spyOn(Date, 'now');
      const startTime = new Date('2024-01-15T10:00:00Z').getTime();
      const currentTime = startTime + 10000; // 10 seconds later
      
      mockNow.mockReturnValue(currentTime);

      const processingJob: ExportJob = {
        ...mockJob,
        status: 'PROCESSING',
        progress: 25, // 25% complete in 10 seconds
        startedAt: '2024-01-15T10:00:00Z'
      };

      render(<ExportProgress job={processingJob} {...mockHandlers} />);
      
      // Should show some time estimation (exact calculation may vary)
      await waitFor(() => {
        expect(screen.getByText(/restante/)).toBeInTheDocument();
      });

      mockNow.mockRestore();
    });
  });

  describe('Action Button Visibility', () => {
    it('shows cancel button for pending and processing jobs', () => {
      const pendingJob: ExportJob = { ...mockJob, status: 'PENDING' };
      const { rerender } = render(<ExportProgress job={pendingJob} {...mockHandlers} />);
      
      expect(screen.getByTitle('Cancelar exportación')).toBeInTheDocument();
      
      const processingJob: ExportJob = { ...mockJob, status: 'PROCESSING', progress: 50 };
      rerender(<ExportProgress job={processingJob} {...mockHandlers} />);
      
      expect(screen.getByTitle('Cancelar exportación')).toBeInTheDocument();
    });

    it('shows retry button for failed and timeout jobs', () => {
      const failedJob: ExportJob = { ...mockJob, status: 'FAILED' };
      const { rerender } = render(<ExportProgress job={failedJob} {...mockHandlers} />);
      
      expect(screen.getByTitle('Reintentar exportación')).toBeInTheDocument();
      
      const timeoutJob: ExportJob = { ...mockJob, status: 'TIMEOUT' };
      rerender(<ExportProgress job={timeoutJob} {...mockHandlers} />);
      
      expect(screen.getByTitle('Reintentar exportación')).toBeInTheDocument();
    });

    it('shows download buttons only for completed jobs with files', () => {
      const completedJobWithFiles: ExportJob = {
        ...mockJob,
        status: 'COMPLETED',
        files: [{ id: '1', fileName: 'test.pdf', fileSize: '1024', downloadCount: 0 }]
      };
      
      const { rerender } = render(<ExportProgress job={completedJobWithFiles} {...mockHandlers} />);
      expect(screen.getByText(/test\.pdf/)).toBeInTheDocument();
      
      const completedJobWithoutFiles: ExportJob = {
        ...mockJob,
        status: 'COMPLETED',
        files: []
      };
      
      rerender(<ExportProgress job={completedJobWithoutFiles} {...mockHandlers} />);
      expect(screen.queryByText('Archivos disponibles:')).not.toBeInTheDocument();
    });
  });
});