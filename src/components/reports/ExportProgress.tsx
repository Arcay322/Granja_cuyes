import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Button,
  Chip,
  Alert,
  IconButton,
  Tooltip,
  CircularProgress
} from '../../utils/mui';
import {
  Cancel as CancelIcon,
  Refresh as RetryIcon,
  Download as DownloadIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Schedule as PendingIcon,
  PlayArrow as ProcessingIcon
} from '@mui/icons-material';

export interface ExportJob {
  id: string;
  templateId: string;
  format: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'TIMEOUT';
  progress: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
  files?: Array<{
    id: string;
    fileName: string;
    fileSize: string;
    downloadCount: number;
  }>;
}

interface ExportProgressProps {
  job: ExportJob;
  onCancel?: (jobId: string) => void;
  onRetry?: (jobId: string) => void;
  onDownload?: (jobId: string, fileId: string, fileName: string) => void;
  showDetails?: boolean;
  compact?: boolean;
}

const ExportProgress: React.FC<ExportProgressProps> = ({
  job,
  onCancel,
  onRetry,
  onDownload,
  showDetails = true,
  compact = false
}) => {
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | null>(null);

  // Calculate estimated time remaining
  useEffect(() => {
    if (job.status === 'PROCESSING' && job.startedAt && job.progress > 0 && job.progress < 100) {
      const startTime = new Date(job.startedAt).getTime();
      const currentTime = Date.now();
      const elapsedTime = currentTime - startTime;
      
      // Only calculate if we have meaningful elapsed time and progress
      if (elapsedTime > 1000 && job.progress > 5) {
        const progressRate = job.progress / elapsedTime; // progress per millisecond
        const remainingProgress = 100 - job.progress;
        const estimatedRemaining = remainingProgress / progressRate;
        
        // Cap the estimate at a reasonable maximum (30 minutes)
        setEstimatedTimeRemaining(Math.min(Math.max(0, estimatedRemaining), 30 * 60 * 1000));
      } else {
        setEstimatedTimeRemaining(null);
      }
    } else {
      setEstimatedTimeRemaining(null);
    }
  }, [job.status, job.startedAt, job.progress]);

  const getStatusIcon = () => {
    switch (job.status) {
      case 'PENDING':
        return <PendingIcon color="action" />;
      case 'PROCESSING':
        return <ProcessingIcon color="primary" />;
      case 'COMPLETED':
        return <SuccessIcon color="success" />;
      case 'FAILED':
      case 'TIMEOUT':
        return <ErrorIcon color="error" />;
      default:
        return <PendingIcon color="action" />;
    }
  };

  const getStatusColor = () => {
    switch (job.status) {
      case 'COMPLETED':
        return 'success';
      case 'FAILED':
      case 'TIMEOUT':
        return 'error';
      case 'PROCESSING':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusText = () => {
    switch (job.status) {
      case 'PENDING':
        return 'En cola';
      case 'PROCESSING':
        return 'Procesando';
      case 'COMPLETED':
        return 'Completado';
      case 'FAILED':
        return 'Falló';
      case 'TIMEOUT':
        return 'Tiempo agotado';
      default:
        return job.status;
    }
  };

  const formatTimeRemaining = (milliseconds: number) => {
    const seconds = Math.ceil(milliseconds / 1000);
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      return `${Math.ceil(seconds / 60)}m`;
    } else {
      return `${Math.ceil(seconds / 3600)}h`;
    }
  };

  const formatFileSize = (sizeStr: string) => {
    const size = parseInt(sizeStr);
    if (size < 1024) {
      return `${size} B`;
    } else if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    } else {
      return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    }
  };

  const canCancel = job.status === 'PENDING' || job.status === 'PROCESSING';
  const canRetry = job.status === 'FAILED' || job.status === 'TIMEOUT';
  const canDownload = job.status === 'COMPLETED' && job.files && job.files.length > 0;

  if (compact) {
    return (
      <Box display="flex" alignItems="center" gap={2} p={1}>
        {getStatusIcon()}
        <Box flex={1}>
          <Typography variant="body2" fontWeight="medium">
            {job.templateId} - {job.format}
          </Typography>
          {job.status === 'PROCESSING' && (
            <LinearProgress 
              variant="determinate" 
              value={job.progress} 
              sx={{ mt: 0.5, height: 4 }}
            />
          )}
        </Box>
        <Chip
          label={getStatusText()}
          color={getStatusColor() as any}
          size="small"
        />
        {canCancel && onCancel && (
          <IconButton size="small" onClick={() => onCancel(job.id)}>
            <CancelIcon />
          </IconButton>
        )}
      </Box>
    );
  }

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center" gap={2}>
            {getStatusIcon()}
            <Box>
              <Typography variant="h6" component="div">
                {job.templateId}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Formato: {job.format}
              </Typography>
            </Box>
          </Box>
          
          <Box display="flex" alignItems="center" gap={1}>
            <Chip
              label={getStatusText()}
              color={getStatusColor() as any}
              size="medium"
            />
            
            {/* Action buttons */}
            {canCancel && onCancel && (
              <Tooltip title="Cancelar exportación">
                <IconButton 
                  color="error" 
                  onClick={() => onCancel(job.id)}
                  size="small"
                >
                  <CancelIcon />
                </IconButton>
              </Tooltip>
            )}
            
            {canRetry && onRetry && (
              <Tooltip title="Reintentar exportación">
                <IconButton 
                  color="primary" 
                  onClick={() => onRetry(job.id)}
                  size="small"
                >
                  <RetryIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        {/* Progress bar for processing jobs */}
        {job.status === 'PROCESSING' && (
          <Box mb={2}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="body2" color="text.secondary">
                Progreso
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="body2" color="text.secondary">
                  {job.progress}%
                </Typography>
                {estimatedTimeRemaining && (
                  <Typography variant="caption" color="text.secondary">
                    (~{formatTimeRemaining(estimatedTimeRemaining)} restante)
                  </Typography>
                )}
              </Box>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={job.progress} 
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
        )}

        {/* Error message */}
        {job.status === 'FAILED' && job.errorMessage && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="body2">
              {job.errorMessage}
            </Typography>
          </Alert>
        )}

        {/* Download buttons for completed jobs */}
        {canDownload && (
          <Box mb={2}>
            <Typography variant="body2" color="text.secondary" mb={1}>
              Archivos disponibles:
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap">
              {job.files!.map((file) => (
                <Button
                  key={file.id}
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={() => onDownload?.(job.id, file.id, file.fileName)}
                  size="small"
                >
                  {file.fileName} ({formatFileSize(file.fileSize)})
                </Button>
              ))}
            </Box>
          </Box>
        )}

        {/* Details */}
        {showDetails && (
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">
              Creado: {new Date(job.createdAt).toLocaleString()}
            </Typography>
            {job.startedAt && (
              <Typography variant="caption" color="text.secondary" display="block">
                Iniciado: {new Date(job.startedAt).toLocaleString()}
              </Typography>
            )}
            {job.completedAt && (
              <Typography variant="caption" color="text.secondary" display="block">
                Completado: {new Date(job.completedAt).toLocaleString()}
              </Typography>
            )}
            {job.files && job.files.length > 0 && (
              <Typography variant="caption" color="text.secondary" display="block">
                Descargas: {job.files.reduce((total, file) => total + file.downloadCount, 0)}
              </Typography>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ExportProgress;