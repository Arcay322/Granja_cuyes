import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
  CircularProgress
} from '../utils/mui';
import { isSuccessfulApiResponse } from '../utils/typeGuards';
import {
  ExpandMore,
  Warning,
  Delete,
  Cancel,
  Info
} from '@mui/icons-material';

interface RelacionCuy {
  modulo: string;
  descripcion: string;
  cantidad: number;
  detalles: string[];
}

interface VerificacionRelaciones {
  cuy: {
    id: number;
    raza: string;
    sexo: string;
    galpon: string;
    jaula: string;
    etapaVida: string;
  };
  relacionesEncontradas: RelacionCuy[];
  puedeEliminar: boolean;
  advertencias: string[];
}

interface DeleteCuyWithRelationsDialogProps {
  open: boolean;
  onClose: () => void;
  cuyId: number | null;
  onDeleteConfirmed: (cuyId: number) => void;
  loading?: boolean;
}

const DeleteCuyWithRelationsDialog: React.FC<DeleteCuyWithRelationsDialogProps> = ({
  open,
  onClose,
  cuyId,
  onDeleteConfirmed,
  loading = false
}) => {
  const [verificacion, setVerificacion] = useState<VerificacionRelaciones | null>(null);
  const [loadingVerification, setLoadingVerification] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Verificar relaciones cuando se abre el diálogo
  React.useEffect(() => {
    if (open && cuyId) {
      verificarRelaciones();
    } else {
      // Resetear estado cuando se cierra
      setVerificacion(null);
      setShowConfirmation(false);
      setDeleting(false);
    }
  }, [open, cuyId]);

  const verificarRelaciones = async () => {
    if (!cuyId) return;

    setLoadingVerification(true);
    try {
      // Usar el servicio API centralizado en lugar de fetch directo
      const { default: api } = await import('../services/api');
      const response = await api.get(`/cuyes/${cuyId}/verificar-relaciones`);

      if (isSuccessfulApiResponse<any>(response.data)) {
        setVerificacion(response.data.data);
      } else {
        console.error('Error al verificar relaciones');
      }
    } catch (error) {
      console.error('Error al verificar relaciones:', error);
    } finally {
      setLoadingVerification(false);
    }
  };

  const handleDeleteWithRelations = async () => {
    if (!cuyId) return;

    setDeleting(true);
    try {
      // Usar el servicio API centralizado en lugar de fetch directo
      const { default: api } = await import('../services/api');
      const response = await api.delete(`/cuyes/${cuyId}/eliminar-con-relaciones`);

      if (isSuccessfulApiResponse<any>(response.data)) {
        onDeleteConfirmed(cuyId);
        onClose();
      } else {
        console.error('Error al eliminar cuy con relaciones');
      }
    } catch (error) {
      console.error('Error al eliminar cuy con relaciones:', error);
    } finally {
      setDeleting(false);
    }
  };

  const getTotalRegistros = () => {
    if (!verificacion) return 0;
    return verificacion.relacionesEncontradas.reduce((sum, rel) => sum + rel.cantidad, 0);
  };

  const getModuloColor = (modulo: string) => {
    switch (modulo.toLowerCase()) {
      case 'salud':
        return 'error';
      case 'reproducción - camadas':
      case 'reproducción - camadas (padre)':
        return 'success';
      case 'reproducción - preñez':
        return 'warning';
      case 'ventas':
        return 'info';
      case 'alimentación':
        return 'secondary';
      default:
        return 'default';
    }
  };

  if (loadingVerification) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
            <CircularProgress sx={{ mr: 2 }} />
            <Typography>Verificando relaciones del cuy...</Typography>
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  if (!verificacion) {
    return null;
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning color="warning" />
          <Typography variant="h6">
            {showConfirmation ? 'Confirmar Eliminación' : 'Verificación de Eliminación'}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {!showConfirmation ? (
          <>
            {/* Información del cuy */}
            <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Cuy a eliminar:</strong>
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip label={`ID: ${verificacion.cuy.id}`} size="small" />
                <Chip label={`Raza: ${verificacion.cuy.raza}`} size="small" />
                <Chip label={`Sexo: ${verificacion.cuy.sexo}`} size="small" />
                <Chip label={`${verificacion.cuy.galpon}-${verificacion.cuy.jaula}`} size="small" />
                <Chip label={verificacion.cuy.etapaVida} size="small" />
              </Box>
            </Box>

            {verificacion.relacionesEncontradas.length === 0 ? (
              <Alert severity="success" sx={{ mb: 2 }}>
                <Typography>
                  Este cuy no tiene registros relacionados en otros módulos. 
                  Se puede eliminar de forma segura.
                </Typography>
              </Alert>
            ) : (
              <>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    <strong>¡Atención!</strong>
                  </Typography>
                  <Typography variant="body2">
                    Este cuy tiene <strong>{verificacion.relacionesEncontradas.length}</strong> tipo(s) 
                    de registros relacionados con un total de <strong>{getTotalRegistros()}</strong> registros.
                  </Typography>
                </Alert>

                {/* Advertencias */}
                {verificacion.advertencias.map((advertencia, index) => (
                  <Alert 
                    key={index} 
                    severity={advertencia.includes('⚠️') ? 'error' : 'info'} 
                    sx={{ mb: 1 }}
                  >
                    <Typography variant="body2">
                      {advertencia}
                    </Typography>
                  </Alert>
                ))}

                <Divider sx={{ my: 2 }} />

                {/* Detalles de relaciones */}
                <Typography variant="subtitle2" gutterBottom>
                  <strong>Registros que se eliminarán:</strong>
                </Typography>

                {verificacion.relacionesEncontradas.map((relacion, index) => (
                  <Accordion key={index} sx={{ mb: 1 }}>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                        <Chip 
                          label={relacion.modulo} 
                          color={getModuloColor(relacion.modulo)}
                          size="small" 
                        />
                        <Typography variant="body2" sx={{ flex: 1 }}>
                          {relacion.descripcion}
                        </Typography>
                        <Chip 
                          label={`${relacion.cantidad} registro${relacion.cantidad !== 1 ? 's' : ''}`}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <List dense>
                        {relacion.detalles.slice(0, 5).map((detalle, idx) => (
                          <ListItem key={idx}>
                            <ListItemText 
                              primary={detalle}
                              primaryTypographyProps={{ variant: 'body2' }}
                            />
                          </ListItem>
                        ))}
                        {relacion.detalles.length > 5 && (
                          <ListItem>
                            <ListItemText 
                              primary={`... y ${relacion.detalles.length - 5} registro(s) más`}
                              primaryTypographyProps={{ 
                                variant: 'body2', 
                                fontStyle: 'italic',
                                color: 'text.secondary'
                              }}
                            />
                          </ListItem>
                        )}
                      </List>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </>
            )}
          </>
        ) : (
          <Alert severity="error">
            <Typography variant="subtitle2" gutterBottom>
              <strong>¿Está seguro que desea eliminar este cuy?</strong>
            </Typography>
            <Typography variant="body2">
              Esta acción eliminará permanentemente el cuy y todos sus {getTotalRegistros()} registros relacionados.
              <br />
              <strong>Esta acción no se puede deshacer.</strong>
            </Typography>
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button 
          onClick={onClose} 
          startIcon={<Cancel />}
          disabled={deleting}
        >
          Cancelar
        </Button>

        {!showConfirmation ? (
          <>
            {verificacion.relacionesEncontradas.length === 0 ? (
              <Button
                onClick={() => setShowConfirmation(true)}
                variant="contained"
                color="error"
                startIcon={<Delete />}
              >
                Eliminar Cuy
              </Button>
            ) : (
              <Button
                onClick={() => setShowConfirmation(true)}
                variant="contained"
                color="warning"
                startIcon={<Warning />}
              >
                Eliminar de Todas Formas
              </Button>
            )}
          </>
        ) : (
          <Button
            onClick={handleDeleteWithRelations}
            variant="contained"
            color="error"
            startIcon={deleting ? <CircularProgress size={16} /> : <Delete />}
            disabled={deleting}
          >
            {deleting ? 'Eliminando...' : 'Confirmar Eliminación'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default DeleteCuyWithRelationsDialog;