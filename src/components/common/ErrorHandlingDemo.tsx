import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  Divider,
  Stack,
  Alert,
  Switch,
  FormControlLabel,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Error as ErrorIcon,
  Warning as WarningIcon,
  NetworkCheck as NetworkIcon,
  Storage as StorageIcon,
  Security as SecurityIcon,
  Timer as TimerIcon
} from '@mui/icons-material';
import ErrorDisplay, { ErrorInfo } from './ErrorDisplay';
import ErrorToast from './ErrorToast';
import ErrorBoundary from './ErrorBoundary';
import { useErrorHandling, useApiErrorHandling } from '../../hooks/useErrorHandling';
import ErrorHandlingService from '../../services/errorHandlingService';

const ErrorHandlingDemo: React.FC = () => {
  const [selectedErrorType, setSelectedErrorType] = useState<ErrorInfo['type']>('network');
  const [showToast, setShowToast] = useState(false);
  const [showDisplay, setShowDisplay] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [includeDetails, setIncludeDetails] = useState(true);
  const [makeRetryable, setMakeRetryable] = useState(true);
  const [triggerBoundary, setTriggerBoundary] = useState(false);

  const errorHandling = useErrorHandling();
  const apiErrorHandling = useApiErrorHandling();

  // Component that throws error for boundary testing
  const ErrorThrowingComponent: React.FC = () => {
    if (triggerBoundary) {
      throw new Error('Test error for ErrorBoundary demonstration');
    }
    return <Typography>This component is working normally</Typography>;
  };

  const createSampleError = (): ErrorInfo => {
    const baseErrors: Record<ErrorInfo['type'], Partial<ErrorInfo>> = {
      network: {
        code: 'NETWORK_ERROR',
        message: customMessage || 'Failed to connect to server',
        details: includeDetails ? 'Connection timeout after 5000ms\nServer: api.example.com\nPort: 443' : undefined
      },
      server: {
        code: 'INTERNAL_SERVER_ERROR',
        message: customMessage || 'Internal server error occurred',
        details: includeDetails ? 'Error: Database connection failed\nStack trace: at DatabaseService.connect()' : undefined
      },
      validation: {
        code: 'VALIDATION_ERROR',
        message: customMessage || 'Invalid input data provided',
        details: includeDetails ? 'Field "email" is required\nField "age" must be a number' : undefined
      },
      timeout: {
        code: 'TIMEOUT_ERROR',
        message: customMessage || 'Operation timed out',
        details: includeDetails ? 'Request exceeded 30 second timeout\nOperation: data export' : undefined
      },
      permission: {
        code: 'PERMISSION_DENIED',
        message: customMessage || 'Access denied to this resource',
        details: includeDetails ? 'User role: viewer\nRequired role: admin\nResource: /admin/users' : undefined
      },
      storage: {
        code: 'STORAGE_ERROR',
        message: customMessage || 'Failed to save file',
        details: includeDetails ? 'Disk space: 95% full\nFile size: 150MB\nAvailable: 50MB' : undefined
      },
      unknown: {
        code: 'UNKNOWN_ERROR',
        message: customMessage || 'An unexpected error occurred',
        details: includeDetails ? 'Error type: UnhandledException\nSource: unknown' : undefined
      }
    };

    return {
      type: selectedErrorType,
      message: baseErrors[selectedErrorType].message!,
      code: baseErrors[selectedErrorType].code,
      details: baseErrors[selectedErrorType].details,
      timestamp: new Date(),
      retryable: makeRetryable,
      retryCount: Math.floor(Math.random() * 3),
      maxRetries: 3,
      context: {
        demoMode: true,
        errorType: selectedErrorType,
        timestamp: Date.now()
      }
    };
  };

  const handleShowDisplay = () => {
    setShowDisplay(true);
  };

  const handleShowToast = () => {
    setShowToast(true);
  };

  const handleTriggerBoundary = () => {
    setTriggerBoundary(true);
  };

  const handleTestRetry = async () => {
    let attemptCount = 0;
    const maxAttempts = 3;

    const mockApiCall = async () => {
      attemptCount++;
      if (attemptCount < maxAttempts) {
        throw new Error(`API call failed (attempt ${attemptCount})`);
      }
      return `Success after ${attemptCount} attempts`;
    };

    try {
      const result = await apiErrorHandling.executeApiCall(mockApiCall, {
        operation: 'demo_retry_test'
      });
      alert(`Retry test completed: ${result}`);
    } catch (error) {
      console.error('Retry test failed:', error);
    }
  };

  const handleTestErrorService = async () => {
    const sampleError = createSampleError();
    
    // Log the error
    ErrorHandlingService.logError(sampleError);
    
    // Report the error
    await ErrorHandlingService.reportError(sampleError, {
      demoTest: true,
      userAction: 'test_error_service'
    });
    
    // Show stats
    const stats = ErrorHandlingService.getErrorStats();
    alert(`Error logged and reported!\nTotal errors: ${stats.totalErrors}\nError types: ${Object.keys(stats.errorsByType).join(', ')}`);
  };

  const currentError = showDisplay ? createSampleError() : null;
  const toastError = showToast ? createSampleError() : null;

  const errorTypeIcons: Record<ErrorInfo['type'], React.ReactNode> = {
    network: <NetworkIcon />,
    server: <ErrorIcon />,
    validation: <WarningIcon />,
    timeout: <TimerIcon />,
    permission: <SecurityIcon />,
    storage: <StorageIcon />,
    unknown: <ErrorIcon />
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Error Handling System Demo
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Esta demostración muestra todas las funcionalidades del sistema de manejo de errores comprehensivo.
      </Typography>

      <Grid container spacing={3}>
        {/* Configuration Panel */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Configuración de Error
              </Typography>
              
              <Stack spacing={2}>
                <FormControl fullWidth>
                  <InputLabel>Tipo de Error</InputLabel>
                  <Select
                    value={selectedErrorType}
                    label="Tipo de Error"
                    onChange={(e) => setSelectedErrorType(e.target.value as ErrorInfo['type'])}
                  >
                    <MenuItem value="network">
                      <Box display="flex" alignItems="center" gap={1}>
                        <NetworkIcon fontSize="small" />
                        Red/Conexión
                      </Box>
                    </MenuItem>
                    <MenuItem value="server">
                      <Box display="flex" alignItems="center" gap={1}>
                        <ErrorIcon fontSize="small" />
                        Servidor
                      </Box>
                    </MenuItem>
                    <MenuItem value="validation">
                      <Box display="flex" alignItems="center" gap={1}>
                        <WarningIcon fontSize="small" />
                        Validación
                      </Box>
                    </MenuItem>
                    <MenuItem value="timeout">
                      <Box display="flex" alignItems="center" gap={1}>
                        <TimerIcon fontSize="small" />
                        Timeout
                      </Box>
                    </MenuItem>
                    <MenuItem value="permission">
                      <Box display="flex" alignItems="center" gap={1}>
                        <SecurityIcon fontSize="small" />
                        Permisos
                      </Box>
                    </MenuItem>
                    <MenuItem value="storage">
                      <Box display="flex" alignItems="center" gap={1}>
                        <StorageIcon fontSize="small" />
                        Almacenamiento
                      </Box>
                    </MenuItem>
                    <MenuItem value="unknown">
                      <Box display="flex" alignItems="center" gap={1}>
                        <ErrorIcon fontSize="small" />
                        Desconocido
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  label="Mensaje Personalizado"
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Dejar vacío para mensaje por defecto"
                  multiline
                  rows={2}
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={includeDetails}
                      onChange={(e) => setIncludeDetails(e.target.checked)}
                    />
                  }
                  label="Incluir detalles técnicos"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={makeRetryable}
                      onChange={(e) => setMakeRetryable(e.target.checked)}
                    />
                  }
                  label="Error reintentable"
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Demo Actions */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Componentes de Error
              </Typography>
              
              <Stack spacing={2}>
                <Button
                  variant="contained"
                  onClick={handleShowDisplay}
                  startIcon={errorTypeIcons[selectedErrorType]}
                >
                  Mostrar ErrorDisplay
                </Button>

                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleShowToast}
                  startIcon={errorTypeIcons[selectedErrorType]}
                >
                  Mostrar ErrorToast
                </Button>

                <Button
                  variant="contained"
                  color="warning"
                  onClick={handleTriggerBoundary}
                  startIcon={<ErrorIcon />}
                >
                  Activar ErrorBoundary
                </Button>

                <Divider />

                <Typography variant="h6" gutterBottom>
                  Funcionalidades del Sistema
                </Typography>

                <Button
                  variant="outlined"
                  onClick={handleTestRetry}
                  startIcon={<NetworkIcon />}
                >
                  Probar Sistema de Reintentos
                </Button>

                <Button
                  variant="outlined"
                  onClick={handleTestErrorService}
                  startIcon={<StorageIcon />}
                >
                  Probar Logging y Reporte
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Error Display Demo */}
        {showDisplay && (
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Typography variant="h6">
                    ErrorDisplay Component
                  </Typography>
                  <Button size="small" onClick={() => setShowDisplay(false)}>
                    Cerrar
                  </Button>
                </Box>
                
                <ErrorDisplay
                  error={currentError!}
                  onRetry={() => alert('Retry clicked!')}
                  onReport={(error) => alert(`Report clicked for: ${error.message}`)}
                  onDismiss={() => setShowDisplay(false)}
                />
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* ErrorBoundary Demo */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                ErrorBoundary Component
              </Typography>
              
              <ErrorBoundary>
                <Box sx={{ p: 2, border: '1px dashed', borderColor: 'grey.300', borderRadius: 1 }}>
                  <ErrorThrowingComponent />
                </Box>
              </ErrorBoundary>
              
              {triggerBoundary && (
                <Button
                  size="small"
                  onClick={() => setTriggerBoundary(false)}
                  sx={{ mt: 2 }}
                >
                  Reset Component
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Error Statistics */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Estadísticas de Errores
              </Typography>
              
              <Alert severity="info">
                <Typography variant="body2">
                  Las estadísticas se actualizan en tiempo real cuando se reportan errores.
                  Abre la consola del navegador para ver los logs detallados.
                </Typography>
              </Alert>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Toast Component */}
      <ErrorToast
        open={showToast}
        error={toastError}
        onClose={() => setShowToast(false)}
        onRetry={() => alert('Toast retry clicked!')}
        onReport={(error) => alert(`Toast report clicked for: ${error.message}`)}
      />
    </Box>
  );
};

export default ErrorHandlingDemo;