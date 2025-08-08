import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Alert, Card, CardContent, Chip, Stack } from '@mui/material';
import { ErrorOutline, Refresh, BugReport, Home } from '@mui/icons-material';
import ErrorHandlingService from '../../services/errorHandlingService';
import { ErrorInfo as CustomErrorInfo } from './ErrorDisplay';

interface Props {
  children: ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

export interface ErrorFallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  resetError: () => void;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const errorId = `boundary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    
    // Create structured error info using our error handling service
    const customErrorInfo: CustomErrorInfo = {
      type: 'unknown',
      code: 'REACT_ERROR_BOUNDARY',
      message: error.message,
      details: JSON.stringify({
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        errorBoundary: true
      }, null, 2),
      timestamp: new Date(),
      retryable: true,
      context: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        errorId: this.state.errorId
      }
    };

    // Log error using our error handling service
    ErrorHandlingService.logError(customErrorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report error automatically
    ErrorHandlingService.reportError(customErrorInfo, {
      boundaryLocation: 'ErrorBoundary',
      componentStack: errorInfo.componentStack
    });
  }

  private resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  private handleReportError = async () => {
    const { error, errorInfo, errorId } = this.state;
    if (error && errorInfo) {
      const customErrorInfo: CustomErrorInfo = {
        type: 'unknown',
        code: 'REACT_ERROR_BOUNDARY_MANUAL_REPORT',
        message: error.message,
        details: JSON.stringify({
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          errorBoundary: true,
          manualReport: true
        }, null, 2),
        timestamp: new Date(),
        retryable: true,
        context: {
          url: window.location.href,
          userAgent: navigator.userAgent,
          errorId
        }
      };

      try {
        await ErrorHandlingService.reportError(customErrorInfo, {
          userInitiated: true,
          boundaryLocation: 'ErrorBoundary'
        });
        
        alert('Error reportado exitosamente. Nuestro equipo técnico lo revisará pronto.');
      } catch (reportError) {
        console.error('Failed to report error:', reportError);
        
        // Fallback: copy to clipboard
        const errorReport = {
          id: errorId,
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
          url: window.location.href,
        };
        
        try {
          await navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2));
          alert('No se pudo enviar el reporte automáticamente. Los detalles del error se copiaron al portapapeles.');
        } catch (clipboardError) {
          alert('Error al reportar. Por favor, recarga la página e intenta nuevamente.');
        }
      }
    }
  };

  render() {
    if (this.state.hasError) {
      // Si hay un componente fallback personalizado, usarlo
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error}
            errorInfo={this.state.errorInfo}
            resetError={this.resetError}
          />
        );
      }

      // Fallback por defecto con funcionalidades mejoradas
      return (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '400px',
            p: 3
          }}
        >
          <Card sx={{ maxWidth: 700, width: '100%' }}>
            <CardContent sx={{ p: 4 }}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                <Box display="flex" alignItems="center">
                  <ErrorOutline 
                    sx={{ 
                      fontSize: 48, 
                      color: 'error.main', 
                      mr: 2 
                    }} 
                  />
                  <Box>
                    <Typography variant="h6" gutterBottom color="error">
                      ¡Ups! Algo salió mal
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Ha ocurrido un error inesperado en esta sección
                    </Typography>
                  </Box>
                </Box>
                {this.state.errorId && (
                  <Chip 
                    label={`ID: ${this.state.errorId.split('_')[1]}`}
                    size="small"
                    variant="outlined"
                    color="error"
                  />
                )}
              </Box>

              <Typography variant="body1" sx={{ mb: 2, fontWeight: 'medium' }}>
                {this.state.error?.message || 'Error desconocido'}
              </Typography>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Este error ha sido reportado automáticamente a nuestro equipo técnico. 
                Puedes intentar las siguientes acciones:
              </Typography>

              <Box component="ul" sx={{ pl: 2, mb: 3, color: 'text.secondary' }}>
                <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                  Recargar esta sección haciendo clic en "Reintentar"
                </Typography>
                <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                  Navegar a la página principal
                </Typography>
                <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                  Reportar detalles adicionales si el problema persiste
                </Typography>
              </Box>

              <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap" sx={{ mb: 3 }}>
                <Button
                  variant="contained"
                  startIcon={<Refresh />}
                  onClick={this.resetError}
                  color="primary"
                >
                  Reintentar
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<Home />}
                  onClick={() => window.location.href = '/'}
                  color="primary"
                >
                  Ir al Inicio
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<BugReport />}
                  onClick={this.handleReportError}
                  color="secondary"
                >
                  Reportar Error
                </Button>
              </Stack>

              {/* Development Details */}
              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" gutterBottom color="warning.main">
                    🔧 Detalles de Desarrollo:
                  </Typography>
                  
                  <Typography variant="caption" display="block" sx={{ mb: 1 }}>
                    Error Stack:
                  </Typography>
                  <Alert severity="error" sx={{ mb: 2 }}>
                    <Typography variant="body2" component="pre" sx={{ 
                      fontSize: '0.75rem',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}>
                      {this.state.error?.stack}
                    </Typography>
                  </Alert>
                  
                  <Typography variant="caption" display="block" sx={{ mb: 1 }}>
                    Component Stack:
                  </Typography>
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    <Typography variant="body2" component="pre" sx={{ 
                      fontSize: '0.75rem',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}>
                      {this.state.errorInfo.componentStack}
                    </Typography>
                  </Alert>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      );
    }

    return this.props.children;
  }
}

// Hook para usar con componentes funcionales
export const useErrorHandler = () => {
  const handleError = React.useCallback((error: Error, errorInfo?: ErrorInfo) => {
    console.error('Error manejado por useErrorHandler:', error, errorInfo);
    
    // Log estructurado
    const errorData = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      ...(errorInfo && { componentStack: errorInfo.componentStack })
    };

    console.error('Error estructurado:', errorData);
  }, []);

  return { handleError };
};

// Componente de fallback específico para el módulo de reproducción
export const ReproductionErrorFallback: React.FC<ErrorFallbackProps> = ({ 
  error, 
  resetError 
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '300px',
        p: 3
      }}
    >
      <Card sx={{ maxWidth: 600, width: '100%' }}>
        <CardContent sx={{ textAlign: 'center', p: 4 }}>
          <ErrorOutline 
            sx={{ 
              fontSize: 56, 
              color: 'error.main', 
              mb: 2 
            }} 
          />
          
          <Typography variant="h5" gutterBottom color="error">
            Error en el Módulo de Reproducción
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Ha ocurrido un error al cargar los datos de reproducción. 
            Esto puede deberse a problemas de conectividad o datos inconsistentes.
          </Typography>

          <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
            <Typography variant="body2">
              <strong>Posibles soluciones:</strong>
            </Typography>
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li>Verifica tu conexión a internet</li>
              <li>Intenta recargar los datos</li>
              <li>Si el problema persiste, contacta al administrador</li>
            </ul>
          </Alert>

          {process.env.NODE_ENV === 'development' && error && (
            <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
              <Typography variant="body2" component="pre" sx={{ fontSize: '0.75rem' }}>
                {error.message}
              </Typography>
            </Alert>
          )}

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={resetError}
            >
              Reintentar
            </Button>

            <Button
              variant="outlined"
              onClick={() => window.location.href = '/'}
            >
              Ir al Dashboard
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ErrorBoundary;