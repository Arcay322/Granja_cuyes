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
import {
  ExpandMore,
  Warning,
  Delete,
  Cancel,
  Home,
  Pets
} from '@mui/icons-material';
import api from '../services/api';

interface RelacionGalpon {
  tipo: string;
  descripcion: string;
  cantidad: number;
  detalles: string[];
}

interface VerificacionRelacionesGalpon {
  galpon: {
    id: number;
    nombre: string;
    descripcion?: string;
    ubicacion?: string;
    capacidadMaxima: number;
  };
  relacionesEncontradas: RelacionGalpon[];
  puedeEliminar: boolean;
  advertencias: string[];
}

interface DeleteGalponWithRelationsDialogProps {
  open: boolean;
  onClose: () => void;
  galponId: number | null;
  onDeleteConfirmed: (galponId: number) => void;
  loading?: boolean;
}

const DeleteGalponWithRelationsDialog: React.FC<DeleteGalponWithRelationsDialogProps> = ({
  open,
  onClose,
  galponId,
  onDeleteConfirmed,
  loading = false
}) => {
  const [verificacion, setVerificacion] = useState<VerificacionRelacionesGalpon | null>(null);
  const [loadingVerification, setLoadingVerification] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Verificar relaciones cuando se abre el diálogo
  React.useEffect(() => {
    if (open && galponId) {
      verificarRelaciones();
    } else {
      // Resetear estado cuando se cierra
      setVerificacion(null);
      setShowConfirmation(false);
      setDeleting(false);
    }
  }, [open, galponId]);

  const verificarRelaciones = async () => {
    if (!galponId) return;

    setLoadingVerification(true);
    try {
      const response = await api.get(`/galpones/${galponId}/verificar-relaciones`);

      if (response.data.success) {
        setVerificacion(response.data.data);
      } else {
        console.error('Error al verificar relaciones del galpón');
      }
    } catch (error) {
      console.error('Error al verificar relaciones del galpón:', error);
    } finally {
      setLoadingVerification(false);
    }
  };

  const handleDeleteWithRelations = async () => {
    if (!galponId) return;

    setDeleting(true);
    try {
      const response = await api.delete(`/galpones/${galponId}/eliminar-con-relaciones`);

      if (response.data.success) {
        onDeleteConfirmed(galponId);
        onClose();
      } else {
        console.error('Error al eliminar galpón con relaciones');
      }
    } catch (error) {
      console.error('Error al eliminar galpón con relaciones:', error);
    } finally {
      setDeleting(false);
    }
  };

  const getTotalRegistros = () => {
    if (!verificacion) return 0;
    return verificacion.relacionesEncontradas.reduce((sum, rel) => sum + rel.cantidad, 0);
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case 'cuyes':
        return 'primary';
      case 'jaulas':
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
            <Typography>Verificando relaciones del galpón...</Typography>
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
            {/* Información del galpón */}
            <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Galpón a eliminar:</strong>
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                <Home color="primary" />
                <Chip label={`Galpón ${verificacion.galpon.nombre}`} size="small" color="primary" />
                <Chip label={`Capacidad: ${verificacion.galpon.capacidadMaxima}`} size="small" />
                {verificacion.galpon.ubicacion && (
                  <Chip label={`📍 ${verificacion.galpon.ubicacion}`} size="small" />
                )}
              </Box>
              {verificacion.galpon.descripcion && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {verificacion.galpon.descripcion}
                </Typography>
              )}
            </Box>

            {verificacion.relacionesEncontradas.length === 0 ? (
              <Alert severity="success" sx={{ mb: 2 }}>
                <Typography>
                  Este galpón no tiene cuyes ni jaulas asociadas. 
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
                    Este galpón contiene <strong>{getTotalRegistros()}</strong> elementos 
                    que también serán eliminados permanentemente.
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
                  <strong>Elementos que se eliminarán:</strong>
                </Typography>

                {verificacion.relacionesEncontradas.map((relacion, index) => (
                  <Accordion key={index} sx={{ mb: 1 }}>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                        {relacion.tipo === 'cuyes' ? <Pets /> : <Home />}
                        <Chip 
                          label={relacion.tipo.toUpperCase()} 
                          color={getTipoColor(relacion.tipo)}
                          size="small" 
                        />
                        <Typography variant="body2" sx={{ flex: 1 }}>
                          {relacion.descripcion}
                        </Typography>
                        <Chip 
                          label={`${relacion.cantidad} elemento${relacion.cantidad !== 1 ? 's' : ''}`}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <List dense>
                        {relacion.detalles.slice(0, 10).map((detalle, idx) => (
                          <ListItem key={idx}>
                            <ListItemText 
                              primary={detalle}
                              primaryTypographyProps={{ variant: 'body2' }}
                            />
                          </ListItem>
                        ))}
                        {relacion.detalles.length > 10 && (
                          <ListItem>
                            <ListItemText 
                              primary={`... y ${relacion.detalles.length - 10} elemento(s) más`}
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
              <strong>¿Está seguro que desea eliminar este galpón?</strong>
            </Typography>
            <Typography variant="body2">
              Esta acción eliminará permanentemente el galpón "{verificacion.galpon.nombre}" y todos sus {getTotalRegistros()} elementos relacionados.
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
                Eliminar Galpón
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

export default DeleteGalponWithRelationsDialog;