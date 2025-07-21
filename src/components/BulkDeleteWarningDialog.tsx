import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Paper,
  LinearProgress
} from '../utils/mui';
import {
  Warning,
  Delete,
  Cancel,
  Pets,
  HealthAndSafety,
  FamilyRestroom,
  ShoppingCart,
  Restaurant,
  Info
} from '@mui/icons-material';

interface CuyWithRelations {
  id: number;
  tieneRelaciones: boolean;
  totalRelaciones: number;
  raza?: string;
  sexo?: string;
  galpon?: string;
  jaula?: string;
}

interface BulkDeleteWarningDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedCount: number;
  cuyesWithRelations: CuyWithRelations[];
  totalRelations: number;
  loading?: boolean;
}

const BulkDeleteWarningDialog: React.FC<BulkDeleteWarningDialogProps> = ({
  open,
  onClose,
  onConfirm,
  selectedCount,
  cuyesWithRelations,
  totalRelations,
  loading = false
}) => {
  const cuyesSinRelaciones = selectedCount - cuyesWithRelations.length;
  const porcentajeConRelaciones = (cuyesWithRelations.length / selectedCount) * 100;

  const getRelationIcon = (count: number) => {
    if (count >= 10) return <HealthAndSafety color="error" />;
    if (count >= 5) return <FamilyRestroom color="warning" />;
    return <Info color="info" />;
  };

  const getSeverityLevel = () => {
    if (cuyesWithRelations.length === 0) return 'success';
    if (porcentajeConRelaciones >= 50) return 'error';
    if (porcentajeConRelaciones >= 25) return 'warning';
    return 'info';
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
        }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Warning 
            sx={{ 
              fontSize: 32,
              color: getSeverityLevel() === 'error' ? 'error.main' : 
                     getSeverityLevel() === 'warning' ? 'warning.main' : 'info.main'
            }} 
          />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 0.5 }}>
              Confirmación de Eliminación Múltiple
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Verificación de registros relacionados completada
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pb: 2 }}>
        {/* Resumen principal */}
        <Alert 
          severity={getSeverityLevel()} 
          sx={{ 
            mb: 3,
            '& .MuiAlert-message': { width: '100%' }
          }}
        >
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
              {cuyesWithRelations.length === 0 
                ? '✅ Eliminación Segura' 
                : `⚠️ ${cuyesWithRelations.length} cuyes tienen registros relacionados`
              }
            </Typography>
            <Typography variant="body2">
              {cuyesWithRelations.length === 0 
                ? `Los ${selectedCount} cuyes seleccionados no tienen registros relacionados y pueden eliminarse de forma segura.`
                : `Se eliminarán ${totalRelations} registros relacionados en total de los módulos del sistema.`
              }
            </Typography>
          </Box>
        </Alert>

        {/* Estadísticas visuales */}
        <Paper sx={{ p: 3, mb: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Pets color="primary" />
            Resumen de Eliminación
          </Typography>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 2 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary.main" sx={{ fontWeight: 'bold' }}>
                {selectedCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Cuyes Seleccionados
              </Typography>
            </Box>
            
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold' }}>
                {cuyesSinRelaciones}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Sin Relaciones
              </Typography>
            </Box>
            
            <Box sx={{ textAlign: 'center' }}>
              <Typography 
                variant="h4" 
                color={cuyesWithRelations.length > 0 ? "warning.main" : "success.main"}
                sx={{ fontWeight: 'bold' }}
              >
                {cuyesWithRelations.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Con Relaciones
              </Typography>
            </Box>
            
            <Box sx={{ textAlign: 'center' }}>
              <Typography 
                variant="h4" 
                color={totalRelations > 0 ? "error.main" : "success.main"}
                sx={{ fontWeight: 'bold' }}
              >
                {totalRelations}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Registros a Eliminar
              </Typography>
            </Box>
          </Box>

          {/* Barra de progreso visual */}
          {selectedCount > 0 && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Distribución de cuyes
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {Math.round(porcentajeConRelaciones)}% con relaciones
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={porcentajeConRelaciones}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: 'success.light',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: porcentajeConRelaciones > 50 ? 'error.main' : 
                             porcentajeConRelaciones > 25 ? 'warning.main' : 'info.main',
                    borderRadius: 4
                  }
                }}
              />
            </Box>
          )}
        </Paper>

        {/* Detalles específicos de eliminación */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
            📋 Detalles de la Eliminación:
          </Typography>
          
          {/* Cuyes sin relaciones */}
          {cuyesSinRelaciones > 0 && (
            <Alert severity="success" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                <strong>✅ {cuyesSinRelaciones} cuyes sin registros relacionados</strong>
              </Typography>
              <Typography variant="body2">
                Estos cuyes se pueden eliminar de forma segura sin afectar otros módulos del sistema.
              </Typography>
            </Alert>
          )}

          {/* Cuyes con relaciones */}
          {cuyesWithRelations.length > 0 && (
            <>
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  <strong>⚠️ {cuyesWithRelations.length} cuyes con registros relacionados</strong>
                </Typography>
                <Typography variant="body2">
                  Estos cuyes tienen registros en otros módulos que también serán eliminados:
                </Typography>
              </Alert>

              <Paper sx={{ maxHeight: 350, overflow: 'auto', border: '1px solid', borderColor: 'divider', mb: 2 }}>
                <List dense>
                  {cuyesWithRelations.map((cuy, index) => (
                    <React.Fragment key={cuy.id}>
                      <ListItem sx={{ py: 1.5 }}>
                        <ListItemIcon>
                          {getRelationIcon(cuy.totalRelaciones)}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ mb: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                                <Chip label={`Cuy #${cuy.id}`} size="small" color="primary" />
                                {cuy.raza && <Chip label={cuy.raza} size="small" variant="outlined" />}
                                {cuy.sexo && <Chip label={cuy.sexo === 'M' ? 'Macho' : 'Hembra'} size="small" variant="outlined" />}
                                {cuy.galpon && cuy.jaula && (
                                  <Chip label={`📍 ${cuy.galpon}-${cuy.jaula}`} size="small" variant="outlined" />
                                )}
                              </Box>
                              <Typography variant="body2" color="error.main" sx={{ fontWeight: 'medium' }}>
                                🗑️ Se eliminarán {cuy.totalRelaciones} registro{cuy.totalRelaciones !== 1 ? 's' : ''} relacionado{cuy.totalRelaciones !== 1 ? 's' : ''} de:
                              </Typography>
                              <Box sx={{ ml: 2, mt: 0.5 }}>
                                <Typography variant="body2" color="text.secondary">
                                  • Módulos de Salud, Reproducción, Ventas y Alimentación
                                </Typography>
                              </Box>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < cuyesWithRelations.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </Paper>

              {/* Resumen de registros por módulo */}
              <Paper sx={{ p: 2, bgcolor: 'error.50', border: '1px solid', borderColor: 'error.200' }}>
                <Typography variant="subtitle2" gutterBottom sx={{ color: 'error.main', fontWeight: 'bold' }}>
                  📊 Resumen de Registros a Eliminar:
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <HealthAndSafety color="error" fontSize="small" />
                    <Typography variant="body2">Registros de Salud</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FamilyRestroom color="error" fontSize="small" />
                    <Typography variant="body2">Registros de Reproducción</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Info color="error" fontSize="small" />
                    <Typography variant="body2">Registros de Ventas</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Info color="error" fontSize="small" />
                    <Typography variant="body2">Registros de Alimentación</Typography>
                  </Box>
                </Box>
                <Typography variant="body2" sx={{ mt: 1, fontWeight: 'medium', color: 'error.main' }}>
                  Total: {totalRelations} registros serán eliminados permanentemente
                </Typography>
              </Paper>
            </>
          )}
        </Box>

        {/* Advertencia final */}
        {totalRelations > 0 && (
          <Alert severity="warning" sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              <strong>⚠️ Esta acción no se puede deshacer</strong>
            </Typography>
            <Typography variant="body2">
              Se eliminarán permanentemente {selectedCount} cuyes y {totalRelations} registros relacionados 
              de los módulos de Salud, Reproducción, Ventas y Alimentación.
            </Typography>
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 2 }}>
        <Button 
          onClick={onClose}
          variant="outlined"
          size="large"
          startIcon={<Cancel />}
          disabled={loading}
          sx={{ minWidth: 120 }}
        >
          Cancelar
        </Button>
        
        <Button
          onClick={onConfirm}
          variant="contained"
          color={cuyesWithRelations.length > 0 ? "warning" : "error"}
          size="large"
          startIcon={<Delete />}
          disabled={loading}
          sx={{ 
            minWidth: 160,
            fontWeight: 'bold'
          }}
        >
          {loading ? 'Eliminando...' : 
           cuyesWithRelations.length > 0 ? 'Eliminar con Relaciones' : 'Confirmar Eliminación'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BulkDeleteWarningDialog;