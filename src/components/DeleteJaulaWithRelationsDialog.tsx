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
  ViewModule,
  Pets
} from '@mui/icons-material';
import api from '../services/api';

interface RelacionJaula {
  tipo: string;
  descripcion: string;
  cantidad: number;
  detalles: string[];
}

interface VerificacionRelacionesJaula {
  jaula: {
    id: number;
    nombre: string;
    galponNombre: string;
    descripcion?: string;
    capacidadMaxima: number;
    tipo: string;
  };
  relacionesEncontradas: RelacionJaula[];
  puedeEliminar: boolean;
  advertencias: string[];
}

interface DeleteJaulaWithRelationsDialogProps {
  open: boolean;
  onClose: () => void;
  jaulaId: number | null;
  onDeleteConfirmed: (jaulaId: number) => void;
  loading?: boolean;
}

const DeleteJaulaWithRelationsDialog: React.FC<DeleteJaulaWithRelationsDialogProps> = ({
  open,
  onClose,
  jaulaId,
  onDeleteConfirmed,
  loading = false
}) => {
  const [verificacion, setVerificacion] = useState<VerificacionRelacionesJaula | null>(null);
  const [loadingVerification, setLoadingVerification] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Verificar relaciones cuando se abre el diálogo
  React.useEffect(() => {
    if (open && jaulaId) {
      verificarRelaciones();
    } else {
      // Resetear estado cuando se cierra
      setVerificacion(null);
      setShowConfirmation(false);
      setDeleting(false);
    }
  }, [open, jaulaId]);

  const verificarRelaciones = async () => {
    if (!jaulaId) return;

    setLoadingVerification(true);
    try {
      const response = await api.get(`/galpones/jaulas/${jaulaId}/verificar-relaciones`);

      if (response.data.success) {
        setVerificacion(response.data.data);
      } else {
        console.error('Error al verificar relaciones de la jaula');
      }
    } catch (error) {
      console.error('Error al verificar relaciones de la jaula:', error);
    } finally {
      setLoadingVerification(false);
    }
  };

  const handleDeleteWithRelations = async () => {
    if (!jaulaId) return;

    setDeleting(true);
    try {
      const response = await api.delete(`/galpones/jaulas/${jaulaId}/eliminar-con-relaciones`);

      if (response.data.success) {
        onDeleteConfirmed(jaulaId);
        onClose();
      } else {
        console.error('Error al eliminar jaula con relaciones');
      }
    } catch (error) {
      console.error('Error al eliminar jaula con relaciones:', error);
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
            <Typography>Verificando relaciones de la jaula...</Typography>
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
            {/* Información de la jaula */}
            <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Jaula a eliminar:</strong>
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                <ViewModule color="primary" />
                <Chip label={`Jaula ${verificacion.jaula.nombre}`} size="small" color="primary" />
                <Chip label={`Galpón ${verificacion.jaula.galponNombre}`} size="small" />
                <Chip label={`Tipo: ${verificacion.jaula.tipo}`} size="small" />
                <Chip label={`Capacidad: ${verificacion.jaula.capacidadMaxima}`} size="small" />
              </Box>
              {verificacion.jaula.descripcion && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {verificacion.jaula.descripcion}
                </Typography>
              )}
            </Box>

            {verificacion.relacionesEncontradas.length === 0 ? (
              <Alert severity="success" sx={{ mb: 2 }}>
                <Typography>
                  Esta jaula no tiene cuyes asociados. 
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
                    Esta jaula contiene <strong>{getTotalRegistros()}</strong> cuyes 
                    que también serán reubicados o eliminados.
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
                  <strong>Cuyes que se verán afectados:</strong>
                </Typography>

                {verificacion.relacionesEncontradas.map((relacion, index) => (
                  <Accordion key={index} sx={{ mb: 1 }}>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                        <Pets />
                        <Chip 
                          label={relacion.tipo.toUpperCase()} 
                          color={getTipoColor(relacion.tipo)}
                          size="small" 
                        />
                        <Typography variant="body2" sx={{ flex: 1 }}>
                          {relacion.descripcion}
                        </Typography>
                        <Chip 
                          label={`${relacion.cantidad} cuy${relacion.cantidad !== 1 ? 'es' : ''}`}
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
                              primary={`... y ${relacion.detalles.length - 10} cuy(es) más`}
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
              <strong>¿Está seguro que desea eliminar esta jaula?</strong>
            </Typography>
            <Typography variant="body2">
              Esta acción eliminará permanentemente la jaula "{verificacion.jaula.nombre}" del galpón "{verificacion.jaula.galponNombre}" y afectará a {getTotalRegistros()} cuyes.
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
                Eliminar Jaula
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

export default DeleteJaulaWithRelationsDialog;