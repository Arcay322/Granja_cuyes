import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Switch,
  FormControlLabel,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Divider,
  Alert,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Email as EmailIcon,
  Webhook as WebhookIcon,
  Phone as PhoneIcon,
  Save as SaveIcon,
  PlayArrow as TestIcon,
  Add as AddIcon
} from '@mui/icons-material';
import api from '../../services/api';
import { isSuccessfulApiResponse, extractErrorMessage } from '../../utils/typeGuards';
import { AlertChannelsResponse } from '../../types/api';

interface NotificationChannel {
  id: string;
  name: string;
  type: 'in_app' | 'email' | 'webhook' | 'push';
  config: any;
  enabled: boolean;
}

interface AlertsConfigurationProps {
  onConfigurationChange?: () => void;
}

const AlertsConfiguration: React.FC<AlertsConfigurationProps> = ({
  onConfigurationChange
}) => {
  const [channels, setChannels] = useState<NotificationChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [testDialog, setTestDialog] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<string>('');

  // Cargar canales de notificación
  const loadChannels = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/alerts/channels');
      
      if (isSuccessfulApiResponse<NotificationChannel[]>(response.data)) {
        setChannels(response.data.data);
      }
    } catch (error: unknown) {
      console.error('Error cargando canales:', error);
      setError(extractErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChannels();
  }, [loadChannels]);

  // Actualizar canal
  const updateChannel = async (channelId: string, updates: Partial<NotificationChannel>) => {
    try {
      setSaving(true);
      const response = await api.patch(`/alerts/channels/${channelId}`, updates);
      
      if (isSuccessfulApiResponse(response.data)) {
        setChannels(prev => prev.map(channel => 
          channel.id === channelId 
            ? { ...channel, ...updates }
            : channel
        ));
        setSuccess('Configuración actualizada exitosamente');
        onConfigurationChange?.();
      }
    } catch (error: unknown) {
      console.error('Error actualizando canal:', error);
      setError(extractErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  // Enviar notificación de prueba
  const sendTestNotification = async () => {
    try {
      setSaving(true);
      const response = await api.post('/alerts/test', {
        channelId: selectedChannel || undefined
      });
      
      if (isSuccessfulApiResponse(response.data)) {
        setSuccess('Notificación de prueba enviada exitosamente');
        setTestDialog(false);
      }
    } catch (error: unknown) {
      console.error('Error enviando notificación de prueba:', error);
      setError(extractErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  // Obtener icono del canal
  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'in_app':
        return <NotificationsIcon />;
      case 'email':
        return <EmailIcon />;
      case 'webhook':
        return <WebhookIcon />;
      case 'push':
        return <PhoneIcon />;
      default:
        return <SettingsIcon />;
    }
  };

  // Obtener nombre del tipo de canal
  const getChannelTypeName = (type: string) => {
    const names: Record<string, string> = {
      in_app: 'En la aplicación',
      email: 'Correo electrónico',
      webhook: 'Webhook',
      push: 'Notificaciones push'
    };
    return names[type] || type;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Configuración de Alertas
        </Typography>
        <Button
          variant="outlined"
          startIcon={<TestIcon />}
          onClick={() => setTestDialog(true)}
          disabled={saving}
        >
          Probar Notificaciones
        </Button>
      </Box>

      {/* Mensajes */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Canales de notificación */}
      <Typography variant="h5" gutterBottom>
        Canales de Notificación
      </Typography>

      <Grid container spacing={3}>
        {channels.map((channel) => (
          <Grid size={{ xs: 12, md: 6 }} key={channel.id}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  {getChannelIcon(channel.type)}
                  <Box>
                    <Typography variant="h6">
                      {channel.name}
                    </Typography>
                    <Chip
                      label={getChannelTypeName(channel.type)}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </Box>

                <FormControlLabel
                  control={
                    <Switch
                      checked={channel.enabled}
                      onChange={(e) => updateChannel(channel.id, { enabled: e.target.checked })}
                      disabled={saving}
                    />
                  }
                  label="Habilitado"
                />

                {/* Configuración específica por tipo de canal */}
                {channel.type === 'email' && (
                  <Box mt={2}>
                    <TextField
                      fullWidth
                      label="Servidor SMTP"
                      value={channel.config?.smtp?.host || ''}
                      onChange={(e) => updateChannel(channel.id, {
                        config: {
                          ...channel.config,
                          smtp: {
                            ...channel.config?.smtp,
                            host: e.target.value
                          }
                        }
                      })}
                      size="small"
                      margin="dense"
                    />
                    <TextField
                      fullWidth
                      label="Puerto"
                      type="number"
                      value={channel.config?.smtp?.port || ''}
                      onChange={(e) => updateChannel(channel.id, {
                        config: {
                          ...channel.config,
                          smtp: {
                            ...channel.config?.smtp,
                            port: parseInt(e.target.value)
                          }
                        }
                      })}
                      size="small"
                      margin="dense"
                    />
                    <TextField
                      fullWidth
                      label="Usuario"
                      value={channel.config?.smtp?.auth?.user || ''}
                      onChange={(e) => updateChannel(channel.id, {
                        config: {
                          ...channel.config,
                          smtp: {
                            ...channel.config?.smtp,
                            auth: {
                              ...channel.config?.smtp?.auth,
                              user: e.target.value
                            }
                          }
                        }
                      })}
                      size="small"
                      margin="dense"
                    />
                    <TextField
                      fullWidth
                      label="Contraseña"
                      type="password"
                      value={channel.config?.smtp?.auth?.pass || ''}
                      onChange={(e) => updateChannel(channel.id, {
                        config: {
                          ...channel.config,
                          smtp: {
                            ...channel.config?.smtp,
                            auth: {
                              ...channel.config?.smtp?.auth,
                              pass: e.target.value
                            }
                          }
                        }
                      })}
                      size="small"
                      margin="dense"
                    />
                    <TextField
                      fullWidth
                      label="Remitente"
                      value={channel.config?.from || ''}
                      onChange={(e) => updateChannel(channel.id, {
                        config: {
                          ...channel.config,
                          from: e.target.value
                        }
                      })}
                      size="small"
                      margin="dense"
                    />
                  </Box>
                )}

                {channel.type === 'webhook' && (
                  <Box mt={2}>
                    <TextField
                      fullWidth
                      label="URL del Webhook"
                      value={channel.config?.url || ''}
                      onChange={(e) => updateChannel(channel.id, {
                        config: {
                          ...channel.config,
                          url: e.target.value
                        }
                      })}
                      size="small"
                      margin="dense"
                    />
                    <TextField
                      fullWidth
                      label="Método HTTP"
                      select
                      value={channel.config?.method || 'POST'}
                      onChange={(e) => updateChannel(channel.id, {
                        config: {
                          ...channel.config,
                          method: e.target.value
                        }
                      })}
                      size="small"
                      margin="dense"
                    >
                      <MenuItem value="POST">POST</MenuItem>
                      <MenuItem value="PUT">PUT</MenuItem>
                      <MenuItem value="PATCH">PATCH</MenuItem>
                    </TextField>
                  </Box>
                )}
              </CardContent>

              <CardActions>
                <Button
                  size="small"
                  startIcon={<TestIcon />}
                  onClick={() => {
                    setSelectedChannel(channel.id);
                    setTestDialog(true);
                  }}
                  disabled={!channel.enabled || saving}
                >
                  Probar
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Configuración de tipos de alertas */}
      <Box mt={4}>
        <Typography variant="h5" gutterBottom>
          Tipos de Alertas
        </Typography>
        
        <Paper sx={{ p: 3 }}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="h6" gutterBottom>
                Recordatorios de Parto
              </Typography>
              <FormControlLabel
                control={<Switch defaultChecked />}
                label="Habilitar recordatorios"
              />
              <TextField
                fullWidth
                label="Días de anticipación"
                type="number"
                defaultValue={7}
                size="small"
                margin="dense"
                helperText="Días antes del parto para enviar recordatorio"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="h6" gutterBottom>
                Preñeces Vencidas
              </Typography>
              <FormControlLabel
                control={<Switch defaultChecked />}
                label="Habilitar alertas"
              />
              <TextField
                fullWidth
                label="Días de gestación límite"
                type="number"
                defaultValue={75}
                size="small"
                margin="dense"
                helperText="Días después de los cuales considerar preñez vencida"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="h6" gutterBottom>
                Reproductoras Inactivas
              </Typography>
              <FormControlLabel
                control={<Switch defaultChecked />}
                label="Habilitar alertas"
              />
              <TextField
                fullWidth
                label="Días de inactividad"
                type="number"
                defaultValue={90}
                size="small"
                margin="dense"
                helperText="Días sin actividad reproductiva para alertar"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="h6" gutterBottom>
                Capacidad de Galpones
              </Typography>
              <FormControlLabel
                control={<Switch defaultChecked />}
                label="Habilitar alertas"
              />
              <TextField
                fullWidth
                label="Porcentaje de ocupación crítico"
                type="number"
                defaultValue={90}
                size="small"
                margin="dense"
                helperText="Porcentaje de ocupación para alertar"
              />
            </Grid>
          </Grid>

          <Box mt={3}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              disabled={saving}
            >
              Guardar Configuración
            </Button>
          </Box>
        </Paper>
      </Box>

      {/* Dialog de prueba */}
      <Dialog open={testDialog} onClose={() => setTestDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Enviar Notificación de Prueba</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Selecciona un canal específico o deja vacío para enviar a todos los canales habilitados.
          </Typography>
          <FormControl fullWidth>
            <InputLabel>Canal (opcional)</InputLabel>
            <Select
              value={selectedChannel}
              label="Canal (opcional)"
              onChange={(e) => setSelectedChannel(e.target.value)}
            >
              <MenuItem value="">Todos los canales habilitados</MenuItem>
              {channels.filter(c => c.enabled).map((channel) => (
                <MenuItem key={channel.id} value={channel.id}>
                  {channel.name} ({getChannelTypeName(channel.type)})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTestDialog(false)}>
            Cancelar
          </Button>
          <Button
            onClick={sendTestNotification}
            variant="contained"
            disabled={saving}
          >
            {saving ? <CircularProgress size={20} /> : 'Enviar Prueba'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AlertsConfiguration;