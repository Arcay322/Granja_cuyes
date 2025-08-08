import React from 'react';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Collapse,
  IconButton,
  Typography,
  Chip,
  Stack
} from '@mui/material';
import {
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Refresh as RetryIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  BugReport as ReportIcon
} from '@mui/icons-material';

export interface ErrorInfo {
  type: 'validation' | 'network' | 'server' | 'timeout' | 'permission' | 'storage' | 'unknown';
  code?: string;
  message: string;
  details?: string;
  timestamp: Date;
  retryable: boolean;
  retryCount?: number;
  maxRetries?: number;
  context?: Record<string, any>;
}

export interface ErrorDisplayProps {
  error: ErrorInfo;
  onRetry?: () => void;
  onReport?: (error: ErrorInfo) => void;
  onDismiss?: () => void;
  showDetails?: boolean;
  compact?: boolean;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onRetry,
  onReport,
  onDismiss,
  showDetails = false,
  compact = false
}) => {
  const [expanded, setExpanded] = React.useState(showDetails);

  const getErrorSeverity = (type: ErrorInfo['type']) => {
    switch (type) {
      case 'validation':
        return 'warning';
      case 'network':
      case 'timeout':
        return 'error';
      case 'server':
      case 'storage':
        return 'error';
      case 'permission':
        return 'warning';
      default:
        return 'error';
    }
  };

  const getErrorIcon = (type: ErrorInfo['type']) => {
    switch (type) {
      case 'validation':
        return <WarningIcon />;
      case 'network':
      case 'timeout':
      case 'server':
      case 'storage':
        return <ErrorIcon />;
      case 'permission':
        return <InfoIcon />;
      default:
        return <ErrorIcon />;
    }
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
        return 'Tiempo de Espera Agotado';
      case 'permission':
        return 'Permisos Insuficientes';
      case 'storage':
        return 'Error de Almacenamiento';
      default:
        return 'Error Desconocido';
    }
  };

  const getRecoveryActions = (type: ErrorInfo['type']) => {
    switch (type) {
      case 'network':
        return [
          'Verifica tu conexión a internet',
          'Intenta recargar la página',
          'Contacta al administrador si el problema persiste'
        ];
      case 'timeout':
        return [
          'La operación tardó más de lo esperado',
          'Intenta nuevamente con menos datos',
          'Verifica la estabilidad de tu conexión'
        ];
      case 'server':
        return [
          'El servidor está experimentando problemas',
          'Intenta nuevamente en unos minutos',
          'Contacta al soporte técnico si persiste'
        ];
      case 'validation':
        return [
          'Revisa los datos ingresados',
          'Asegúrate de completar todos los campos requeridos',
          'Verifica el formato de fechas y números'
        ];
      case 'permission':
        return [
          'No tienes permisos para realizar esta acción',
          'Contacta al administrador para obtener acceso',
          'Verifica que hayas iniciado sesión correctamente'
        ];
      case 'storage':
        return [
          'Error al guardar o acceder archivos',
          'Verifica el espacio disponible',
          'Intenta con un archivo más pequeño'
        ];
      default:
        return [
          'Ha ocurrido un error inesperado',
          'Intenta recargar la página',
          'Contacta al soporte técnico'
        ];
    }
  };

  const canRetry = error.retryable && (!error.maxRetries || (error.retryCount || 0) < error.maxRetries);

  if (compact) {
    return (
      <Alert 
        severity={getErrorSeverity(error.type)}
        action={
          <Stack direction="row" spacing={1}>
            {canRetry && onRetry && (
              <IconButton size="small" onClick={onRetry} color="inherit">
                <RetryIcon fontSize="small" />
              </IconButton>
            )}
            {onDismiss && (
              <IconButton size="small" onClick={onDismiss} color="inherit">
                ×
              </IconButton>
            )}
          </Stack>
        }
      >
        {error.message}
      </Alert>
    );
  }

  return (
    <Alert 
      severity={getErrorSeverity(error.type)}
      icon={getErrorIcon(error.type)}
      onClose={onDismiss}
    >
      <AlertTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">
            {getErrorTitle(error.type)}
          </Typography>
          <Box display="flex" alignItems="center" gap={1}>
            {error.code && (
              <Chip 
                label={error.code} 
                size="small" 
                variant="outlined"
                color={getErrorSeverity(error.type)}
              />
            )}
            {error.retryCount && error.retryCount > 0 && (
              <Chip 
                label={`Intento ${error.retryCount}/${error.maxRetries || 3}`}
                size="small"
                color="default"
              />
            )}
          </Box>
        </Box>
      </AlertTitle>

      <Typography variant="body2" sx={{ mb: 2 }}>
        {error.message}
      </Typography>

      {/* Recovery Actions */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
          Acciones recomendadas:
        </Typography>
        <Box component="ul" sx={{ pl: 2, m: 0 }}>
          {getRecoveryActions(error.type).map((action, index) => (
            <Typography key={index} component="li" variant="body2" sx={{ mb: 0.5 }}>
              {action}
            </Typography>
          ))}
        </Box>
      </Box>

      {/* Action Buttons */}
      <Stack direction="row" spacing={2} sx={{ mb: error.details ? 1 : 0 }}>
        {canRetry && onRetry && (
          <Button
            variant="contained"
            size="small"
            startIcon={<RetryIcon />}
            onClick={onRetry}
            color={getErrorSeverity(error.type)}
          >
            Reintentar
          </Button>
        )}
        {onReport && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<ReportIcon />}
            onClick={() => onReport(error)}
          >
            Reportar Error
          </Button>
        )}
      </Stack>

      {/* Expandable Details */}
      {error.details && (
        <>
          <Box display="flex" alignItems="center" sx={{ mt: 1 }}>
            <IconButton
              size="small"
              onClick={() => setExpanded(!expanded)}
              sx={{ mr: 1 }}
            >
              {expanded ? <CollapseIcon /> : <ExpandIcon />}
            </IconButton>
            <Typography variant="body2" color="text.secondary">
              {expanded ? 'Ocultar detalles' : 'Ver detalles técnicos'}
            </Typography>
          </Box>
          
          <Collapse in={expanded}>
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                Detalles técnicos:
              </Typography>
              <Typography variant="body2" component="pre" sx={{ 
                fontFamily: 'monospace', 
                fontSize: '0.75rem',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {error.details}
              </Typography>
              
              {error.context && (
                <>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 2, mb: 1, display: 'block' }}>
                    Contexto:
                  </Typography>
                  <Typography variant="body2" component="pre" sx={{ 
                    fontFamily: 'monospace', 
                    fontSize: '0.75rem',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {JSON.stringify(error.context, null, 2)}
                  </Typography>
                </>
              )}
              
              <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                Timestamp: {error.timestamp.toLocaleString()}
              </Typography>
            </Box>
          </Collapse>
        </>
      )}
    </Alert>
  );
};

export default ErrorDisplay;