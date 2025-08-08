import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Paper,
  IconButton
} from '../../utils/mui';
import {
  Assessment as ReportIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  PictureAsPdf,
  TableChart
} from '@mui/icons-material';
import api from '../../services/api';
import { isSuccessfulApiResponse, extractErrorMessage } from '../../utils/typeGuards';
import { ReportTemplatesResponse, ReportJobResponse } from '../../types/api';
import ExportProgress from './ExportProgress';
import { ReportsHistory } from './ReportsHistory';
import { toastService } from '../../services/toastNotificationService';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: 'reproductive' | 'health' | 'financial' | 'inventory' | 'general';
  sections: string[];
  parameters: string[];
  createdAt: string;
  updatedAt: string;
}

interface ExportJob {
  id: string;
  templateId: string;
  format: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progress: number;
  createdAt: string;
  completedAt?: string;
  errorMessage?: string;
  files?: Array<{
    id: string;
    fileName: string;
    fileSize: string;
    downloadCount: number;
  }>;
}

const ReportsGenerator: React.FC = () => {
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeJobs, setActiveJobs] = useState<ExportJob[]>([]);
  const [jobPollingInterval, setJobPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generatedReport, setGeneratedReport] = useState<any>(null);

  // Cargar plantillas de reportes
  const loadTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/reports/templates');
      
      if (isSuccessfulApiResponse(response.data)) {
        setTemplates((response.data as any).data || []);
      } else {
        setError('Error cargando plantillas de reportes');
      }
    } catch (error: unknown) {
      console.error('Error cargando plantillas:', error);
      setError(extractErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleGenerateReport = async (templateId: string) => {
    setGenerating(true);
    setError(null);
    
    try {
      // Use the export endpoint with PDF format for preview
      const response = await api.post(`/reports/export/${templateId}`, {
        format: 'PDF',
        parameters: {
          dateRange: {
            from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            to: new Date().toISOString()
          }
        },
        options: {
          includeCharts: true,
          includeDetails: true,
          pageSize: 'A4',
          orientation: 'portrait',
          compression: true
        }
      });
      
      if (isSuccessfulApiResponse(response.data)) {
        setGeneratedReport({
          jobId: (response.data.data as any).jobId,
          status: (response.data.data as any).status,
          templateId: (response.data.data as any).templateId,
          format: (response.data.data as any).format,
          createdAt: (response.data.data as any).createdAt
        });
        toastService.success(`Reporte generado exitosamente. Job ID: ${(response.data.data as any).jobId}`);
      } else {
        toastService.error('Error generando reporte');
      }
    } catch (error: any) {
      console.error('Error generando reporte:', error);
      setError(error.response?.data?.message || 'Error generando reporte');
    } finally {
      setGenerating(false);
    }
  };

  const handleExportReport = async (templateId: string, format: 'pdf' | 'excel' | 'csv') => {
    try {
      // Convert format to uppercase as expected by backend
      const backendFormat = format.toUpperCase() as 'PDF' | 'EXCEL' | 'CSV';
      
      const response = await api.post(`/reports/export/${templateId}`, {
        format: backendFormat,
        parameters: {
          dateRange: {
            from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            to: new Date().toISOString()
          }
        },
        options: {
          includeCharts: true,
          includeDetails: true,
          pageSize: 'A4',
          orientation: 'portrait',
          compression: true
        }
      });
      
      if (isSuccessfulApiResponse(response.data)) {
        const newJob: ExportJob = {
          id: (response.data.data as any).jobId,
          templateId: (response.data.data as any).templateId,
          format: (response.data.data as any).format,
          status: (response.data.data as any).status,
          progress: 0,
          createdAt: (response.data.data as any).createdAt
        };
        
        // Add job to active jobs list
        setActiveJobs(prev => [...prev, newJob]);
        
        // Start polling for job status
        startJobPolling(newJob.id);
        
        // Show toast notification for job start
        toastService.exportJobNotification(
          newJob.id,
          newJob.templateId,
          'started'
        );
        
        setError(null);
        console.log(`Exportación iniciada: ${newJob.id}`);
      }
    } catch (error: any) {
      console.error('Error exportando reporte:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Error exportando reporte';
      setError(errorMessage);
      
      // Show more detailed error if available
      if (error.response?.data?.details) {
        console.error('Validation errors:', error.response.data.details);
      }
    }
  };

  // Start polling for job status
  const startJobPolling = (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await api.get(`/reports/exports/${jobId}/status`);
        if (isSuccessfulApiResponse(response.data)) {
          const jobData = response.data.data;
          
          // Get current job state for comparison
          const currentJob = activeJobs.find(job => job.id === jobId);
          const previousStatus = currentJob?.status;
          const previousProgress = currentJob?.progress || 0;
          
          // Update job in active jobs list
          setActiveJobs(prev => prev.map(job => 
            job.id === jobId ? {
              ...job,
              status: (jobData as any).status,
              progress: (jobData as any).progress || 0,
              completedAt: (jobData as any).completedAt,
              errorMessage: (jobData as any).errorMessage,
              files: (jobData as any).files
            } : job
          ));
          
          // Show toast notifications for status changes
          if (previousStatus !== (jobData as any).status) {
            if ((jobData as any).status === 'COMPLETED') {
              toastService.exportJobNotification(
                jobId,
                (jobData as any).templateId || currentJob?.templateId || 'Reporte',
                'completed'
              );
            } else if ((jobData as any).status === 'FAILED') {
              toastService.exportJobNotification(
                jobId,
                (jobData as any).templateId || currentJob?.templateId || 'Reporte',
                'failed',
                undefined,
                (jobData as any).errorMessage
              );
            }
          } else if ((jobData as any).status === 'PROCESSING' && (jobData as any).progress && (jobData as any).progress !== previousProgress) {
            // Show progress updates every 25% or significant changes
            if ((jobData as any).progress % 25 === 0 || Math.abs((jobData as any).progress - previousProgress) >= 25) {
              toastService.exportJobNotification(
                jobId,
                (jobData as any).templateId || currentJob?.templateId || 'Reporte',
                'progress',
                (jobData as any).progress
              );
            }
          }
          
          // Stop polling if job is completed or failed
          if ((jobData as any).status === 'COMPLETED' || (jobData as any).status === 'FAILED') {
            clearInterval(interval);
            
            // Remove from active jobs after a delay
            setTimeout(() => {
              setActiveJobs(prev => prev.filter(job => job.id !== jobId));
            }, 10000); // Increased delay to 10 seconds to allow user to see completion
          }
        }
      } catch (error) {
        console.error('Error polling job status:', error);
        clearInterval(interval);
      }
    }, 2000); // Poll every 2 seconds
    
    // Store interval for cleanup
    setJobPollingInterval(interval);
  };

  // Cancel a job
  const cancelJob = async (jobId: string) => {
    try {
      const response = await api.post(`/reports/jobs/${jobId}/cancel`);
      if ((response.data as any).success) {
        setActiveJobs(prev => prev.map(job => 
          job.id === jobId ? { ...job, status: 'FAILED' as const, errorMessage: 'Cancelado por el usuario' } : job
        ));
      }
    } catch (error) {
      console.error('Error cancelling job:', error);
    }
  };

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (jobPollingInterval) {
        clearInterval(jobPollingInterval);
      }
    };
  }, [jobPollingInterval]);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'reproductive': return 'primary';
      case 'health': return 'success';
      case 'financial': return 'warning';
      case 'inventory': return 'info';
      default: return 'default';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'reproductive': return '🐹';
      case 'health': return '🏥';
      case 'financial': return '💰';
      case 'inventory': return '📦';
      default: return '📊';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Cargando plantillas de reportes...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Generador de Reportes
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadTemplates}
          disabled={loading}
        >
          Actualizar
        </Button>
      </Box>

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Plantillas disponibles */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Plantillas Disponibles
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        {templates.length > 0 ? (
          <Grid container spacing={3}>
            {templates.map((template) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={template.id}>
                <Card 
                  sx={{ 
                    height: '100%',
                    cursor: 'pointer',
                    '&:hover': { elevation: 4 }
                  }}
                  onClick={() => setSelectedTemplate(template)}
                >
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <Typography variant="h6" fontSize="1.2rem">
                        {getCategoryIcon(template.category)}
                      </Typography>
                      <Chip
                        label={template.category}
                        color={getCategoryColor(template.category) as any}
                        size="small"
                      />
                    </Box>
                    
                    <Typography variant="h6" gutterBottom>
                      {template.name}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" mb={2}>
                      {template.description}
                    </Typography>
                    
                    <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                      {template.sections.slice(0, 3).map((section, index) => (
                        <Chip
                          key={index}
                          label={section}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                      {template.sections.length > 3 && (
                        <Chip
                          label={`+${template.sections.length - 3} más`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                    
                    <Box display="flex" gap={1} mt={2}>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<ReportIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGenerateReport(template.id);
                        }}
                        disabled={generating}
                      >
                        Generar
                      </Button>
                      
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExportReport(template.id, 'pdf');
                        }}
                      >
                        <PictureAsPdf />
                      </IconButton>
                      
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExportReport(template.id, 'excel');
                        }}
                      >
                        <TableChart />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No hay plantillas de reportes disponibles
          </Typography>
        )}
      </Paper>

      {/* Reporte generado */}
      {generatedReport && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Reporte Generado
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Plantilla:</strong> {generatedReport.templateId}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Generado:</strong> {new Date(generatedReport.generatedAt).toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              Reporte generado exitosamente. Los datos están disponibles para exportación.
            </Typography>
          </Box>
        </Paper>
      )}

      {/* Trabajos activos */}
      {activeJobs.length > 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Exportaciones en Progreso
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          {activeJobs.map((job) => (
            <ExportProgress
              key={job.id}
              job={job}
              onCancel={cancelJob}
              onRetry={(jobId) => {
                // TODO: Implement retry functionality
                console.log('Retry job:', jobId);
                alert('Funcionalidad de reintento en desarrollo');
              }}
              onDownload={async (jobId, fileId, fileName) => {
                try {
                  const response = await api.get(`/reports/jobs/${jobId}/files/${fileId}/download`, {
                    responseType: 'blob'
                  });
                  
                  // Crear URL para descarga
                  const url = window.URL.createObjectURL(new Blob([response.data as any]));
                  const link = document.createElement('a');
                  link.href = url;
                  
                  // Obtener nombre del archivo del header o usar el proporcionado
                  const contentDisposition = response.headers['content-disposition'];
                  let downloadFileName = fileName;
                  if (contentDisposition) {
                    const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
                    if (fileNameMatch) {
                      downloadFileName = fileNameMatch[1];
                    }
                  }
                  
                  link.setAttribute('download', downloadFileName);
                  document.body.appendChild(link);
                  link.click();
                  link.remove();
                  window.URL.revokeObjectURL(url);
                  
                  console.log(`Archivo descargado exitosamente: ${downloadFileName}`);
                } catch (error: any) {
                  console.error('Error descargando archivo:', error);
                  setError(`Error descargando ${fileName}. El archivo puede haber expirado.`);
                }
              }}
              showDetails={true}
              compact={false}
            />
          ))}
        </Paper>
      )}

      {/* Historial de reportes */}
      <ReportsHistory />

      {/* Debug/Test Section - Remove in production */}
      <Paper sx={{ p: 3, mt: 3, bgcolor: '#f5f5f5' }}>
        <Typography variant="h6" gutterBottom>
          🔧 Debug - Test API Endpoints
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
          <Button 
            variant="outlined" 
            size="small"
            onClick={async () => {
              try {
                console.log('Testing /api/reports/templates...');
                const response = await api.get('/reports/templates');
                console.log('Templates response:', response.data);
                alert('Templates loaded successfully! Check console for details.');
              } catch (error: any) {
                console.error('Templates error:', error);
                alert(`Templates error: ${error.response?.data?.error || error.message}`);
              }
            }}
          >
            Test Templates
          </Button>
          
          <Button 
            variant="outlined" 
            size="small"
            onClick={async () => {
              try {
                console.log('Testing /api/reports/export/inventory...');
                const response = await api.post('/reports/export/inventory', {
                  format: 'PDF',
                  parameters: {
                    dateRange: {
                      from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                      to: new Date().toISOString()
                    }
                  },
                  options: {
                    includeCharts: true,
                    includeDetails: true,
                    pageSize: 'A4',
                    orientation: 'portrait',
                    compression: true
                  }
                });
                console.log('Export response:', response.data);
                alert(`Export successful! Job ID: ${(response.data as any).data?.jobId}`);
              } catch (error: unknown) {
                console.error('Export error:', error);
                alert(`Export error: ${(error as any).response?.data?.error || (error as any).message}`);
              }
            }}
          >
            Test Export
          </Button>
          
          <Button 
            variant="outlined" 
            size="small"
            onClick={async () => {
              try {
                console.log('Testing /api/reports/jobs/history...');
                const response = await api.get('/reports/jobs/history');
                console.log('Job history response:', response.data);
                alert('Job history loaded successfully! Check console for details.');
              } catch (error: unknown) {
                console.error('Job history error:', error);
                alert(`Job history error: ${(error as any).response?.data?.error || (error as any).message}`);
              }
            }}
          >
            Test Job History
          </Button>
          
          <Button 
            variant="outlined" 
            size="small"
            onClick={() => {
              const token = localStorage.getItem('token') || sessionStorage.getItem('token');
              console.log('Current token:', token);
              if (token) {
                try {
                  const payload = JSON.parse(atob(token.split('.')[1]));
                  const currentTime = Date.now() / 1000;
                  console.log('Token payload:', payload);
                  console.log('Current time:', currentTime);
                  console.log('Token exp:', payload.exp);
                  console.log('Token valid:', payload.exp > currentTime);
                  alert(`Token is ${payload.exp > currentTime ? 'valid' : 'expired'}. Check console for details.`);
                } catch (e) {
                  console.error('Token parse error:', e);
                  alert('Invalid token format');
                }
              } else {
                alert('No token found');
              }
            }}
          >
            Check Auth
          </Button>
        </Box>
        
        <Typography variant="caption" color="text.secondary">
          Use these buttons to test the API endpoints. Check the browser console for detailed responses.
        </Typography>
      </Paper>

      {/* Loading overlay */}
      {generating && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}
        >
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <CircularProgress size={60} />
            <Typography variant="h6" sx={{ mt: 2 }}>
              Generando reporte...
            </Typography>
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default ReportsGenerator;