import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Button,
  Tooltip,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Divider
} from '@mui/material';
import {
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Info as InfoIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Schedule as PendingIcon,
  Autorenew as ProcessingIcon
} from '@mui/icons-material';
import api from '../../services/api';
import { isSuccessfulApiResponse, extractErrorMessage } from '../../utils/typeGuards';
import { ReportHistoryResponse } from '../../types/api';
import { toastService } from '../../services/toastNotificationService';

interface ExportJob {
  id: string;
  format: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  fileName?: string;
  fileSize?: number;
  error?: string;
  createdAt: string;
  completedAt?: string;
  expiresAt: string;
  downloadCount: number;
  files?: Array<{
    id: string;
    fileName: string;
    fileSize: number;
  }>;
}

interface ExportStats {
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  pendingJobs: number;
  totalDownloads: number;
  byFormat: Record<string, number>;
}

export const ReportsHistory: React.FC = () => {
  const [jobs, setJobs] = useState<ExportJob[]>([]);
  const [stats, setStats] = useState<ExportStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<ExportJob | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadHistory();
    loadStats();
    
    // Actualizar cada 30 segundos para trabajos en progreso
    const interval = setInterval(() => {
      const hasActiveJobs = jobs.some(job => 
        job.status === 'pending' || job.status === 'processing'
      );
      if (hasActiveJobs) {
        loadHistory();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [jobs]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/reports/exports/history?limit=50');
      if (isSuccessfulApiResponse(response.data)) {
        setJobs((response.data as any).data);
      }
    } catch (error: unknown) {
      console.error('Error cargando historial:', error);
      toastService.error('Error cargando historial de exportaciones');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get('/api/reports/stats');
      if (isSuccessfulApiResponse(response.data)) {
        setStats((response.data as any).data);
      }
    } catch (error: unknown) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  const handleDownload = async (jobId: string, fileId?: string) => {
    try {
      // If no fileId provided, get the first file from the job
      if (!fileId) {
        const job = jobs.find(j => j.id === jobId);
        if (!job || !job.files || job.files.length === 0) {
          setError('No hay archivos disponibles para descargar');
          return;
        }
        fileId = job.files[0].id;
      }

      const response = await api.get(`/reports/jobs/${jobId}/files/${fileId}/download`, {
        responseType: 'blob'
      });
      
      // Crear URL para descarga
      const url = window.URL.createObjectURL(new Blob([response.data as any]));
      const link = document.createElement('a');
      link.href = url;
      
      // Obtener nombre del archivo del header
      const contentDisposition = response.headers['content-disposition'];
      let fileName = 'reporte.pdf';
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
        if (fileNameMatch) {
          fileName = fileNameMatch[1];
        }
      }
      
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      // Actualizar historial para reflejar el nuevo contador de descargas
      loadHistory();
      
      // Show success notification
      toastService.success(`Archivo descargado exitosamente: ${fileName}`);
    } catch (error: any) {
      console.error('Error descargando archivo:', error);
      toastService.error('Error descargando archivo. El archivo puede haber expirado.');
    }
  };

  const handleCleanup = async () => {
    try {
      await api.post('/api/reports/cleanup');
      loadHistory();
      loadStats();
      toastService.success('Archivos expirados limpiados exitosamente');
    } catch (error: any) {
      console.error('Error limpiando archivos:', error);
      toastService.error('Error limpiando archivos expirados');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckIcon color="success" />;
      case 'failed':
        return <ErrorIcon color="error" />;
      case 'processing':
        return <ProcessingIcon color="primary" />;
      case 'pending':
        return <PendingIcon color="warning" />;
      default:
        return <InfoIcon />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      case 'processing':
        return 'primary';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completado';
      case 'failed':
        return 'Fallido';
      case 'processing':
        return 'Procesando';
      case 'pending':
        return 'Pendiente';
      default:
        return status;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const isExpired = (expiresAt: string) => {
    return new Date() > new Date(expiresAt);
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Estadísticas */}
      {stats && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Estadísticas de Exportación
            </Typography>
            
            <Grid container spacing={3}>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Box textAlign="center">
                  <Typography variant="h4" color="primary">
                    {stats.totalJobs}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total de Trabajos
                  </Typography>
                </Box>
              </Grid>
              
              <Grid size={{ xs: 6, sm: 3 }}>
                <Box textAlign="center">
                  <Typography variant="h4" color="success.main">
                    {stats.completedJobs}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Completados
                  </Typography>
                </Box>
              </Grid>
              
              <Grid size={{ xs: 6, sm: 3 }}>
                <Box textAlign="center">
                  <Typography variant="h4" color="warning.main">
                    {stats.pendingJobs}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    En Proceso
                  </Typography>
                </Box>
              </Grid>
              
              <Grid size={{ xs: 6, sm: 3 }}>
                <Box textAlign="center">
                  <Typography variant="h4" color="info.main">
                    {stats.totalDownloads}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Descargas
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Por Formato:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {Object.entries(stats.byFormat).map(([format, count]) => (
                  <Chip
                    key={format}
                    label={`${format.toUpperCase()}: ${count}`}
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Tabla de historial */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Historial de Exportaciones
            </Typography>
            <Box>
              <Button
                startIcon={<DeleteIcon />}
                onClick={handleCleanup}
                size="small"
                sx={{ mr: 1 }}
              >
                Limpiar Expirados
              </Button>
              <IconButton onClick={loadHistory} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </Box>
          </Box>

          {loading && <LinearProgress sx={{ mb: 2 }} />}

          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Estado</TableCell>
                  <TableCell>Formato</TableCell>
                  <TableCell>Archivo</TableCell>
                  <TableCell>Tamaño</TableCell>
                  <TableCell>Creado</TableCell>
                  <TableCell>Expira</TableCell>
                  <TableCell>Descargas</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {jobs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography color="text.secondary">
                        No hay exportaciones en el historial
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  jobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getStatusIcon(job.status)}
                          <Chip
                            label={getStatusLabel(job.status)}
                            size="small"
                            color={getStatusColor(job.status) as any}
                            variant="outlined"
                          />
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Chip
                          label={job.format.toUpperCase()}
                          size="small"
                          variant="filled"
                        />
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2">
                          {job.fileName || 'N/A'}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2">
                          {formatFileSize(job.fileSize)}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(job.createdAt).toLocaleString()}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Typography 
                          variant="body2"
                          color={isExpired(job.expiresAt) ? 'error' : 'text.secondary'}
                        >
                          {new Date(job.expiresAt).toLocaleString()}
                          {isExpired(job.expiresAt) && (
                            <Chip label="Expirado" size="small" color="error" sx={{ ml: 1 }} />
                          )}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2">
                          {job.downloadCount}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Ver detalles">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedJob(job);
                                setShowDetails(true);
                              }}
                            >
                              <InfoIcon />
                            </IconButton>
                          </Tooltip>
                          
                          {job.status === 'completed' && !isExpired(job.expiresAt) && (
                            <Tooltip title="Descargar">
                              <IconButton
                                size="small"
                                onClick={() => handleDownload(job.id)}
                                color="primary"
                              >
                                <DownloadIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Dialog de detalles */}
      <Dialog
        open={showDetails}
        onClose={() => setShowDetails(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Detalles de Exportación
        </DialogTitle>
        
        <DialogContent>
          {selectedJob && (
            <Box>
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="subtitle2">ID:</Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {selectedJob.id}
                  </Typography>
                </Grid>
                
                <Grid size={{ xs: 6 }}>
                  <Typography variant="subtitle2">Estado:</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getStatusIcon(selectedJob.status)}
                    <Typography variant="body2">
                      {getStatusLabel(selectedJob.status)}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid size={{ xs: 6 }}>
                  <Typography variant="subtitle2">Formato:</Typography>
                  <Typography variant="body2">
                    {selectedJob.format.toUpperCase()}
                  </Typography>
                </Grid>
                
                <Grid size={{ xs: 6 }}>
                  <Typography variant="subtitle2">Archivo:</Typography>
                  <Typography variant="body2">
                    {selectedJob.fileName || 'N/A'}
                  </Typography>
                </Grid>
                
                <Grid size={{ xs: 6 }}>
                  <Typography variant="subtitle2">Tamaño:</Typography>
                  <Typography variant="body2">
                    {formatFileSize(selectedJob.fileSize)}
                  </Typography>
                </Grid>
                
                <Grid size={{ xs: 6 }}>
                  <Typography variant="subtitle2">Descargas:</Typography>
                  <Typography variant="body2">
                    {selectedJob.downloadCount}
                  </Typography>
                </Grid>
                
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2">Creado:</Typography>
                  <Typography variant="body2">
                    {new Date(selectedJob.createdAt).toLocaleString()}
                  </Typography>
                </Grid>
                
                {selectedJob.completedAt && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2">Completado:</Typography>
                    <Typography variant="body2">
                      {new Date(selectedJob.completedAt).toLocaleString()}
                    </Typography>
                  </Grid>
                )}
                
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2">Expira:</Typography>
                  <Typography 
                    variant="body2"
                    color={isExpired(selectedJob.expiresAt) ? 'error' : 'text.primary'}
                  >
                    {new Date(selectedJob.expiresAt).toLocaleString()}
                    {isExpired(selectedJob.expiresAt) && ' (Expirado)'}
                  </Typography>
                </Grid>
                
                {selectedJob.error && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" color="error">Error:</Typography>
                    <Typography variant="body2" color="error">
                      {selectedJob.error}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setShowDetails(false)}>
            Cerrar
          </Button>
          {selectedJob?.status === 'completed' && !isExpired(selectedJob.expiresAt) && (
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={() => {
                handleDownload(selectedJob.id);
                setShowDetails(false);
              }}
            >
              Descargar
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};