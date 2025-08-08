import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Alert, Card, CardContent } from '@mui/material';
import { ErrorOutline, Refresh } from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
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
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error capturado por ErrorBoundary:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Llamar callback personalizado si existe
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log estructurado del error
    this.logError(error, errorInfo);
  }

  private logError = (error: Error, errorInfo: ErrorInfo) => {
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    console.error('Error estructurado:', errorData);

    // Aquí podrías enviar el error a un servicio de logging
    // como Sentry, LogRocket, etc.
  };

  private resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
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

      // Fallback por defecto
      return (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '200px',
            p: 3
          }}
        >
          <Card sx={{ maxWidth: 500, width: '100%' }}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <ErrorOutline 
                sx={{ 
                  fontSize: 48, 
                  color: 'error.main', 
                  mb: 2 
                }} 
              />
              
              <Typography variant="h6" gutterBottom color="error">
                ¡Oops! Algo salió mal
              </Typography>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Ha ocurrido un error inesperado. Por favor, intenta recargar la página o contacta al soporte técnico si el problema persiste.
              </Typography>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <Alert severity="error" sx={{ mb: 2, textAlign: 'left' }}>
                  <Typography variant="body2" component="pre" sx={{ fontSize: '0.75rem' }}>
                    {this.state.error.message}
                  </Typography>
                </Alert>
              )}

              <Button
                variant="contained"
                startIcon={<Refresh />}
                onClick={this.resetError}
                sx={{ mr: 1 }}
              >
                Intentar de nuevo
              </Button>

              <Button
                variant="outlined"
                onClick={() => window.location.reload()}
              >
                Recargar página
              </Button>
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