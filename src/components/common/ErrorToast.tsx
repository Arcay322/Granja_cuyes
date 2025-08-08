import React from 'react';
import {
  Snackbar,
  Alert,
  AlertTitle,
  Box,
  Button,
  IconButton,
  Collapse,
  Typography,
  Chip
} from '@mui/material';
import {
  Close as CloseIcon,
  Refresh as RetryIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  BugReport as ReportIcon
} from '@mui/icons-material';
import { ErrorInfo } from './ErrorDisplay';

export interface ErrorToastProps {
  open: boolean;
  error: ErrorInfo | null;
  onClose: () => void;
  onRetry?: () => void;
  onReport?: (error: ErrorInfo) => void;
  autoHideDuration?: number;
  showRetryButton?: boolean;
  showReportButton?: boolean;
  allowExpand?: boolean;
}

const ErrorToast: React.FC<ErrorToastProps> = ({
  open,
  error,
  onClose,
  onRetry,
  onReport,
  autoHideDuration = 6000,
  showRetryButton = true,
  showReportButton = true,
  allowExpand = true
}) => {
  const [expanded, setExpanded] = React.useState(false);

  if (!error) return null;

  const getSeverity = (type: ErrorInfo['type']) => {
    switch (type) {
      case 'validation':
        return 'warning';
      case 'network':
      case 'timeout':
      case 'server':
      case 'storage':
        return 'error';
      case 'permission':
        return 'info';
      default:
        return 'error';
    }
  };

  const getAutoHideDuration = () => {
    // Don't auto-hide critical errors
    if (error.type === 'server' || error.type === 'storage') {
      return null;
    }
    return autoHideDuration;
  };

  const canRetry = error.retryable && showRetryButton && onRetry && 
    (!error.maxRetries || (error.retryCount || 0) < error.maxRetries);

  return (
    <Snackbar
      open={open}
      autoHideDuration={getAutoHideDuration()}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      sx={{ maxWidth: 500 }}
    >
      <Alert
        severity={getSeverity(error.type)}
        onClose={onClose}
        sx={{ width: '100%', alignItems: 'flex-start' }}
        action={
          <Box display="flex" alignItems="center" gap={1}>
            {allowExpand && error.details && (
              <IconButton
                size="small"
                onClick={() => setExpanded(!expanded)}
                color="inherit"
              >
                {expanded ? <CollapseIcon /> : <ExpandIcon />}
              </IconButton>
            )}
            <IconButton size="small" onClick={onClose} color="inherit">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        }
      >
        <AlertTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="subtitle2">
              {getErrorTitle(error.type)}
            </Typography>
            <Box display="flex" alignItems="center" gap={0.5}>
              {error.code && (
                <Chip 
                  label={error.code} 
                  size="small" 
                  variant="outlined"
                  color={getSeverity(error.type)}
                  sx={{ fontSize: '0.7rem', height: 20 }}
                />
              )}
              {error.retryCount && error.retryCount > 0 && (
                <Chip 
                  label={`${error.retryCount}/${error.maxRetries || 3}`}
                  size="small"
                  color="default"
                  sx={{ fontSize: '0.7rem', height: 20 }}
                />
              )}
            </Box>
          </Box>
        </AlertTitle>

        <Typography variant="body2" sx={{ mb: 1 }}>
          {error.message}
        </Typography>

        {/* Action Buttons */}
        <Box display="flex" gap={1} sx={{ mt: 1 }}>
          {canRetry && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<RetryIcon />}
              onClick={onRetry}
              color={getSeverity(error.type)}
            >
              Reintentar
            </Button>
          )}
          {showReportButton && onReport && (
            <Button
              size="small"
              variant="text"
              startIcon={<ReportIcon />}
              onClick={() => onReport(error)}
              color="inherit"
            >
              Reportar
            </Button>
          )}
        </Box>

        {/* Expandable Details */}
        {allowExpand && error.details && (
          <Collapse in={expanded} sx={{ mt: 2 }}>
            <Box sx={{ 
              p: 1, 
              bgcolor: 'rgba(0,0,0,0.05)', 
              borderRadius: 1,
              border: '1px solid rgba(0,0,0,0.1)'
            }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                Detalles técnicos:
              </Typography>
              <Typography variant="body2" component="pre" sx={{ 
                fontFamily: 'monospace', 
                fontSize: '0.7rem',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                maxHeight: 150,
                overflow: 'auto'
              }}>
                {error.details}
              </Typography>
              
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {error.timestamp.toLocaleString()}
              </Typography>
            </Box>
          </Collapse>
        )}
      </Alert>
    </Snackbar>
  );
};

const getErrorTitle = (type: ErrorInfo['type']) => {
  switch (type) {
    case 'validation':
      return 'Error de Validación';
    case 'network':
      return 'Error de Conexión';
    case 'server':
      return 'Error del Servidor';
    case 'timeout':
      return 'Tiempo Agotado';
    case 'permission':
      return 'Sin Permisos';
    case 'storage':
      return 'Error de Almacenamiento';
    default:
      return 'Error';
  }
};

export default ErrorToast;